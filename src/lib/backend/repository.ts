import type {TableSeat} from '../tabletop/seats';
import {hasCommittedKeep} from './committed';
import {draftQueue} from './draft-queue';
import {newTableCode} from './codes';
import {collection,doc,query,orderBy,getDocFromServer,getDocsFromServer,onSnapshot,runTransaction,serverTimestamp,type Firestore} from 'firebase/firestore';
import {ref,set,onValue,onDisconnect,remove,runTransaction as liveTransaction,serverTimestamp as liveTimestamp,type Database} from 'firebase/database';
import {applyEvent,commandEvent,replay,type State,type GameEvent,type Command} from '../engine/engine';
import {decodeLive,type LiveDraft} from './live';
import {firebase} from './firebase';
const clean=<T>(v:T):T=>JSON.parse(JSON.stringify(v));
const metadata=(s:State)=>({version:1,owner:s.owner,members:s.players.map(p=>p.id),bots:s.players.filter(p=>p.bot).map(p=>p.id),phase:s.phase,revision:s.revision,...(s.tabletop?{locals:s.players.filter(p=>p.local).map(p=>p.id)}:{})});
const path=(db:Firestore,id:string)=>doc(db,'games',id);
export async function resolveTableCode(code:string){const {db}=await firebase();if(!/^[A-Z]{5}$/.test(code))return code;const alias=await getDocFromServer(doc(db,'tableCodes',code));return alias.exists()?alias.data().table as string:code;}
export async function shareTableCode(id:string){if(/^[A-Z]{5}$/.test(id))return id;const {db}=await firebase();
 for(let attempt=0;attempt<8;attempt++){const candidate=newTableCode();const code=await runTransaction(db,async tx=>{const reverse=doc(db,'tableInvites',id),existing=await tx.get(reverse);if(existing.exists())return existing.data().code as string;const alias=doc(db,'tableCodes',candidate),taken=await tx.get(alias),room=await tx.get(path(db,candidate));if(taken.exists()||room.exists())return null;tx.set(alias,{table:id});tx.set(reverse,{code:candidate});return candidate;});if(code)return code;}
 throw new Error('Could not reserve an invite code. Try again.');
}
export async function canResumeGame(id:string){id=await resolveTableCode(id);const {db,uid}=await firebase();const room=await getDocFromServer(path(db,id));if(!room.exists())throw new Error('That table does not exist.');return room.data().members.includes(uid) as boolean;}
async function readTranscript(id:string){const {db}=await firebase();for(let attempt=0;attempt<4;attempt++){const room=await getDocFromServer(path(db,id));if(!room.exists())throw new Error('That table does not exist.');const snapshot=await getDocsFromServer(query(collection(db,'games',id,'events'),orderBy('sequence'))),events=snapshot.docs.map(d=>d.data() as GameEvent),state=replay(events);if(state.revision>=room.data().revision)return {state,events};}throw new Error('The game is still synchronizing. Please reconnect.');}
export async function readGame(id:string):Promise<State>{return (await readTranscript(id)).state;}
export async function createGame(name:string,seat?:TableSeat,chooseOnJoin=false){const {db,uid}=await firebase();if(!name.trim()||name.trim().length>40)throw new Error('Use a name of 1–40 characters.');
 const event=commandEvent(null,uid,{type:'create',name:name.trim(),seed:crypto.randomUUID(),...(seat?{seat}:{}),...(chooseOnJoin?{chooseOnJoin:true}:{})},crypto.randomUUID()),state=applyEvent(null,event);
 for(let attempt=0;attempt<8;attempt++){const id=newTableCode();const created=await runTransaction(db,async tx=>{const room=path(db,id);const existing=await tx.get(room),alias=await tx.get(doc(db,'tableCodes',id));if(existing.exists()||alias.exists())return false;tx.set(room,metadata(state));tx.set(doc(room,'events','1'),{...event,createdAt:serverTimestamp()});return true;});if(created)return id;}
 throw new Error('Could not reserve a table code. Try again.');
}
export async function append(id:string,state:State,actor:string,command:Command):Promise<State>{const {db,uid}=await firebase();const eventId=crypto.randomUUID();let current=state;for(let attempt=0;attempt<5;attempt++){
 if(current.eventIds.includes(eventId))return current;
 if(actor!==uid&&!(current.owner===uid&&current.players.some(p=>p.id===actor&&(p.bot||p.local))))throw new Error('You do not control that player.');
 if(command.type==='keep'&&(current.phase!=='inspect'||current.turnNumber!==command.turn||current.inspection?.player!==actor||!current.inspection.tiles.includes(command.tile))){const fresh=await readTranscript(id);if(hasCommittedKeep(fresh.events,actor,command))return fresh.state;current=fresh.state;}
 const event=commandEvent(current,actor,clean(command),eventId),next=applyEvent(current,event);
 try{await runTransaction(db,async tx=>{const room=path(db,id),snap=await tx.get(room);if(!snap.exists()||snap.data().revision!==current.revision)throw new Error('revision-conflict');tx.set(doc(room,'events',String(event.sequence)),{...event,createdAt:serverTimestamp()});tx.update(room,metadata(next));});return next;}catch(e){const fresh=await readTranscript(id);if(fresh.state.eventIds.includes(eventId)||hasCommittedKeep(fresh.events,actor,command))return fresh.state;if(fresh.state.revision===current.revision)throw e;current=fresh.state;}
 }throw new Error('The table changed. Try the action again.');}
