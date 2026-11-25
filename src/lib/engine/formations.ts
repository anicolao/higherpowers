import {suits,analyzeFormation,type Soul,type SoulSpec,type Formation} from '../tabletop/rearrangement';
export type FormationKind='choir'|'procession'|'poker';
const matches=(t:Soul,r:number,c:string)=>t.rank==='joker'||(t.rank===r&&t.color===c);
export function formation(tiles:readonly Soul[],decree=0,faces:Record<string,SoulSpec>={},legacyPoker=false):FormationKind|null {
 if(!tiles.length)return null;
 const ts=tiles.map(t=>t.rank==='joker'&&faces[t.id]?{...t,...faces[t.id]}:t);
 const numbered=ts.filter(t=>t.rank!=='joker'),n=ts.length,j=n-numbered.length;
 if(numbered.some(t=>!Number.isInteger(t.rank)||Number(t.rank)<1||Number(t.rank)>13||!suits.includes(t.color)))return null;
 if(decree===10){if(n===2)for(const color of suits)for(let r=1;r<=13;r++)if(r!==7&&matches(ts[0],r,color)&&matches(ts[1],14-r,color))return 'choir';}
 else if(n>=(decree===9?2:3)&&n<=4&&new Set(numbered.map(t=>t.rank)).size<=1&&(decree===2||new Set(numbered.map(t=>t.color)).size===numbered.length))return 'choir';
 if(decree===6&&(n===4||n===5)){
  const counts=new Map<number,number>();for(const t of numbered)counts.set(Number(t.rank),(counts.get(Number(t.rank))??0)+1);
  const distinct=legacyPoker||[...counts.keys()].every(rank=>{const group=numbered.filter(t=>t.rank===rank);return new Set(group.map(t=>t.color)).size===group.length;});
  if(distinct)for(let a=1;a<=13;a++)for(let b=a+1;b<=13;b++)for(const sizes of n===4?[[2,2]]:[[2,3],[3,2]])if([...counts].every(([r,c])=>r===a?c<=sizes[0]:r===b?c<=sizes[1]:false)&&sizes[0]+sizes[1]-numbered.length===j)return 'poker';
 }
 if(n<(decree===7?4:3)||n>13)return null;
 for(let start=1;start<=13;start++){
  const visit=(i:number,rank:number):boolean=>{
   if(rank<1||rank>13)return false;
   if(ts[i].rank!=='joker'&&ts[i].rank!==rank)return false;
   if(i===n-1)return true;
   const steps=decree===1?[2]:decree===8?[1,2]:[1];
   return steps.some(step=>visit(i+1,decree===5?(rank+step-1)%13+1:rank+step));
  };
  if(!visit(0,start))continue;
  if(decree===3)return 'procession';
  if(decree===4){for(const a of suits)for(const b of suits)if(a!==b&&ts.every((t,i)=>t.rank==='joker'||t.color===(i%2?b:a)))return 'procession';}
  else if(new Set(numbered.map(t=>t.color)).size<=1)return 'procession';
 }
 return null;
}
export function inspectFormation(tiles:readonly Soul[],decree=0):Formation {
 const kind=formation(tiles,decree);if(kind)return {legal:true,kind:kind==='poker'?'choir':kind,repairs:[]};
 if(!decree)return analyzeFormation(tiles);
 const repairs:Formation['repairs']=[];
 for(const color of suits)for(let rank=1;rank<=13;rank++)for(let at=0;at<=tiles.length;at++){
  const tile={id:'suggestion',rank,color},full=[...tiles.slice(0,at),tile,...tiles.slice(at)],k=formation(full,decree);
  if(k&&!repairs.some(r=>r.additions[0].rank===rank&&r.additions[0].color===color))repairs.push({kind:k==='procession'?'procession':'choir',additions:[{rank,color}],completed:full.map(t=>({rank:t.rank==='joker'?rank:t.rank,color:t.color}))});
 }
 if(!repairs.length)for(const r of analyzeFormation(tiles).repairs)if(formation(r.completed.map((t,i)=>({...t,id:String(i)})),decree))repairs.push(r);
 return {legal:false,kind:'unformed',repairs:repairs.slice(0,8)};
}

/** Resolve undeclared joker faces in a stable rank/suit order; explicit choices remain binding. */
export function resolveJokers(tiles:readonly Soul[],decree=0,declared:Record<string,SoulSpec>={},legacyPoker=false):Record<string,SoulSpec>|null{
 const jokers=tiles.filter(t=>t.rank==='joker'),faces={...declared};
 function choose(i:number):Record<string,SoulSpec>|null{if(i===jokers.length)return formation(tiles,decree,faces,legacyPoker)?{...faces}:null;const id=jokers[i].id;if(faces[id])return choose(i+1);for(let rank=1;rank<=13;rank++)for(const color of suits){faces[id]={rank,color};const found=choose(i+1);if(found)return found;}delete faces[id];return null;}
 return choose(0);
}
