import {formation} from '../formations';
import type {Command,Group} from '../types';
import type {Observation} from './observation';
import {greedyPlan,rearrangePlan,placedGroup,tileValue,type Plan} from './planner';
export function powerChoices(o:Observation,plans:Plan[],depth=2):Command[]{
 const p=o.me,turn=o.turn,commands:Command[]=[];if(p.used||p.purgatory)return commands;
 const own=(plan:Plan):Extract<Command,{type:'organize'}>=>({type:'organize',...plan,turn});
 if(p.angel==='michael')for(const rank of [...new Set(p.hand.map(id=>o.tiles[id].rank))].filter(r=>r!=='joker'))for(const target of o.rivals)commands.push({type:'before',power:'banish',rank:Number(rank),target:target.id,turn});
 if(p.angel==='gabriel')for(let rank=1;rank<=13;rank++)commands.push({type:'before',power:'calling',rank,turn});
 if(p.angel==='raguel'){
  const solo=(id:string)=>{const t=o.tiles[id];return p.hand.filter(k=>k!==id).reduce((n,k)=>{const u=o.tiles[k];return n+(t.rank==='joker'||u.rank==='joker'||t.rank===u.rank&&t.color!==u.color||t.color===u.color&&Math.abs(Number(t.rank)-Number(u.rank))<=2?1:0);},0);};
  const orders=[[...p.hand].sort((a,b)=>solo(a)-solo(b)||tileValue(o,b)-tileValue(o,a)),[...p.hand].sort((a,b)=>tileValue(o,b)-tileValue(o,a))];
  for(const order of orders)for(let count=1;count<=Math.min(6,o.bagCount,p.hand.length);count++)commands.push({type:'before',power:'judgment',tiles:order.slice(0,count),turn});
 }
 if(p.angel==='haniel')for(let count=1;count<=Math.min(5,p.hand.length,...o.rivals.map(q=>q.count));count++)commands.push({type:'before',power:'dance',count,turn});
 if(p.angel==='chamuel'&&p.hand.length)for(const target of o.rivals)commands.push({type:'communion',target:target.id,turn});
 if(p.angel==='selaphiel'||p.angel==='barachiel'){
  for(const plan of [...plans,...(p.opened?[{groups:o.heaven}]:[])])for(const g of plan.groups.filter(g=>g.zone===null&&formation(g.tiles.map(id=>o.tiles[id]),o.decree)===(p.angel==='selaphiel'?'choir':'procession')).slice(0,5))commands.push({...own(plan),groups:plan.groups.map(q=>q.id===g.id?{...q,zone:p.id}:q),power:{kind:'sanctuary',group:g.id}});
  for(const plan of [...plans,...(p.opened?[{groups:o.heaven}]:[])]){const eligible=plan.groups.filter(g=>g.zone===null&&formation(g.tiles.map(id=>o.tiles[id]),o.decree)===(p.angel==='selaphiel'?'choir':'procession'));if(eligible.length)commands.push({...own(plan),groups:plan.groups.map(g=>eligible.includes(g)?{...g,zone:p.id}:g),power:{kind:'sanctuary',group:eligible[0].id}});}
 }
 if(p.angel==='raphael')for(const plan of [...plans,...(p.opened?[{groups:o.heaven}]:[])]){
  const placed=new Set(plan.groups.flatMap(g=>g.tiles)),remaining=p.hand.filter(id=>!placed.has(id));
  if(remaining.length===1){const tile=remaining[0];commands.push({...own(plan),stage:[...plan.groups,placedGroup(o,[tile],plan.groups,999)],power:{kind:'penance',tile}});}
 }
 if(p.angel==='zadkiel'&&p.opened){
  // A legal replay can earn Favor without changing the physical arrangement.
  const any=o.heaven.find(g=>g.zone===null)?.tiles[0];if(any)for(const plan of [{groups:o.heaven},...plans])commands.push({...own(plan),power:{kind:'forgive',tile:any}});
  for(const g of o.heaven.filter(g=>g.zone===null))for(const tile of g.tiles){const rest=g.tiles.filter(id=>id!==tile);if(!rest.length||!formation(rest.map(id=>o.tiles[id]),o.decree))continue;
   const groups=o.heaven.map(q=>q.id===g.id?{...q,tiles:rest,slots:undefined,jokerFaces:undefined}:q),plan=greedyPlan(o,[...p.hand,tile],groups);
   commands.push({...own(plan),power:{kind:'forgive',tile}});
  }
 }
 if(p.angel==='jophiel'&&p.opened){
  const removable:{tile:string;group:Group}[]=[];
  for(const group of o.heaven.filter(g=>g.zone===null))for(const tile of group.tiles)removable.push({tile,group});
  const pairs:{tiles:string[];groups:Group[];priority:number}[]=[];
  const ordinary=plans.reduce<Plan>((best,p)=>p.groups.flatMap(g=>g.tiles).filter(id=>o.me.hand.includes(id)).length>best.groups.flatMap(g=>g.tiles).filter(id=>o.me.hand.includes(id)).length?p:best,{groups:o.heaven});
  const retained=p.hand.filter(id=>!ordinary.groups.some(g=>g.tiles.includes(id)));
  const helpful=(id:string)=>retained.reduce((n,other)=>{const a=o.tiles[id],b=o.tiles[other];return n+(a.rank==='joker'||b.rank==='joker'?4:a.rank===b.rank?2:a.color===b.color&&Math.abs(Number(a.rank)-Number(b.rank))<=2?1:0);},0);
  for(let a=0;a<removable.length;a++)for(let b=a+1;b<removable.length;b++){
   const tiles=[removable[a].tile,removable[b].tile],changed=new Set([removable[a].group.id,removable[b].group.id]);if(o.heaven.some(g=>changed.has(g.id)&&g.tiles.length>tiles.filter(id=>g.tiles.includes(id)).length&&!formation(g.tiles.filter(id=>!tiles.includes(id)).map(id=>o.tiles[id]),o.decree)))continue;
   const groups=o.heaven.map(g=>changed.has(g.id)?{...g,tiles:g.tiles.filter(id=>!tiles.includes(id)),slots:undefined,jokerFaces:undefined}:g).filter(g=>g.tiles.length);
   const creditMatch=tiles.reduce((sum,id)=>sum+p.scales.filter(k=>o.tiles[k].rank===o.tiles[id].rank&&o.tiles[k].color===o.tiles[id].color).reduce((n,k)=>n+tileValue(o,k),0),0);
   const priority=creditMatch+tiles.reduce((n,id)=>n+helpful(id)-tileValue(o,id)/13,0);
   pairs.push({tiles,groups,priority});
  }
  for(const pair of pairs.sort((a,b)=>b.priority-a.priority).slice(0,16)){
   const altered={...o,heaven:pair.groups},base=greedyPlan(o,p.hand,pair.groups),plan=rearrangePlan(altered,base,depth);
   if(plan.groups.flatMap(g=>g.tiles).filter(id=>p.hand.includes(id)).length>=2)commands.push({...own(plan),power:{kind:'transfigure',tiles:pair.tiles}});
  }
 }
 return commands;
}
