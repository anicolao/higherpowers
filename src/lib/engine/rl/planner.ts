import {nearestSpace} from '../../tabletop/layout';
import {formation} from '../formations';
import type {Group} from '../types';
import type {Observation} from './observation';
import {melds} from './melds';
export interface Plan {groups:Group[];opening?:string[];}
export const tileValue=(o:Observation,id:string)=>o.tiles[id].rank==='joker'?30:Number(o.tiles[id].rank);
export function placedGroup(o:Observation,tiles:string[],groups:Group[],serial=0):Group{
 const occupied=groups.map(g=>({x:g.x,y:g.y,width:(Math.max(...g.tiles.map((_,i)=>g.slots?.[i]??i))+1)*47-3,height:63}));
 const at=nearestSpace({width:tiles.length*47-3,height:63},occupied,{x:18,y:18},1000);
 return {id:`rl-${o.revision}-${groups.length}-${serial}`,x:at.x,y:at.y,tiles:[...tiles],zone:null};
}
export function affinity(o:Observation,hand:string[],id:string){const a=o.tiles[id];return hand.reduce((n,k)=>{const b=o.tiles[k];return n+(id!==k&&(a.rank==='joker'||b.rank==='joker'||a.rank===b.rank&&(a.color!==b.color||o.decree===2)||a.color===b.color&&Math.abs(Number(a.rank)-Number(b.rank))<=2)?1:0);},0);}
/** Compound Organize: several melds and extensions are one action, not several turns. */
export function greedyPlan(o:Observation,hand:string[],start:Group[],mode=0):Plan{
 let remaining=[...hand],groups=start.map(g=>({...g,tiles:[...g.tiles]})),opening:string[]|undefined,opened=o.me.opened;
 for(let iteration=0;iteration<106;iteration++){
  const options:{tiles:string[];target?:string;rank:number}[]=[];
  const utility=(ts:string[])=>ts.filter(id=>remaining.includes(id)).reduce((n,id)=>n+(mode===0?10:mode===1?tileValue(o,id):10+affinity(o,remaining,id)*2),0);
  for(const ts of melds(remaining.map(id=>o.tiles[id]),o.decree))options.push({tiles:ts,rank:utility(ts)});
  if(opened)for(const g of groups.filter(g=>!g.zone||g.zone===o.me.id))for(const id of remaining)for(let at=0;at<=g.tiles.length;at++){
   const ts=[...g.tiles.slice(0,at),id,...g.tiles.slice(at)];if(formation(ts.map(id=>o.tiles[id]),o.decree))options.push({tiles:ts,target:g.id,rank:utility([id])});
  }
  options.sort((a,b)=>b.rank-a.rank||b.tiles.length-a.tiles.length);const best=options[0];if(!best)break;
  if(best.target)groups=groups.map(g=>g.id===best.target?{...g,tiles:best.tiles,slots:undefined,jokerFaces:undefined}:g);
  else{groups.push(placedGroup(o,best.tiles,groups,iteration));if(!opened)opening=[...best.tiles];}
  opened=true;remaining=remaining.filter(id=>!best.tiles.includes(id));if(!remaining.length)break;
 }
 return {groups,...(opening?{opening}:{})};
}
/** Additional physical-copy assignments are essential when several runs share ranks. */
function copyVariants(forms:string[][],o:Observation,ids:string[],limit=10000){
 const alternatives=new Map<string,string[]>();for(const id of ids){const t=o.tiles[id],key=t.rank==='joker'?'joker':`${t.color}/${t.rank}`;alternatives.set(key,[...(alternatives.get(key)??[]),id]);}
 const result=[...forms],seen=new Set(forms.map(ts=>ts.join(',')));
 const other=(id:string)=>{const t=o.tiles[id],a=alternatives.get(t.rank==='joker'?'joker':`${t.color}/${t.rank}`)!;return a.find(k=>k!==id)??id;};
 const add=(ts:string[])=>{const key=ts.join(',');if(result.length<limit&&new Set(ts).size===ts.length&&!seen.has(key)){seen.add(key);result.push(ts);}};
 for(const ts of forms)add(ts.map(other));
 for(let column=0;column<13&&result.length<limit;column++)for(const ts of forms)if(column<ts.length){add(ts.map((id,i)=>i===column?other(id):id));add(ts.map((id,i)=>i===column?id:other(id)));}
 return result;
}
export function refinedPlan(o:Observation,base:Plan,depth:number,mode=0){return depth===3?rearrangePlan(o,rearrangePlan(o,base,2,mode),3,mode):rearrangePlan(o,base,depth,mode);}
/** Bounded exact cover: all public souls must remain on the table; rack souls are optional. */
export function rearrangePlan(o:Observation,base:Plan,depth:number,mode=0):Plan{
 const hand=o.me.hand;if(hand.every(id=>base.groups.some(g=>g.tiles.includes(id))))return base;
 const loose=o.heaven.filter(g=>g.zone===null||g.zone===o.me.id);
 const relevance=(g:Group)=>g.tiles.reduce((n,id)=>n+affinity(o,hand,id),0);
 const selected=[...loose].sort((a,b)=>relevance(b)-relevance(a)).slice(0,depth===1?1:depth===2?Math.max(3,o.rivals.length+1):8);
 while(selected.length&&selected.flatMap(g=>g.tiles).length+hand.length>(depth===3?106:62))selected.pop();
 const locked=o.heaven.filter(g=>!selected.includes(g));
 const ids=[...selected.flatMap(g=>g.tiles),...hand];if(!selected.length||!o.me.opened&&!base.opening)return base;
 const index=new Map(ids.map((id,i)=>[id,i])),mask=(ts:string[])=>ts.reduce((m,id)=>m|(1n<<BigInt(index.get(id)!)),0n),all=(1n<<BigInt(ids.length))-1n;
 const mandatory=mask([...selected.flatMap(g=>g.tiles),...(base.opening??[])]),own=mask(hand);
 let ts=melds(ids.map(id=>o.tiles[id]),o.decree,depth===1?600:depth===2?1000:3000);for(const g of selected)if(!ts.some(t=>t.join(',')===g.tiles.join(',')))ts.push(g.tiles);
 if(depth===3)ts=copyVariants(ts,o,ids);
 const entries=ts.map(tiles=>({tiles,mask:mask(tiles),gain:tiles.filter(id=>hand.includes(id)).reduce((n,id)=>n+(mode===1?tileValue(o,id):10),0)}));
 const byTile=ids.map((_,i)=>entries.filter(e=>!!(e.mask&(1n<<BigInt(i)))));
 let best=base,score=base.groups.flatMap(g=>g.tiles).filter(id=>hand.includes(id)).reduce((n,id)=>n+(mode===1?tileValue(o,id):10),0),nodes=0;const budget=depth===1?80:depth===2?Math.max(3,o.rivals.length+1)*160:1800,maxGain=hand.reduce((n,id)=>n+(mode===1?tileValue(o,id):10),0);
 function visit(left:bigint,covered:typeof entries,gain:number){
  if(score>=maxGain||++nodes>budget)return;
  const required=mandatory&left;
  if(!required){
   if(gain>score){score=gain;let groups=[...locked];for(const e of covered){const old=selected.find(g=>g.tiles.join(',')===e.tiles.join(','));groups.push(old??placedGroup(o,e.tiles,groups,nodes));}best={groups,...(base.opening?{opening:base.opening}:{})};}
   // Finish packing any entirely private formations.
   for(const e of entries.filter(e=>e.gain&&!(e.mask&~left)).sort((a,b)=>b.gain-a.gain).slice(0,12))visit(left^e.mask,[...covered,e],gain+e.gain);
   return;
  }
  let options:typeof entries|undefined;
  for(let i=0;i<ids.length;i++)if(required&(1n<<BigInt(i))){const available=byTile[i].filter(e=>!(e.mask&~left));if(!available.length)return;if(!options||available.length<options.length)options=available;}
  for(const e of options!.sort((a,b)=>b.gain-a.gain||b.tiles.length-a.tiles.length))visit(left^e.mask,[...covered,e],gain+e.gain);
 }
 if(depth!==3){visit(all,[],0);return best;}
 // The larger search uses four 32-bit words instead of millions of BigInt
 // comparisons; the mandatory-cover rule and physical-tile identity stay exact.
 type Bits=[number,number,number,number];
 const bits=(mask:bigint):Bits=>[Number(mask&0xffffffffn)|0,Number((mask>>32n)&0xffffffffn)|0,Number((mask>>64n)&0xffffffffn)|0,Number((mask>>96n)&0xffffffffn)|0];
 const packed=entries.map(e=>({...e,bits:bits(e.mask)})),requiredBits=bits(mandatory),cells=ids.map((_,i)=>packed.filter(e=>!!(e.bits[i>>>5]&(1<<(i&31))))),order=ids.map((_,i)=>i).sort((a,b)=>cells[a].length-cells[b].length);
 const fits=(b:Bits,left:Bits)=>!(b[0]&~left[0])&&!(b[1]&~left[1])&&!(b[2]&~left[2])&&!(b[3]&~left[3]);
 function numeric(left:Bits,covered:typeof packed,gain:number){
  if(score>=maxGain||++nodes>budget)return;
  let options:typeof packed|undefined,scanned=0;
  for(const i of order)if(requiredBits[i>>>5]&left[i>>>5]&(1<<(i&31))){const available=cells[i].filter(e=>fits(e.bits,left));if(!available.length)return;if(!options||available.length<options.length)options=available;if(available.length===1||++scanned===8)break;}
  if(!options){
   if(gain>score){score=gain;let groups=[...locked];for(const e of covered){const old=selected.find(g=>g.tiles.join(',')===e.tiles.join(','));groups.push(old??placedGroup(o,e.tiles,groups,nodes));}best={groups,...(base.opening?{opening:base.opening}:{})};}
   options=packed.filter(e=>e.gain&&fits(e.bits,left)).sort((a,b)=>b.gain-a.gain).slice(0,12);
  }else options.sort((a,b)=>b.gain-a.gain||b.tiles.length-a.tiles.length);
  for(const e of options)numeric([left[0]^e.bits[0],left[1]^e.bits[1],left[2]^e.bits[2],left[3]^e.bits[3]],[...covered,e],gain+e.gain);
 }
 numeric(bits(all),[],0);return best;
}
