import {total,type State,type GameEvent} from './engine';
export interface ChronicleEntry {id:string;actor:string;text:string;round:number}
export function describeEvent(event:GameEvent,before:State|null,after:State):ChronicleEntry[]{
 const c=event.command,name=(id:string)=>after.players.find(p=>p.id===id)?.name??'An Angel',actor=name(event.actor);let text='';
 switch(c.type){
  case 'create':text='opened the table.';break;
  case 'join':text='joined the table.';break;
  case 'seat':text=`seated ${name(c.id)}.`;break;
  case 'bot':text=`invited ${name(c.id)}.`;break;
  case 'start':text='dealt two Angels to everyone.';break;
  case 'angel':text='chose an Angel.';break;
  case 'organize':{const old=new Set(before?.heaven.flatMap(g=>g.tiles)),added=after.heaven.flatMap(g=>g.tiles).filter(id=>!old.has(id)).length,powers={forgive:'Forgiveness',penance:'Penance',transfigure:'Transfiguration',sanctuary:'Sanctuary'};
   text=c.power?`used ${powers[c.power.kind]}`:before?.players.find(p=>p.id===event.actor)?.purgatory?'rescued Purgatory':'organized Heaven';if(added)text+=` · ${added} soul${added===1?'':'s'} placed`;const favor=after.players.find(p=>p.id===event.actor)!.favor-(before?.players.find(p=>p.id===event.actor)?.favor??0);if(favor)text+=` · +${favor} Favor`;text+='.';break;}
  case 'draw':if(c.foretell)text='used Foretelling.';break;
  case 'keep':text='kept one soul from the bag.';break; // Never disclose the kept soul.
  case 'communion':text=`used Communion on ${name(c.target)}.`;break;
  case 'before':if(c.power==='judgment')text=`used Judgment · returned ${c.tiles?.length??0}, drew ${(c.tiles?.length??0)*2}.`;if(c.power==='calling')text=`called rank ${c.rank}.`;if(c.power==='banish')text=`banished rank ${c.rank} to ${name(c.target!)}.`;if(c.power==='dance')text=`began Dance of Souls · pass ${c.count} to the right.`;break;
  case 'dance-choice':if(before?.phase==='dance'&&after.phase!=='dance')text='completed the simultaneous pass.';break;
  case 'judgment-choice':text='fixed a private Judgment choice.';break;
  case 'continue':if(c.zeal)text='took an extra turn with Zeal.';break;
  case 'next-round':text=`began round ${after.round}.`;break;
  case 'rack':break;
 }
 const result:ChronicleEntry[]=text?[{id:event.id,actor,text,round:after.round}]:[];
 if(before?.round===0&&after.round===1)result.push({id:event.id+'-round',actor:'Round 1',text:'Heaven is open.',round:1});
 if(before?.phase!==after.phase&&(after.phase==='round-end'||after.phase==='ended')){
  result.push({id:event.id+'-winner',actor:name(after.winner!),text:`won round ${after.round}.`,round:after.round});
  if(after.phase==='ended'){const high=Math.max(...after.players.map(total));result.push({id:event.id+'-final',actor:after.players.filter(p=>total(p)===high).map(p=>p.name).join(' & '),text:'became God’s Favorite.',round:after.round});}
 }
 return result;
}
export type TilePlace={kind:'hand';owner:string}|{kind:'heaven'}|{kind:'bag'}|{kind:'purgatory';owner:string};
export interface TileTransfer {id:string;from:TilePlace;to:TilePlace}
export function tilePlaces(s:State):Map<string,TilePlace>{const locations=new Map<string,TilePlace>();s.bag.forEach(id=>locations.set(id,{kind:'bag'}));s.inspection?.tiles.forEach(id=>locations.set(id,{kind:'bag'}));s.heaven.forEach(g=>g.tiles.forEach(id=>locations.set(id,{kind:'heaven'})));for(const p of s.players){p.hand.forEach(id=>locations.set(id,{kind:'hand',owner:p.id}));if(p.purgatory)locations.set(p.purgatory,{kind:'purgatory',owner:p.id});}return locations;}
export function tileTransfers(before:State,after:State):TileTransfer[]{const old=tilePlaces(before),next=tilePlaces(after);return [...next].flatMap(([id,to])=>{const from=old.get(id);return from&&JSON.stringify(from)!==JSON.stringify(to)?[{id,from,to}]:[];});}
