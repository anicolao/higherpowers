import {formation} from './formations';
import {normalizeDraftGroup} from './draft';
import {suits,type Soul,type SoulSpec,type TileGroup,type Repair} from '../tabletop/rearrangement';

/** Order a complete Procession, preserving legal groups and existing joker identities when possible. */
export function arrangeDraftGroup(group:TileGroup,decree=0):TileGroup{
 const normalized=normalizeDraftGroup(group,decree),n=group.tiles.length;
 if(formation(normalized.tiles,decree,normalized.jokerFaces)||n<(decree===7?4:3)||n>13)return normalized;
 const numbered=group.tiles.filter(t=>t.rank!=='joker'),jokers=group.tiles.filter(t=>t.rank==='joker');
 if(new Set(numbered.map(t=>t.rank)).size!==numbered.length)return normalized;
 const byRank=new Map(numbered.map(t=>[Number(t.rank),t])),original=new Map(group.tiles.map((t,i)=>[t.id,i]));
 const modes=normalized.jokerFaces?[true,false]:[false];
 for(const preserve of modes){
  let best:{tiles:Soul[];faces:Record<string,SoulSpec>;cost:number}|null=null;
  function offer(ranks:number[]){
   if(numbered.some(t=>!ranks.includes(Number(t.rank))))return;
   const unused=[...jokers],tiles:Soul[]=[];
   for(const rank of ranks){let tile=byRank.get(rank);if(!tile){let at=preserve?unused.findIndex(t=>normalized.jokerFaces?.[t.id]?.rank===rank):-1;if(at<0)at=unused.findIndex(t=>!preserve||!normalized.jokerFaces?.[t.id]);if(at<0)return;tile=unused.splice(at,1)[0];}tiles.push(tile);}
   const palettes=decree===4?suits.flatMap(a=>suits.filter(b=>a!==b).map(b=>[a,b])):[[numbered[0]?.color??'black']];
   for(const palette of palettes){const faces=Object.fromEntries(tiles.flatMap((t,i)=>t.rank==='joker'?[[t.id,{rank:ranks[i],color:decree===3?(normalized.jokerFaces?.[t.id]?.color??t.color):palette[i%palette.length]}]]:[])) as Record<string,SoulSpec>;
    if(preserve&&Object.entries(normalized.jokerFaces??{}).some(([id,f])=>faces[id]?.rank!==f.rank||faces[id]?.color!==f.color))continue;
    if(formation(tiles,decree,faces)!=='procession')continue;const cost=tiles.reduce((sum,t,i)=>sum+Math.abs(original.get(t.id)!-i),0);if(!best||cost<best.cost)best={tiles,faces,cost};
   }
  }
  function visit(ranks:number[]){if(ranks.length===n){offer(ranks);return;}for(const step of decree===1?[2]:decree===8?[1,2]:[1]){const next=decree===5?(ranks.at(-1)!+step-1)%13+1:ranks.at(-1)!+step;if(next<=13&&!ranks.includes(next))visit([...ranks,next]);}}
  for(let start=1;start<=13;start++)visit([start]);
  const found=best as {tiles:Soul[];faces:Record<string,SoulSpec>;cost:number}|null;
  if(found)return normalizeDraftGroup({...group,tiles:found.tiles,slots:undefined,layoutKind:'procession',jokerFaces:found.faces},decree);
 }
 return normalized;
}

/** Missing earlier additions are not already-present tiles when computing an insertion slot. */
export function repairInsertion(tiles:readonly Soul[],spec:SoulSpec,repair:Repair,decree=0):number{
 const tile:Soul={id:'repair-candidate',...spec};
 for(let at=0;at<=tiles.length;at++){const k=formation([...tiles.slice(0,at),tile,...tiles.slice(at)],decree);if(k&&(repair.kind==='procession'?k==='procession':k!=='procession'))return at;}
 const occupied=new Set<number>();let next=0;
 for(let i=0;i<repair.completed.length&&next<tiles.length;i++){const slot=repair.completed[i],existing=tiles[next];if(existing.rank==='joker'||existing.rank===slot.rank&&existing.color===slot.color){occupied.add(i);next++;}}
 let target=repair.completed.findIndex((s,i)=>!occupied.has(i)&&s.rank===spec.rank&&s.color===spec.color);
 if(target<0)target=repair.completed.findIndex(s=>s.rank===spec.rank&&s.color===spec.color);
 return target<0?tiles.length:[...occupied].filter(i=>i<target).length;
}