export async function joinGame(id:string,name:string){id=await resolveTableCode(id);const {uid,db}=await firebase();if(!name.trim()||name.length>40)throw new Error('Use a name of 1–40 characters.');const eventId=crypto.randomUUID();await runTransaction(db,async tx=>{const room=path(db,id),snapshot=await tx.get(room);if(!snapshot.exists())throw new Error('That table does not exist.');const data=snapshot.data();if(data.members.includes(uid))return;if(data.phase!=='lobby'||data.members.length>=5)throw new Error('The lobby is full or the game has started.');const sequence=data.revision+1;tx.set(doc(room,'events',String(sequence)),{version:1,sequence,id:eventId,actor:uid,command:{type:'join',name:name.trim()},createdAt:serverTimestamp()});tx.update(room,{members:[...data.members,uid],revision:sequence});});return readGame(id);}
export async function watchGame(id:string,onState:(s:State,events:GameEvent[])=>void,onError:(e:Error)=>void){const {db}=await firebase();let last=0;return onSnapshot(query(collection(db,'games',id,'events'),orderBy('sequence')),{includeMetadataChanges:true},snap=>{if(snap.metadata.fromCache||snap.metadata.hasPendingWrites)return;try{const events=snap.docs.map(d=>d.data() as GameEvent),state=replay(events);if(state.revision>last){last=state.revision;onState(state,events);}}catch(e){onError(e as Error);}},onError);}
export async function liveChannel(id:string,onDraft:(d:LiveDraft|null)=>void,onError:(e:Error)=>void,onReady:()=>void=()=>{}){
 const {live,uid}=await firebase(),draftRef=ref(live,`tables/${id}/draft`),presence=ref(live,`tables/${id}/presence/${uid}`),session=crypto.randomUUID();
 let sequence=0,closed=false,ready=false,hostAuthorized=false,authorized=false,connected=false,clockOffset=0,latestDraft:LiveDraft|null=null,off:undefined|(()=>void),retry:ReturnType<typeof setTimeout>|undefined;
 const queue=draftQueue<Omit<LiveDraft,'sentAt'|'sequence'|'session'>>(async update=>{await set(draftRef,clean({...update,session,sequence:++sequence,sentAt:liveTimestamp()}));},failed);
 function deliver(){onDraft(latestDraft?{...latestDraft,sentAt:latestDraft.sentAt-clockOffset}:null);}
 const clockOff=onValue(ref(live,'.info/serverTimeOffset'),snap=>{clockOffset=Number(snap.val())||0;if(ready)deliver();});
 function failed(error:Error){if(closed)return;ready=false;queue.pause();onError(error);if(!closed&&authorized&&!retry)retry=setTimeout(()=>{retry=undefined;begin();},1000);}
 function begin(){if(ready||closed||!authorized)return;ready=true;
  off?.();off=onValue(draftRef,snap=>{latestDraft=decodeLive(snap.val());deliver();onReady();},failed);
  void onDisconnect(presence).remove().then(()=>{if(!closed)return set(presence,{connectedAt:liveTimestamp()});}).catch(failed);
  if(ready&&connected)queue.start();
 }
 const connection=onValue(ref(live,'.info/connected'),snap=>{connected=!!snap.val();if(!connected){queue.pause();return;}if(ready)queue.start();else begin();if(ready)void onDisconnect(presence).remove().then(()=>{if(!closed)return set(presence,{connectedAt:liveTimestamp()});}).catch(failed);});
 const controlOff=onValue(ref(live,`tables/${id}/control`),snap=>{authorized=snap.child(`members/${uid}`).val()===true&&(snap.child('owner').val()!==uid||hostAuthorized);if(authorized)begin();else queue.pause();},onError);
 return {
  publish(d:Omit<LiveDraft,'sentAt'|'sequence'|'session'>){queue.publish(d);},
  async authorize(s:State){if(uid!==s.owner||closed)return;const controller=s.players[s.turn]?.id;await liveTransaction(ref(live,`tables/${id}/control`),old=>old&&old.revision>s.revision?undefined:({owner:uid,members:Object.fromEntries(s.players.filter(p=>!p.bot).map(p=>[p.id,true])),actor:controller??uid,revision:s.revision,turn:s.turnNumber,phase:s.phase}));if(closed)return;hostAuthorized=true;authorized=true;begin();},
  close(){closed=true;off?.();controlOff();connection();clockOff();queue.close();if(retry)clearTimeout(retry);void remove(presence).catch(()=>{});}
 };
}
export type LiveChannel=Awaited<ReturnType<typeof liveChannel>>;
