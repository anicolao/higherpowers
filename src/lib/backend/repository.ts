import {newTableCode} from './codes';
import {collection,doc,query,orderBy,getDocFromServer,getDocsFromServer,onSnapshot,runTransaction,serverTimestamp,type Firestore} from 'firebase/firestore';
import {ref,set,onValue,onDisconnect,remove,runTransaction as liveTransaction,serverTimestamp as liveTimestamp,type Database} from 'firebase/database';
import {applyEvent,commandEvent,replay,type State,type GameEvent,type Command} from '../engine/engine';
import {decodeLive,type LiveDraft} from './live';
import {firebase} from './firebase';
const clean=<T>(v:T):T=>JSON.parse(JSON.stringify(v));
const metadata=(s:State)=>({version:1,owner:s.owner,members:s.players.map(p=>p.id),bots:s.players.filter(p=>p.bot).map(p=>p.id),phase:s.phase,revision:s.revision});
const path=(db:Firestore,id:string)=>doc(db,'games',id);
export async function resolveTableCode(code:string){const {db}=await firebase();if(!/^[A-Z]{5}$/.test(code))return code;const alias=await getDocFromServer(doc(db,'tableCodes',code));return alias.exists()?alias.data().table as string:code;}
export async function shareTableCode(id:string){if(/^[A-Z]{5}$/.test(id))return id;const {db}=await firebase();
 for(let attempt=0;attempt<8;attempt++){const candidate=newTableCode();const code=await runTransaction(db,async tx=>{const reverse=doc(db,'tableInvites',id),existing=await tx.get(reverse);if(existing.exists())return existing.data().code as string;const alias=doc(db,'tableCodes',candidate),taken=await tx.get(alias),room=await tx.get(path(db,candidate));if(taken.exists()||room.exists())return null;tx.set(alias,{table:id});tx.set(reverse,{code:candidate});return candidate;});if(code)return code;}
 throw new Error('Could not reserve an invite code. Try again.');
}
export async function canResumeGame(id:string){id=await resolveTableCode(id);const {db,uid}=await firebase();const room=await getDocFromServer(path(db,id));if(!room.exists())throw new Error('That table does not exist.');return room.data().members.includes(uid) as boolean;}
export async function readGame(id:string):Promise<State>{const {db}=await firebase();for(let attempt=0;attempt<4;attempt++){const room=await getDocFromServer(path(db,id));if(!room.exists())throw new Error('That table does not exist.');const events=await getDocsFromServer(query(collection(db,'games',id,'events'),orderBy('sequence')));const state=replay(events.docs.map(d=>d.data() as GameEvent));if(state.revision>=room.data().revision)return state;}throw new Error('The game is still synchronizing. Please reconnect.');}
export async function createGame(name:string){const {db,uid}=await firebase();if(!name.trim()||name.trim().length>40)throw new Error('Use a name of 1–40 characters.');
 const event=commandEvent(null,uid,{type:'create',name:name.trim(),seed:crypto.randomUUID()},crypto.randomUUID()),state=applyEvent(null,event);
 for(let attempt=0;attempt<8;attempt++){const id=newTableCode();const created=await runTransaction(db,async tx=>{const room=path(db,id);const existing=await tx.get(room),alias=await tx.get(doc(db,'tableCodes',id));if(existing.exists()||alias.exists())return false;tx.set(room,metadata(state));tx.set(doc(room,'events','1'),{...event,createdAt:serverTimestamp()});return true;});if(created)return id;}
 throw new Error('Could not reserve a table code. Try again.');
}
export async function append(id:string,state:State,actor:string,command:Command):Promise<State>{const {db,uid}=await firebase();const eventId=crypto.randomUUID();let current=state;for(let attempt=0;attempt<5;attempt++){
 if(current.eventIds.includes(eventId))return current;
 if(actor!==uid&&!(current.owner===uid&&current.players.some(p=>p.id===actor&&p.bot)))throw new Error('You do not control that player.');
 const event=commandEvent(current,actor,clean(command),eventId),next=applyEvent(current,event);
 try{await runTransaction(db,async tx=>{const room=path(db,id),snap=await tx.get(room);if(!snap.exists()||snap.data().revision!==current.revision)throw new Error('revision-conflict');tx.set(doc(room,'events',String(event.sequence)),{...event,createdAt:serverTimestamp()});tx.update(room,metadata(next));});return next;}catch(e){const fresh=await readGame(id);if(fresh.eventIds.includes(eventId))return fresh;if(fresh.revision===current.revision)throw e;current=fresh;}
 }throw new Error('The table changed. Try the action again.');}
