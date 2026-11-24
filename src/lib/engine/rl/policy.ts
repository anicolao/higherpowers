import {formation} from '../formations';
import {angelIds,tryCommand,type State,type Command,type Group} from '../engine';
import {observe,type Observation} from './observation';
import {melds} from './melds';
import {greedyPlan,rearrangePlan,refinedPlan,placedGroup,tileValue,affinity,type Plan} from './planner';
import {powerChoices} from './powers';
import {estimateGift} from './lookahead';
export const featureNames=['bias','delivered','penaltyShed','connections','meldPotential','favor','finish','draw','jokerHeld','lowRack','power','purgatory','giftTarget','inspection','credit','zeal','shelter'] as const;
export interface Model {version:1;level:'easy'|'standard'|'hard';algorithm:string;weights:number[];powers:boolean;planning:number;training?:Record<string,unknown>;}
export interface Choice {command:Command;features:number[];}
export const initialWeights=[0,2,.5,.5,.8,.2,30,-1,-1,.2,0,-2,.2,1,.5,1,.5];
const rank=(o:Observation,id:string)=>o.tiles[id].rank==='joker'?30:Number(o.tiles[id].rank);
export function connections(o:Observation,hand:readonly string[]){let sum=0;for(let i=0;i<hand.length;i++){const a=o.tiles[hand[i]];for(let j=i+1;j<hand.length;j++){const b=o.tiles[hand[j]];if(a.rank==='joker'||b.rank==='joker')sum+=1;else if(a.rank===b.rank&&(a.color!==b.color||o.decree===2))sum+=1;else if((a.color===b.color||o.decree===3)&&Math.abs(a.rank-b.rank)<=(o.decree===1||o.decree===8?2:1))sum+=1;}}return sum;}
function features(o:Observation,c:Command):number[]{
 let hand=[...o.me.hand],delivered=0,shed=0,power=0,purgatory=0,target=0,credit=0,shelter=0,futureCount=hand.length;
 if(c.type==='organize'){const placed=new Set(c.groups.flatMap(g=>g.tiles)),before=new Set(o.heaven.flatMap(g=>g.tiles));const outgoing=hand.filter(id=>placed.has(id)||c.power?.kind==='penance'&&c.power.tile===id);delivered=outgoing.length;shed=outgoing.reduce((n,id)=>n+rank(o,id),0);hand=hand.filter(id=>!outgoing.includes(id));if(c.power?.kind==='forgive'&&!placed.has(c.power.tile))hand.push(c.power.tile);if(c.power?.kind==='transfigure'){hand.push(...c.power.tiles);shed-=c.power.tiles.reduce((n,id)=>n+rank(o,id),0);}delivered=o.me.hand.length-hand.length;power=Number(!!c.power);purgatory=Number(c.power?.kind==='penance');shelter=c.groups.filter(g=>g.zone===o.me.id).reduce((n,g)=>n+g.tiles.length,0);credit=o.me.scales.filter(id=>placed.has(id)).reduce((n,id)=>n+rank(o,id),0);target=c.groups.flatMap(g=>g.tiles).filter(id=>!before.has(id)).length;}
 if(c.type==='keep'){hand.push(c.tile);target=connections(o,hand)-connections(o,o.me.hand);shed=-rank(o,c.tile);}
 if(c.type==='dance-choice'){hand=hand.filter(id=>!c.tiles.includes(id));shed=c.tiles.reduce((n,id)=>n+rank(o,id),0)-7*c.tiles.length;}
 if(c.type==='communion'){power=1;target=(o.rivals.find(r=>r.id===c.target)?.count??0)/2;}
 if(c.type==='judgment-choice'){if(c.target)target=10/(1+(o.rivals.find(r=>r.id===c.target)?.count??0));credit=(c.tiles??[]).reduce((n,id)=>n+rank(o,id),0);purgatory=(c.tiles??[]).length;}
 if(c.type==='draw'&&c.foretell){power=1;target=8-(1+o.rivals.filter(r=>r.favor<o.me.favor).length);}
 if(c.type==='continue'&&c.zeal)power=1;
 if(c.type==='before'){power=1;if(c.power==='banish'){const ids=hand.filter(id=>o.tiles[id].rank===c.rank);shed=ids.reduce((n,id)=>n+rank(o,id),0);delivered=ids.length;hand=hand.filter(id=>!ids.includes(id));target=10/(1+(o.rivals.find(r=>r.id===c.target)?.count??0));}if(c.power==='judgment'){shed=(c.tiles??[]).reduce((n,id)=>n+rank(o,id),0);hand=hand.filter(id=>!c.tiles?.includes(id));target=-(c.tiles?.length??0);shed-=14*(c.tiles?.length??0);}if(c.power==='calling'){const r=c.rank!;target=hand.reduce((n,id)=>{const t=o.tiles[id];return n+(t.rank===r?2:Math.abs(Number(t.rank)-r)===1?1:0);},0);const seen=new Set([...o.heaven.flatMap(g=>g.tiles),...hand,...o.rivals.flatMap(r=>r.purgatory?[r.purgatory]:[])]);target*=Object.values(o.tiles).filter(t=>t.rank===r&&!seen.has(t.id)).length/8;}if(c.power==='dance'){target=c.count??0;}}
 futureCount=hand.length;if(c.type==='before'&&c.power==='judgment')futureCount=o.me.hand.length+(c.tiles?.length??0);if(c.type==='dance-choice')futureCount=o.me.hand.length;const favors=o.rivals.filter(p=>p.favor>=o.me.favor+delivered).length;
 return [1,delivered,shed/13,connections(o,hand)/10,melds(hand.map(id=>o.tiles[id]),o.decree,30).length/10,(o.rivals.length+1-favors)/5,futureCount===0?1:0,c.type==='draw'?1:0,hand.filter(id=>o.tiles[id].rank==='joker').length,1/(futureCount+1),power,purgatory,target/10,c.type==='keep'?1:0,credit/13,c.type==='continue'&&c.zeal?1:0,shelter/10];
}
export function choices(o:Observation,model:Model):Choice[]{
 const p=o.me,turn=o.turn,candidates:Command[]=[];
 const add=(c:Command)=>candidates.push(c);
 if((o.phase==='angels'||o.phase==='lobby')&&!p.angel){for(const angel of p.options)add({type:'angel',angel});}
 else if(o.phase==='judgment'&&!p.ready){if(o.judgment===2)for(const q of o.rivals)add({type:'judgment-choice',target:q.id});else{const likely=[...p.hand].filter(id=>o.tiles[id].rank!=='joker').sort((a,b)=>rank(o,b)-rank(o,a));for(let n=0;n<=Math.min(5,likely.length);n++)add({type:'judgment-choice',tiles:likely.slice(0,n)});}}
 else if(o.phase==='dance'&&o.danceCount){const orders=[[...p.hand].sort((a,b)=>rank(o,b)-rank(o,a)),[...p.hand].sort((a,b)=>rank(o,a)-rank(o,b))];if(model.powers)orders.push([...p.hand].sort((a,b)=>affinity(o,p.hand,a)-affinity(o,p.hand,b)||rank(o,b)-rank(o,a)));for(const ts of orders)add({type:'dance-choice',tiles:ts.slice(0,o.danceCount),turn});}
 else if(!o.active)return [];
 else if(o.phase==='after-turn'){add({type:'continue',turn});if(model.powers&&p.angel==='jegudiel'&&!p.used)add({type:'continue',zeal:true,turn});}
 else if(o.phase==='inspect'){for(const tile of o.inspection)add({type:'keep',tile,turn});}
 else if(o.phase==='play'){
  const hand=[...p.hand,...(p.purgatory?[p.purgatory]:[])],plans:Plan[]=[];
  for(let mode=0;mode<(model.planning===1?1:3);mode++){
   let plan=greedyPlan(o,hand,o.heaven,mode);
   if(!p.purgatory&&plan.groups.flatMap(g=>g.tiles).filter(id=>p.hand.includes(id)).length<p.hand.length&&(model.planning===3||p.hand.length<7||!plan.groups.some(g=>g.tiles.some(id=>p.hand.includes(id)))||model.planning>1&&p.hand.length-plan.groups.flatMap(g=>g.tiles).filter(id=>p.hand.includes(id)).length<7)){if(model.planning===3){const standard=rearrangePlan(o,plan,2,mode);plans.push(standard);add({type:'organize',...standard,turn});plan=rearrangePlan(o,standard,3,mode);}else plan=rearrangePlan(o,plan,model.planning,mode);}
   const containsPurgatory=!p.purgatory||plan.groups.some(g=>g.tiles.includes(p.purgatory!)&&formation(g.tiles.map(id=>o.tiles[id]),o.decree,g.jokerFaces)==='procession');
   if(containsPurgatory){plans.push(plan);add({type:'organize',...plan,turn});if(model.powers&&p.sanctuary){const kind=p.angel==='selaphiel'?'choir':'procession';add({type:'organize',...plan,groups:plan.groups.map(g=>(g.zone===p.id||g.zone===null&&g.tiles.some(id=>o.heaven.some(old=>old.zone===p.id&&old.tiles.includes(id))))&&formation(g.tiles.map(id=>o.tiles[id]),o.decree,g.jokerFaces)===kind?{...g,zone:p.id}:g),turn});}}
  }
  if(o.communion.length&&(p.opened||plans.some(p=>p.opening)))for(const tile of o.communion){const borrowed={...o,me:{...p,hand:[...p.hand,tile]}};let plan=greedyPlan(borrowed,borrowed.me.hand,o.heaven);if(!p.opened&&plan.opening?.includes(tile)){const opened=plans.find(p=>p.opening)!;const used=new Set(opened.groups.flatMap(g=>g.tiles));plan={...greedyPlan({...borrowed,me:{...borrowed.me,opened:true}},borrowed.me.hand.filter(id=>!used.has(id)),opened.groups),opening:opened.opening};}plan=refinedPlan(borrowed,plan,model.planning);if(plan.groups.some(g=>g.tiles.includes(tile)))add({type:'organize',...plan,communionTile:tile,turn});}
  if(model.powers)candidates.push(...powerChoices(o,plans,model.planning));
  add({type:'draw',turn});if(p.angel==='uriel'&&!p.used&&o.bagCount&&!p.purgatory)add({type:'draw',foretell:true,turn});
 }

 return candidates.map(command=>{const x=features(o,command);if(model.planning===3&&command.type==='keep'&&!p.purgatory){const next={...o,me:{...p,hand:[...p.hand,command.tile]}},base=greedyPlan(next,next.me.hand,next.heaven),plan=refinedPlan(next,base,3),played=new Set(plan.groups.flatMap(g=>g.tiles)),count=next.me.hand.filter(id=>played.has(id)).length;x[1]=count;x[6]=count===next.me.hand.length?1:0;}if(model.powers){const estimate=estimateGift(o,command,model.planning===3?8:4);if(estimate){x[1]=estimate.delivered;x[2]=estimate.penalty/13;x[6]=estimate.finish;x[9]=1/(o.me.hand.length-estimate.delivered+1);x[12]=0;}if(command.type==='organize'&&command.communionTile&&o.communion.length===1&&x[6]===0)x[6]=-1;const gift=command.type==='before'||command.type==='communion'||command.type==='organize'&&!!command.power||command.type==='draw'&&!!command.foretell||command.type==='continue'&&!!command.zeal;x.push(...angelIds.map(a=>gift&&p.angel===a?1:0));}return {command,features:x};});
}
export function score(choice:Choice,model:Model){return choice.features.reduce((n,x,i)=>n+x*(model.weights[i]??0),0);}
export function learnedCommand(s:State,id:string,model:Model):Command|null{
 const o=observe(s,id),options=choices(o,model);options.sort((a,b)=>score(b,model)-score(a,model));
 for(const option of options)if(!tryCommand(s,id,option.command))return option.command;
 return null;
}
