import {nearestSpace} from '../tabletop/layout';
import {overlaps} from '../tabletop/rearrangement';
import {formation} from './formations';
import {decree,allowance,type State,type Command,type Player,type Group} from './engine';
// Public-information strategy: only the acting rack and shared table are inspected.
export function findMeld(s:State,p:Player):string[]|null{
 const hand=p.hand;
 for(let n=2;n<=5;n++){
  let found:string[]|null=null;
  const search=(start:number,chosen:string[])=>{if(found)return;if(chosen.length===n){const variants=[chosen,[...chosen].sort((a,b)=>Number(s.tiles[a].rank)-Number(s.tiles[b].rank))];for(const ts of variants)if(formation(ts.map(id=>s.tiles[id]),decree(s))){found=ts;break;}return;}for(let i=start;i<=hand.length-(n-chosen.length);i++){search(i+1,[...chosen,hand[i]]);if(found)return;}};
  search(0,[]);if(found)return found;
 }
 return null;
}
export function botCommand(s:State,p:Player):Command|null{
 const turn=s.turnNumber;
 if((s.phase==='angels'||s.phase==='lobby'&&s.chooseOnJoin)&&!p.angel)return {type:'angel',angel:p.options[0]};
 if(s.phase==='judgment'&&!p.ready)return s.judgment===2?{type:'judgment-choice',target:s.players.find(q=>q.id!==p.id)!.id}:{type:'judgment-choice',tiles:[]};
 if(s.phase==='dance'&&s.dance&&!s.dance.choices[p.id])return {type:'dance-choice',tiles:p.hand.slice(0,s.dance.count),turn};
 if(s.players[s.turn].id!==p.id)return null;
 if(s.phase==='after-turn')return {type:'continue',turn};
 if(s.phase==='inspect'&&s.inspection)return {type:'keep',tile:[...s.inspection.tiles].sort((a,b)=>(s.tiles[a].rank==='joker'?0:Number(s.tiles[a].rank))-(s.tiles[b].rank==='joker'?0:Number(s.tiles[b].rank)))[0],turn};
 if(s.phase!=='play')return null;
 if(p.opened)for(const g of s.heaven.filter(g=>g.zone===null||g.zone===p.id))for(const id of p.hand)for(let at=0;at<=g.tiles.length;at++){
  const ts=[...g.tiles.slice(0,at),id,...g.tiles.slice(at)];if(!formation(ts.map(id=>s.tiles[id]),decree(s)))continue;
  const groups=JSON.parse(JSON.stringify(s.heaven)) as Group[];const target=groups.find(q=>q.id===g.id)!;target.tiles=ts;delete target.slots;delete target.jokerFaces;
  const size={width:ts.length*47-3,height:44*1.43},occupied=groups.filter(q=>q.id!==target.id).map(q=>({x:q.x,y:q.y,width:(Math.max(...q.tiles.map((_,i)=>q.slots?.[i]??i))+1)*47-3,height:44*1.43}));
  if(occupied.some(r=>overlaps({...size,x:target.x,y:target.y},r,10))){const position=nearestSpace(size,occupied,target,1000);target.x=position.x;target.y=position.y;}
  return {type:'organize',groups,turn};
 }
 const meld=findMeld(s,p);if(meld){const group:Group={id:`bot-${s.revision}`,...nearestSpace({width:meld.length*47-3,height:44*1.43},s.heaven.map(g=>({x:g.x,y:g.y,width:(Math.max(...g.tiles.map((_,i)=>g.slots?.[i]??i))+1)*47-3,height:44*1.43})),{x:18,y:18},1000),tiles:meld,zone:null};return {type:'organize',groups:[...s.heaven,group],...(!p.opened?{opening:meld}:{}),turn};}
 return {type:'draw',turn,foretell:p.angel==='uriel'&&!p.used&&s.bag.length>0&&allowance(s,p.id)<8};
}
