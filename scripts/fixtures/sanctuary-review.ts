import {applyEvent,commandEvent,type State,type Command,type GameEvent} from '../../src/lib/engine/engine';

export function sanctuaryFixture(uid='practice-player'){
 for(let seed=0;seed<10000;seed++){
  let s:State|null=null;const events:GameEvent[]=[];
  const act=(actor:string,c:Command)=>{const e=commandEvent(s,actor,c,String(events.length));s=applyEvent(s,e);events.push(e);};
  act(uid,{type:'create',name:'You',seed:`sanctuary-ui-${seed}`});act(uid,{type:'bot',id:'computer',name:'Computer'});act(uid,{type:'start'});
  if(s!.decrees[0]!==3||!s!.players[0].options.includes('barachiel'))continue;
  for(const p of s!.players)act(p.id,{type:'angel',angel:p.id===uid?'barachiel':p.options[0]});
  if(s!.turn!==0)continue;
  const hand=s!.players[0].hand;
  for(let rank=1;rank<=8;rank++){
   const run=Array.from({length:6},(_,i)=>hand.find(id=>s!.tiles[id].rank===rank+i));if(run.some(id=>!id))continue;
   const tiles=run as string[],group={id:'safe',x:180,y:120,tiles:tiles.slice(0,3),zone:uid};
   act(uid,{type:'organize',opening:group.tiles,groups:[group],power:{kind:'sanctuary',group:'safe'},turn:s!.turnNumber});
   while(s!.players[s!.turn].id!==uid){const turn=s!.turnNumber;if(s!.phase==='after-turn')act('computer',{type:'continue',turn});else if(s!.phase==='inspect')act('computer',{type:'keep',tile:s!.inspection!.tiles[0],turn});else act('computer',{type:'draw',turn});}
   return {events,tiles};
  }
 }
 throw Error('No legal Sanctuary extension fixture');
}
