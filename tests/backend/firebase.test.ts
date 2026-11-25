import {beforeAll,afterAll,describe,test,expect} from 'bun:test';
import {readFileSync} from 'node:fs';
import {initializeTestEnvironment,assertFails,assertSucceeds,type RulesTestEnvironment} from '@firebase/rules-unit-testing';
import {doc,runTransaction,getDoc,collection,getDocs,serverTimestamp,setDoc,deleteDoc} from 'firebase/firestore';
import {ref,set,get} from 'firebase/database';
import {encodeEvent,decodeEvent} from '../../src/lib/backend/event-codec';
import {sanctuaryFixture} from '../../scripts/fixtures/sanctuary-review';
import {applyEvent,commandEvent,replay,type State,type Command} from '../../src/lib/engine/engine';
const enabled=!!process.env.FIRESTORE_EMULATOR_HOST;let env:RulesTestEnvironment;
(enabled?describe:describe.skip)('Firebase durable events and live drafts',()=>{
 beforeAll(async()=>{env=await initializeTestEnvironment({projectId:'demo-higher-powers',firestore:{host:'127.0.0.1',port:18301,rules:readFileSync('firestore.rules','utf8')},database:{host:'127.0.0.1',port:19001,rules:readFileSync('database.rules.json','utf8')}});});
 afterAll(async()=>{await env.cleanup();});
 const meta=(s:State)=>({version:1,owner:s.owner,members:s.players.map(p=>p.id),bots:s.players.filter(p=>p.bot).map(p=>p.id),phase:s.phase,revision:s.revision,...(s.tabletop?{locals:s.players.filter(p=>p.local).map(p=>p.id)}:{})});
 async function write(id:string,auth:string,s:State|null,actor:string,c:Command){const db=env.authenticatedContext(auth).firestore(),event=commandEvent(s,actor,c,crypto.randomUUID()),next=applyEvent(s,event);await runTransaction(db,async tx=>{const room=doc(db,'games',id);await tx.get(room);tx.set(room,meta(next));tx.set(doc(room,'events',String(event.sequence)),{...encodeEvent(event),createdAt:serverTimestamp()});});return next;}
 test('membership, actor control, immutable log, atomic revision, and competing joins',async()=>{
  const id=crypto.randomUUID();let s=await write(id,'host',null,'host',{type:'create',name:'Host',seed:'cloud'});
  await assertFails(getDocs(collection(env.authenticatedContext('outsider').firestore(),'games',id,'events')));
  s=await write(id,'alice',s,'alice',{type:'join',name:'Alice'});
  s=await write(id,'host',s,'host',{type:'bot',id:'bot-one',name:'Bot'});
  await assertFails(write(id,'alice',s,'host',{type:'start'}));
  const results=await Promise.allSettled([write(id,'bob',s,'bob',{type:'join',name:'Bob'}),write(id,'eve',s,'eve',{type:'join',name:'Eve'})]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
  const db=env.authenticatedContext('host').firestore(),room=doc(db,'games',id);await assertFails(setDoc(room,{...meta(s),revision:88}));await assertFails(setDoc(doc(room,'events','1'),{bad:true}));await assertFails(deleteDoc(doc(room,'events','1')));await assertFails(setDoc(doc(room,'events','900'),{version:1,sequence:900,id:'gap',actor:'host',command:{type:'draw',turn:0},createdAt:serverTimestamp()}));
  expect((await getDoc(room)).data()?.revision).toBe(s.revision+1);
 });
 test('shared-table hosts control local humans without granting control to other members',async()=>{
  const id=crypto.randomUUID();let s=await write(id,'screen-host',null,'screen-host',{type:'create',name:'Host',seed:'shared',seat:'south',chooseOnJoin:true});
  s=await write(id,'screen-host',s,'screen-host',{type:'seat',id:'screen-north',name:'North',seat:'north'});
  s=await write(id,'screen-guest',s,'screen-guest',{type:'join',name:'Guest',seat:'east'});
  const north=s.players.find(p=>p.id==='screen-north')!;
  await assertFails(write(id,'screen-guest',s,north.id,{type:'angel',angel:north.options[0]}));
  s=await write(id,'screen-host',s,north.id,{type:'angel',angel:north.options[0]});
  expect(s.players.find(p=>p.id===north.id)?.angel).toBe(north.options[0]);
  const db=env.authenticatedContext('screen-guest').firestore(),event=commandEvent(s,'screen-guest',{type:'angel',angel:s.players.find(p=>p.id==='screen-guest')!.options[0]},crypto.randomUUID());
  await assertFails(runTransaction(db,async tx=>{await tx.get(doc(db,'games',id));tx.set(doc(db,'games',id),{...meta(applyEvent(s,event)),locals:['screen-north','screen-host']});tx.set(doc(db,'games',id,'events',String(event.sequence)),{...encodeEvent(event),createdAt:serverTimestamp()});}));
  s=await write(id,'screen-guest',s,'screen-guest',event.command);s=await write(id,'screen-host',s,'screen-host',{type:'angel',angel:s.players.find(p=>p.id==='screen-host')!.options[0]});s=await write(id,'screen-host',s,'screen-host',{type:'start'});expect(s.phase).toBe('play');
 });
 test('five-letter aliases preserve old tables and cannot be hijacked',async()=>{
  const id=crypto.randomUUID();await write(id,'invite-host',null,'invite-host',{type:'create',name:'Host',seed:'aliases'});
  const host=env.authenticatedContext('invite-host').firestore(),outsider=env.authenticatedContext('outsider').firestore();
  const alias=(db:typeof host,code:string)=>runTransaction(db,async tx=>{await tx.get(doc(db,'tableInvites',id));tx.set(doc(db,'tableCodes',code),{table:id});tx.set(doc(db,'tableInvites',id),{code});});
  await assertFails(alias(outsider,'ABCDE'));await assertFails(setDoc(doc(host,'tableCodes','ABCDE'),{table:id}));
  await assertSucceeds(alias(host,'ABCDE'));expect((await getDoc(doc(outsider,'tableCodes','ABCDE'))).data()?.table).toBe(id);
  await assertFails(setDoc(doc(host,'tableCodes','ABCDE'),{table:'another'}));await assertFails(alias(host,'FGHJK'));await assertFails(write('ABCDE','invite-host',null,'invite-host',{type:'create',name:'Host',seed:'collision'}));
  expect((await getDocs(collection(host,'games',id,'events'))).size).toBe(1);
 });
 test('trained difficulties persist in events; unknown levels and non-bot difficulty fields are rejected',async()=>{
  const id=crypto.randomUUID();let s=await write(id,'rl-host',null,'rl-host',{type:'create',name:'Host',seed:'rl-backend'});
  for(const difficulty of ['easy','standard','hard'] as const)s=await write(id,'rl-host',s,'rl-host',{type:'bot',id:`rl-${difficulty}`,name:difficulty,difficulty});
  const db=env.authenticatedContext('rl-host').firestore(),events=await getDocs(collection(db,'games',id,'events'));
  expect(events.docs.every(d=>d.data().version===3)).toBe(true);
  expect(replay(events.docs.map(d=>decodeEvent(d.data())).sort((a,b)=>a.sequence-b.sequence)).players.slice(1).map(p=>p.difficulty)).toEqual(['easy','standard','hard']);
  const event=commandEvent(s,'rl-host',{type:'bot',id:'bad-level',name:'Bad',difficulty:'easy'},crypto.randomUUID()),next=applyEvent(s,event);
  await assertFails(runTransaction(db,async tx=>{const room=doc(db,'games',id);await tx.get(room);tx.set(room,meta(next));tx.set(doc(room,'events',String(event.sequence)),{...event,command:{...event.command,difficulty:'expert'},createdAt:serverTimestamp()});}));
  const start=commandEvent(s,'rl-host',{type:'start'},crypto.randomUUID()),begun=applyEvent(s,start);await assertFails(runTransaction(db,async tx=>{const room=doc(db,'games',id);await tx.get(room);tx.set(room,meta(begun));tx.set(doc(room,'events',String(start.sequence)),{...start,command:{...start.command,difficulty:'easy'},createdAt:serverTimestamp()});}));
 });
 test('live channels keep private rack state out and deny outsider writes',async()=>{
  const id=crypto.randomUUID(),host=env.authenticatedContext('live-host').database(),alice=env.authenticatedContext('live-alice').database(),outsider=env.authenticatedContext('outsider').database();
  await assertSucceeds(set(ref(host,`tables/${id}/control`),{owner:'live-host',members:{'live-host':true,'live-alice':true},actor:'live-alice',revision:8,turn:1,phase:'play'}));
  const draft={version:1,revision:8,turn:1,actor:'live-alice',session:'s',sequence:1,sentAt:Date.now(),dragging:true,groups:[{id:'g',tiles:['black-a-1'],x:23,y:44}]};
  await assertSucceeds(set(ref(alice,`tables/${id}/draft`),draft));expect((await get(ref(host,`tables/${id}/draft`))).val().groups[0].x).toBe(23);
  await assertFails(get(ref(outsider,`tables/${id}/draft`)));await assertFails(set(ref(outsider,`tables/${id}/draft`),{...draft,actor:'outsider'}));await assertFails(set(ref(alice,`tables/${id}/control`),{owner:'live-alice'}));await assertFails(set(ref(alice,`tables/${id}/draft`),{...draft,actor:'live-host'}));await assertFails(set(ref(alice,`tables/${id}/draft`),{...draft,sentAt:1}));
 });
 test('Sanctuary extension and split persist through Firestore and replay',async()=>{
  const id=crypto.randomUUID(),uid='sanctuary-host',fixture=sanctuaryFixture(uid);let s:State|null=null;
  for(const event of fixture.events)s=await write(id,uid,s,event.actor,event.command);
  const tiles=fixture.tiles,groups=[{id:'left',x:180,y:120,zone:uid,tiles:tiles.slice(0,3)},{id:'right',x:321,y:120,zone:uid,tiles:tiles.slice(3)}],command:Command={type:'organize',groups,turn:s!.turnNumber,sanctuary:[[tiles],[tiles.slice(0,3),tiles.slice(3)]]};
  const db=env.authenticatedContext(uid).firestore(),event=commandEvent(s,uid,command,crypto.randomUUID());
  // Reproduce the exact SDK failure that practice-only checks missed.
  let failure:any;try{await setDoc(doc(db,'games',id,'events',String(event.sequence)),{...event,createdAt:serverTimestamp()});}catch(error){failure=error;}
  expect(failure?.code).toBe('invalid-argument');expect(failure?.message).toMatch(/nested arrays/i);
  const next=await write(id,uid,s,uid,command),snapshot=await getDocs(collection(db,'games',id,'events')),events=snapshot.docs.map(d=>decodeEvent(d.data())).sort((a,b)=>a.sequence-b.sequence);
  expect(replay(events)).toEqual(next);expect(next.heaven.filter(g=>g.zone===uid)).toHaveLength(2);
  const stored=snapshot.docs.find(d=>d.data().sequence===next.revision)!.data();expect(stored.command.sanctuary[0].groups[0].tiles).toEqual(tiles);
 });
});
