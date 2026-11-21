import {analyzeFormation,overlaps,suits,type Soul,type Suit,type TileGroup,type Rect} from './rearrangement';
export type FormationAxis='procession'|'choir';
export interface Geometry {kind:FormationAxis;cells:{tile:Soul;rank:number;color:Suit;column:number}[]}
export interface Metrics {step:number;tileHeight:number;rowPitch:number}
export interface VerticalSnap {moving:TileGroup;target:TileGroup;targetId:string;kind:FormationAxis;direction:'north'|'south';score:number}

export function tileColumn(group:TileGroup,index:number):number{return group.slots?.[index]??index;}
export function groupRect(group:TileGroup,step:number,tileHeight:number):Rect{return {x:group.x,y:group.y,width:(Math.max(...group.tiles.map((_,i)=>tileColumn(group,i)),0)+1)*step-3,height:tileHeight};}
export function geometry(group:TileGroup,preferred?:FormationAxis):Geometry|null{
 const known=group.tiles.flatMap(tile=>tile.rank==='joker'?(group.jokerFaces?.[tile.id]?[group.jokerFaces[tile.id]]:[]):[{rank:tile.rank,color:tile.color}]);if(!group.tiles.length)return null;
 const legal=analyzeFormation(group.tiles),kind=preferred??(legal.legal?legal.kind:group.layoutKind);
 const tryChoir=()=>{
  if(group.tiles.length>4||new Set(known.map(t=>t.rank)).size>1||new Set(known.map(t=>t.color)).size!==known.length)return null;
  const rank=Number(known[0]?.rank??7),available=suits.filter(c=>!known.some(t=>t.color===c));let wild=0;
  return {kind:'choir' as const,cells:group.tiles.map(tile=>{const color=tile.rank==='joker'?(group.jokerFaces?.[tile.id]?.color??available[wild++]):tile.color;return {tile,rank,color,column:suits.indexOf(color)};})};
 };
 const tryProcession=()=>{
  if(group.tiles.length>13||new Set(known.map(t=>t.color)).size>1)return null;
  const color=known[0]?.color??'black',first=group.tiles.findIndex(t=>t.rank!=='joker'||group.jokerFaces?.[t.id]);
  let prior=first<0?0:Number(group.tiles[first].rank==='joker'?group.jokerFaces![group.tiles[first].id].rank:group.tiles[first].rank)-first-1;
  const cells:Geometry['cells']=[];
  for(const tile of group.tiles){const rank=tile.rank==='joker'?(group.jokerFaces?.[tile.id]?.rank??prior+1):Number(tile.rank);if(rank<1||rank>13||rank<=prior)return null;cells.push({tile,rank,color,column:rank-1});prior=rank;}
  return {kind:'procession' as const,cells};
 };
 if(kind==='choir')return tryChoir();if(kind==='procession')return tryProcession();
 return tryChoir()??tryProcession();
}
export function canonicalGroup(group:TileGroup,kind?:FormationAxis):TileGroup|null{
 const info=geometry(group,kind);if(!info)return null;
 const cells=[...info.cells].sort((a,b)=>a.column-b.column),first=cells[0].column;
 return {...group,layoutKind:info.kind,tiles:cells.map(c=>c.tile),slots:cells.map(c=>c.column-first),jokerFaces:Object.fromEntries(cells.filter(c=>c.tile.rank==='joker').map(c=>[c.tile.id,{rank:c.rank,color:c.color}]))};
}
function keys(group:TileGroup,info:Geometry,step:number){return new Map(info.cells.map(cell=>{const index=group.tiles.findIndex(t=>t.id===cell.tile.id);return [cell.column,group.x+tileColumn(group,index)*step] as const;}));}
export function findVerticalSnap(groups:readonly TileGroup[],id:string,metrics:Metrics,width:number,height:number):VerticalSnap|null{
 const original=groups.find(g=>g.id===id);if(!original)return null;let best:VerticalSnap|null=null;
 for(const targetOriginal of groups){
  if(targetOriginal.id===id)continue;
  const targetInfo=geometry(targetOriginal);if(!targetInfo)continue;const moving=canonicalGroup(original,targetInfo.kind),target=canonicalGroup(targetOriginal,targetInfo.kind);if(!moving||!target)continue;
  const mi=geometry(moving,targetInfo.kind)!,ti=geometry(target,targetInfo.kind)!,mk=keys(moving,mi,metrics.step),tk=keys(target,ti,metrics.step),common=[...mk.keys()].filter(key=>tk.has(key));if(!common.length)continue;
  const dx=tk.get(common[0])!-mk.get(common[0])!;if(common.some(key=>Math.abs(tk.get(key)!-mk.get(key)!-dx)>.5))continue;
  for(const direction of [-1,1]){
   const x=moving.x+dx,y=target.y+direction*metrics.rowPitch,xDistance=Math.abs(x-original.x),yDistance=Math.abs(y-original.y);
   if(xDistance>metrics.step*.6||yDistance>Math.max(18,metrics.tileHeight*.36))continue;
   const snapped={...moving,x,y},box=groupRect(snapped,metrics.step,metrics.tileHeight),targetBox=groupRect(target,metrics.step,metrics.tileHeight);
   if(x<8||y<8||x+box.width>width-8||y+box.height>height-8)continue;
   if(groups.some(g=>g.id!==id&&g.id!==target.id&&(overlaps(box,groupRect(g,metrics.step,metrics.tileHeight),3)||overlaps(targetBox,groupRect(g,metrics.step,metrics.tileHeight),3))))continue;
   const score=xDistance+yDistance;if(!best||score<best.score)best={moving:snapped,target,targetId:target.id,kind:targetInfo.kind,direction:direction<0?'north':'south',score};
  }
 }return best;
}
export function alignedStack(groups:readonly TileGroup[],id:string,metrics:Metrics):TileGroup[]{
 const seed=groups.find(g=>g.id===id),seedInfo=seed&&geometry(seed);if(!seed||!seedInfo)return [];
 const selected=[seed],seen=new Set([id]);
 for(let i=0;i<selected.length;i++){
  const a=selected[i],ai=geometry(a,seedInfo.kind);if(!ai)continue;const ak=keys(a,ai,metrics.step);
  for(const b of groups){if(seen.has(b.id)||Math.abs(Math.abs(a.y-b.y)-metrics.rowPitch)>2)continue;const bi=geometry(b,seedInfo.kind);if(!bi)continue;const bk=keys(b,bi,metrics.step),common=[...ak.keys()].filter(k=>bk.has(k));
   if(common.length&&common.every(k=>Math.abs(ak.get(k)!-bk.get(k)!)<=1)){seen.add(b.id);selected.push(b);}
  }
 }return selected.length>=2?selected.sort((a,b)=>a.y-b.y||a.x-b.x):[];
}
interface Resolved {tile:Soul;rank:number;color:Suit}
// Maximize the number of souls in complete Choirs before leaving partial groups.
function choirPartition(items:Resolved[]):Resolved[][]{
 const bins=suits.map(c=>items.filter(t=>t.color===c)),memo=new Map<string,{used:number;sets:number[][]}>();
 function solve(counts:number[]):{used:number;sets:number[][]}{const key=counts.join(',');const cached=memo.get(key);if(cached)return cached;let best={used:0,sets:[] as number[][]};
  for(let mask=1;mask<16;mask++){const set=[0,1,2,3].filter(i=>mask&(1<<i));if(set.length<3||set.some(i=>counts[i]===0))continue;const next=counts.map((n,i)=>n-(set.includes(i)?1:0)),rest=solve(next),used=set.length+rest.used,sets=[set,...rest.sets];if(used>best.used||(used===best.used&&sets.length<best.sets.length))best={used,sets};}
  memo.set(key,best);return best;
 }
 const choice=solve(bins.map(b=>b.length)),result=choice.sets.map(set=>set.map(i=>bins[i].shift()!));
 while(bins.some(b=>b.length))result.push(bins.filter(b=>b.length).map(b=>b.shift()!));
 return result;
}
function processionPartition(items:Resolved[]):Resolved[][]{
 const chains:Resolved[][]=[];
 for(const item of [...items].sort((a,b)=>a.rank-b.rank)){
  const eligible=chains.filter(c=>c[c.length-1].rank===item.rank-1).sort((a,b)=>b.length-a.length);
  if(eligible[0])eligible[0].push(item);else chains.push([item]);
 }return chains;
}
export function transposeStack(stack:readonly TileGroup[],metrics:Metrics,worldWidth:number,otherGroups:readonly TileGroup[],makeId:()=>string):TileGroup[]{
 if(stack.length<2)return [];const kind=geometry(stack[0])?.kind;if(!kind)return [];
 const rows=stack.map(g=>geometry(g,kind));if(rows.some(r=>!r))return [];
 const cells:Resolved[]=rows.flatMap(row=>row!.cells.map(({tile,rank,color})=>({tile,rank,color}))),output:Resolved[][]=[];
 if(kind==='procession'){
  for(const rank of [...new Set(cells.map(c=>c.rank))].sort((a,b)=>a-b))output.push(...choirPartition(cells.filter(c=>c.rank===rank)));
 }else for(const color of suits)output.push(...processionPartition(cells.filter(c=>c.color===color)));
 const targetKind:FormationAxis=kind==='procession'?'choir':'procession';
 const column=(tile:Resolved)=>targetKind==='choir'?suits.indexOf(tile.color):tile.rank-1;
 const origin=Math.min(...cells.map(column));
 const raw=output.map((line,i)=>{const sorted=[...line].sort((a,b)=>column(a)-column(b)),first=column(sorted[0]);const g:TileGroup={id:makeId(),layoutKind:targetKind,x:(first-origin)*metrics.step,y:i*metrics.rowPitch,tiles:sorted.map(c=>c.tile),slots:sorted.map(c=>column(c)-first),jokerFaces:Object.fromEntries(sorted.filter(c=>c.tile.rank==='joker').map(c=>[c.tile.id,{rank:c.rank,color:c.color}]))};return canonicalGroup(g,targetKind)??g;});
 const maxRight=Math.max(...raw.map(g=>g.x+groupRect(g,metrics.step,metrics.tileHeight).width)),width=Math.max(worldWidth,maxRight+16),anchorX=Math.max(8,Math.min(Math.min(...stack.map(g=>g.x)),width-maxRight-8)),anchorY=Math.max(8,Math.min(...stack.map(g=>g.y)));
 const occupied=otherGroups.map(g=>groupRect(g,metrics.step,metrics.tileHeight));let y=anchorY,placed=false;
 for(let attempts=0;attempts<100;attempts++){
  if(raw.every(g=>!occupied.some(r=>overlaps(groupRect({...g,x:g.x+anchorX,y:g.y+y},metrics.step,metrics.tileHeight),r,8)))){placed=true;break;}
  y+=metrics.rowPitch;
 }
 if(!placed)y=Math.max(anchorY,...occupied.map(r=>r.y+r.height+8));
 return raw.map(g=>({...g,x:g.x+anchorX,y:g.y+y}));
}
