import {formation} from '../formations';
import {suits,type Soul} from '../../tabletop/rearrangement';
/** Enumerate structured formations without scanning every subset of a large rack. */
export function melds(tiles:readonly Soul[],decree:number,limit=600):string[][]{
 const result:string[][]=[],seen=new Set<string>(),jokers=tiles.filter(t=>t.rank==='joker'),ranks=Array.from({length:14},(_,rank)=>tiles.filter(t=>t.rank===rank));
 const add=(ts:Soul[])=>{const key=ts.map(t=>t.id).join(',');if(result.length<limit&&!seen.has(key)&&formation(ts,decree)){seen.add(key);result.push(ts.map(t=>t.id));}};
 for(let rank=1;rank<=13;rank++){
  const pool=[...ranks[rank],...jokers],min=decree===9?2:3;
  function choir(at:number,chosen:Soul[]){if(chosen.length>=min)add(chosen);if(chosen.length===4||result.length>=limit)return;for(let i=at;i<pool.length;i++){const t=pool[i];if(decree!==2&&t.rank!=='joker'&&chosen.some(c=>c.rank!=='joker'&&c.color===t.color))continue;choir(i+1,[...chosen,t]);}}
  if(decree!==10)choir(0,[]);
 }
 if(decree===10)for(let rank=1;rank<7;rank++)for(const color of suits){for(const a of [...ranks[rank].filter(t=>t.color===color),...jokers])for(const b of [...ranks[14-rank].filter(t=>t.color===color),...jokers])if(a.id!==b.id)add([a,b]);}
 if(decree===6){for(let a=1;a<=13;a++)for(let b=a+1;b<=13;b++){const pool=[...ranks[a],...ranks[b],...jokers];if(pool.length<4)continue;const choose=(at:number,ts:Soul[])=>{if(ts.length===4||ts.length===5)add(ts);if(ts.length===5||result.length>=limit)return;for(let i=at;i<pool.length;i++)choose(i+1,[...ts,pool[i]]);};choose(0,[]);}}
 const palettes=decree===4?suits.flatMap(a=>suits.filter(b=>b!==a).map(b=>[a,b])):decree===3?[suits]:suits.map(c=>[c]);
 // Vary the first available suit/copy for Rainbow runs; keep the tree bounded.
 for(const palette of palettes)for(let offset=0;offset<(decree===3?4:1);offset++)for(let start=1;start<=13;start++){
  function run(rank:number,ts:Soul[],usedJokers:number){
   if(ts.length>=(decree===7?4:3))add(ts);if(ts.length===13||result.length>=limit)return;
   for(const step of decree===1?[2]:decree===8?[1,2]:[1]){let next=rank+step;if(decree===5)next=(next-1)%13+1;if(next>13||ts.some(t=>t.rank===next))continue;
    const color=decree===3?null:palette[ts.length%palette.length];const matches=ranks[next].filter(t=>(!color||t.color===color)&&!ts.some(c=>c.id===t.id));const candidate=matches[offset%Math.max(1,matches.length)];
    if(candidate)run(next,[...ts,candidate],usedJokers);
    // Keeping a numbered tile can be valuable even when a joker fits that cell.
    if(usedJokers<jokers.length&&(!candidate||ts.length<4))run(next,[...ts,jokers[usedJokers]],usedJokers+1);
   }
  }
  const color=decree===3?null:palette[0];const candidates=ranks[start].filter(t=>!color||t.color===color),first=candidates[offset%Math.max(1,candidates.length)];if(first)run(start,[first],0);if(jokers.length)run(start,[jokers[0]],1);
 }
 return result;
}
