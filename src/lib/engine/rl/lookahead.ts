import type {Command} from '../types';import type {Observation} from './observation';import {greedyPlan,tileValue} from './planner';
interface Estimate {delivered:number;penalty:number;finish:number;connections:number;hand:string[];}
/** Independent public-state sampling. Never use the engine seed, bag order, or real hidden racks. */
export function estimateGift(o:Observation,c:Command,samples=4):Estimate|null{
 if(c.type!=='before'&&c.type!=='communion')return null;
 const known=new Set([...o.me.hand,...o.heaven.flatMap(g=>g.tiles),...(o.me.purgatory?[o.me.purgatory]:[]),...o.rivals.flatMap(r=>r.purgatory?[r.purgatory]:[])]),unknown=Object.keys(o.tiles).filter(id=>!known.has(id));
 let seed=2166136261;for(const char of `${o.round}/${o.turn}/${o.me.hand.join(',')}/${JSON.stringify(c)}`)seed=Math.imul(seed^char.charCodeAt(0),16777619)>>>0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const shuffle=(ids:string[])=>{const a=[...ids];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const value=(hand:string[],borrowed?:string):Estimate=>{
  const plan=greedyPlan(o,hand,o.heaven),placed=new Set(plan.groups.flatMap(g=>g.tiles)),remaining=hand.filter(id=>!placed.has(id));
  if(borrowed&&(!o.me.opened&&!!plan.opening?.includes(borrowed)||!placed.has(borrowed)||!o.me.hand.some(id=>placed.has(id))))return {delivered:0,penalty:0,finish:0,connections:0,hand:o.me.hand};
  return {delivered:o.me.hand.length-remaining.length,penalty:o.me.hand.reduce((n,id)=>n+tileValue(o,id),0)-remaining.reduce((n,id)=>n+tileValue(o,id),0),finish:remaining.length===0?1:0,connections:0,hand:remaining};
 };
 const outcomes:Estimate[]=[];
 for(let sample=0;sample<samples;sample++){
  const world=shuffle(unknown);let hand=[...o.me.hand],loss=false;
  if(c.type==='communion'){
   const count=o.rivals.find(r=>r.id===c.target)!.count,candidates=world.slice(0,count).map(id=>value([...hand,id],id));candidates.sort((a,b)=>b.finish-a.finish||b.delivered-a.delivered||b.penalty-a.penalty);const best=candidates[0]??value(hand);if(count===1&&!best.finish){outcomes.push(value(hand));continue;}outcomes.push(best);continue;
  }
  if(c.power==='banish')hand=hand.filter(id=>o.tiles[id].rank!==c.rank);
  if(c.power==='calling'){
   let at=0;for(const rival of o.rivals){const rack=world.slice(at,at+rival.count);at+=rival.count;const called=rack.filter(id=>o.tiles[id].rank===c.rank);hand.push(...called);if(called.length===rack.length&&rack.length)loss=true;}
  }
  if(c.power==='judgment'){
   const returned=c.tiles??[],bag=shuffle([...world.slice(0,o.bagCount),...returned]);hand=[...hand.filter(id=>!returned.includes(id)),...bag.slice(0,2*returned.length)];
  }
  if(c.power==='dance'){
   const count=c.count!,orders=[[...hand].sort((a,b)=>tileValue(o,b)-tileValue(o,a)),[...hand].sort((a,b)=>tileValue(o,a)-tileValue(o,b))];
   const donorCount=o.rivals.find(r=>r.id===o.danceFrom)?.count??o.rivals[0].count,donor=world.slice(0,donorCount).sort((a,b)=>tileValue(o,b)-tileValue(o,a)),incoming=donor.slice(0,count);
   const trials=orders.map(order=>value([...hand.filter(id=>!order.slice(0,count).includes(id)),...incoming]));trials.sort((a,b)=>b.finish-a.finish||b.delivered-a.delivered||b.penalty-a.penalty);outcomes.push(trials[0]);continue;
  }
  const outcome=value(hand);if(loss){outcome.delivered=-o.me.hand.length;outcome.penalty=-o.me.hand.reduce((n,id)=>n+tileValue(o,id),0);outcome.finish=-1;}outcomes.push(outcome);
 }
 return {delivered:outcomes.reduce((n,r)=>n+r.delivered,0)/samples,penalty:outcomes.reduce((n,r)=>n+r.penalty,0)/samples,finish:outcomes.reduce((n,r)=>n+r.finish,0)/samples,connections:0,hand:outcomes[0].hand};
}