export async function joinGame(id:string,name:string){id=await resolveTableCode(id);const {uid,db}=await firebase();if(!name.trim()||name.length>40)throw new Error('Use a name of 1–40 characters.');const eventId=crypto.randomUUID();await runTransaction(db,async tx=>{const room=path(db,id),snapshot=await tx.get(room);if(!snapshot.exists())throw new Error('That table does not exist.');const data=snapshot.data();if(data.members.includes(uid))return;if(data.phase!=='lobby'||data.members.length>=5)throw new Error('The lobby is full or the game has started.');const sequence=data.revision+1;tx.set(doc(room,'events',String(sequence)),{version:1,sequence,id:eventId,actor:uid,command:{type:'join',name:name.trim()},createdAt:serverTimestamp()});tx.update(room,{members:[...data.members,uid],revision:sequence});});return readGame(id);}
export async function watchGame(id:string,onState:(s:State,events:GameEvent[])=>void,onError:(e:Error)=>void){const {db}=await firebase();let last=0;return onSnapshot(query(collection(db,'games',id,'events'),orderBy('sequence')),{includeMetadataChanges:true},snap=>{if(snap.metadata.fromCache||snap.metadata.hasPendingWrites)return;try{const events=snap.docs.map(d=>d.data() as GameEvent),state=replay(events);if(state.revision>last){last=state.revision;onState(state,events);}}catch(e){onError(e as Error);}},onError);}
export async function liveChannel(id:string,onDraft:(d:LiveDraft|null)=>void,onError:(e:Error)=>void,onReady:()=>void=()=>{}){const {live,uid}=await firebase();const root=ref(live,`tables/${id}`),draftRef=ref(live,`tables/${id}/draft`),presence=ref(live,`tables/${id}/presence/${uid}`);let sequence=0,closed=false,lastSent=0,timer:ReturnType<typeof setTimeout>|null=null,pending:Omit<LiveDraft,'sentAt'|'sequence'|'session'>|null=null;const session=crypto.randomUUID();
 let off:undefined|(()=>void),ready=false,hostAuthorized=false;
 // Arm removal only after connection; this does not grant an old tab permission to erase a new actor’s draft.
 const connection=onValue(ref(live,'.info/connected'),async snap=>{if(!snap.val()||closed||!ready)return;try{await onDisconnect(presence).remove();if(!closed)await set(presence,{connectedAt:liveTimestamp()});}catch(e){onError(e as Error);}});
 function begin(){if(ready||closed)return;ready=true;off=onValue(draftRef,snap=>{onDraft(decodeLive(snap.val()));onReady();},onError);void onDisconnect(presence).remove().then(()=>set(presence,{connectedAt:liveTimestamp()})).catch(onError);}
 const controlOff=onValue(ref(live,`tables/${id}/control`),snap=>{if(snap.child(`members/${uid}`).val()===true&&(snap.child('owner').val()!==uid||hostAuthorized))begin();},onError);

 async function flush(){timer=null;const update=pending;pending=null;if(!update||closed)return;lastSent=Date.now();try{await set(draftRef,clean({...update,session,sequence:++sequence,sentAt:Date.now()}));}catch(e){onError(e as Error);}}
 return {publish(d:Omit<LiveDraft,'sentAt'|'sequence'|'session'>){pending=d;if(!timer&&ready)timer=setTimeout(()=>void flush(),Math.max(0,65-(Date.now()-lastSent)));},async authorize(s:State){if(uid!==s.owner)return;const controller=s.players[s.turn]?.id;await liveTransaction(ref(live,`tables/${id}/control`),old=>old&&old.revision>s.revision?undefined:({owner:uid,members:Object.fromEntries(s.players.filter(p=>!p.bot).map(p=>[p.id,true])),actor:controller??uid,revision:s.revision,turn:s.turnNumber,phase:s.phase}));hostAuthorized=true;begin();},close(){closed=true;off?.();controlOff();connection();if(timer)clearTimeout(timer);void remove(presence).catch(()=>{});}};
}
export type LiveChannel=Awaited<ReturnType<typeof liveChannel>>;
