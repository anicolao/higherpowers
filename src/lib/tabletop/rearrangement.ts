export const suits=['black','red','blue','green'] as const;
export type Suit=typeof suits[number];
export interface Soul {id:string;rank:number|'joker';color:Suit}
export interface SoulSpec {rank:number;color:Suit}
export interface TileGroup {id:string;x:number;y:number;tiles:Soul[];zone?:string|null;slots?:number[];layoutKind?:'procession'|'choir';jokerFaces?:Record<string,SoulSpec>}
export interface Repair {kind:'choir'|'procession';additions:SoulSpec[];completed:SoulSpec[]}
export interface Formation {legal:boolean;kind:'choir'|'procession'|'unformed';repairs:Repair[]}

export function isChoir(tiles:readonly Pick<Soul,'rank'|'color'>[]):boolean{
 if(tiles.length<3||tiles.length>4)return false;
 const numbered=tiles.filter(t=>t.rank!=='joker');
 if(numbered.some(t=>!Number.isInteger(t.rank)||Number(t.rank)<1||Number(t.rank)>13))return false;
 return new Set(numbered.map(t=>t.rank)).size<=1&&new Set(numbered.map(t=>t.color)).size===numbered.length;
}
export function isProcession(tiles:readonly Pick<Soul,'rank'|'color'>[]):boolean{
 if(tiles.length<3||tiles.length>13)return false;
 const numbered=tiles.filter(t=>t.rank!=='joker');
 if(new Set(numbered.map(t=>t.color)).size>1)return false;
 for(let start=1;start+tiles.length-1<=13;start++)if(tiles.every((t,i)=>t.rank==='joker'||t.rank===start+i))return true;
 return false;
}

// Find additions without changing the existing left-to-right tile order.
function embed(existing:readonly Soul[],target:SoulSpec[],e=0,t=0,missing:SoulSpec[]=[]):SoulSpec[]|null{
 if(e===existing.length)return [...missing,...target.slice(t)];
 if(t===target.length||target.length-t<existing.length-e)return null;
 const tile=existing[e],slot=target[t];
 if(tile.rank==='joker'||(tile.rank===slot.rank&&tile.color===slot.color)){
  const consumed=embed(existing,target,e+1,t+1,missing);if(consumed)return consumed;
 }
 return embed(existing,target,e,t+1,[...missing,slot]);
}
export function analyzeFormation(tiles:readonly Soul[]):Formation{
 if(isChoir(tiles))return {legal:true,kind:'choir',repairs:[]};
 if(isProcession(tiles))return {legal:true,kind:'procession',repairs:[]};
 const repairs:Repair[]=[];let best=Infinity;
 function offer(repair:Repair){const count=repair.additions.length;if(!count)return;if(count<best){repairs.length=0;best=count;}if(count===best&&!repairs.some(r=>r.kind===repair.kind&&JSON.stringify(r.additions)===JSON.stringify(repair.additions)))repairs.push(repair);}
 const numbered=tiles.filter(t=>t.rank!=='joker');
 if(tiles.length>0&&tiles.length<3&&new Set(numbered.map(t=>t.rank)).size<=1&&new Set(numbered.map(t=>t.color)).size===numbered.length){
  const rank=Number(numbered[0]?.rank??7),used=new Set(numbered.map(t=>t.color)),needed=3-tiles.length;
  const available=suits.filter(color=>!used.has(color));
  for(let mask=1;mask<(1<<available.length);mask++){
   const added=available.filter((_,i)=>mask&(1<<i));if(added.length!==needed)continue;
   const additions=added.map(color=>({rank,color}));
   const remaining=available.filter(color=>!added.includes(color));let joker=0;
   const existing=tiles.map(t=>({rank,color:t.rank==='joker'?remaining[joker++]:t.color}));
   offer({kind:'choir',additions,completed:[...existing,...additions]});
  }
 }
 if(tiles.length>0&&tiles.length<=13&&new Set(numbered.map(t=>t.color)).size<=1){
  const colors=numbered.length?[numbered[0].color]:[...suits];
  for(let length=Math.max(3,tiles.length);length<=13&&length-tiles.length<=best;length++)for(const color of colors)for(let start=1;start+length-1<=13;start++){
   const completed=Array.from({length},(_,i)=>({rank:start+i,color}));const additions=embed(tiles,completed);
   if(additions)offer({kind:'procession',additions,completed});
  }
 }
 // Prefer one suggestion of each kind when a singleton can become either.
 const choices:Repair[]=[];
 for(const kind of ['procession','choir'] as const){const option=repairs.find(r=>r.kind===kind);if(option)choices.push(option);}
 for(const r of repairs)if(choices.length<2&&!choices.includes(r))choices.push(r);
 return {legal:false,kind:'unformed',repairs:choices.slice(0,2)};
}
export function splitTiles(tiles:readonly Soul[],index:number):[Soul[],Soul[]]|null{
 if(index<=0||index>=tiles.length)return null;return [tiles.slice(0,index),tiles.slice(index)];
}
export function insertTiles(target:readonly Soul[],moving:readonly Soul[],index:number):Soul[]{
 const at=Math.max(0,Math.min(index,target.length));return [...target.slice(0,at),...moving,...target.slice(at)];
}

// Reserve first-copy 7s, green 9–11, and blue 9 for the separate special areas.
// The remaining 96 numbered tiles and both jokers form a legal initial pool.
export function initialPool():Soul[][]{
 const tile=(color:Suit,copy:string,rank:number):Soul=>({id:`${color}-${copy}-${rank}`,color,rank});
 const run=(color:Suit,copy:string,first:number,last:number)=>Array.from({length:last-first+1},(_,i)=>tile(color,copy,first+i));
 return [
  ...suits.map(color=>run(color,'b',1,13)),
  [...run('black','a',1,6),{id:'joker-1',rank:'joker',color:'black'} as Soul],run('red','a',1,6),run('blue','a',1,6),run('green','a',1,6),
  run('black','a',9,13),run('red','a',9,13),run('blue','a',10,13),[{id:'joker-2',rank:'joker',color:'green'} as Soul,...run('green','a',12,13)],
  suits.map(color=>tile(color,'a',8))
 ];
}
function chunks(tiles:Soul[],max:number):Soul[][]{
 if(tiles.length<=max)return [tiles];
 const count=Math.ceil(tiles.length/max),base=Math.floor(tiles.length/count),extra=tiles.length%count;let offset=0;
 return Array.from({length:count},(_,i)=>{const size=base+(i<extra?1:0),part=tiles.slice(offset,offset+size);offset+=size;return part;});
}
export function fitInitialGroups(width:number,height:number,tileSize:number):TileGroup[]{
 const gap=3,step=tileSize+gap,padding=18,groupGap=25,rowHeight=tileSize*1.43+44,max=Math.max(3,Math.floor((width-padding*2)/step));
 const pool=initialPool().map(tiles=>chunks(tiles,max)),ordered:Soul[][]=[];
 for(let chunk=0;pool.some(parts=>parts.length>chunk);chunk++)for(const parts of pool)if(parts[chunk])ordered.push(parts[chunk]);
 const rows:{x:number;y:number}[]=[{x:padding,y:padding}],groups:TileGroup[]=[];
 for(const tiles of ordered){
  const w=tiles.length*step-gap;let row=rows.find(r=>r.x+w<=width-padding-(r.y===padding?76:0));
  if(!row){const y=padding+rows.length*rowHeight;if(y+tileSize*1.43+28>height-padding)continue;row={x:padding,y};rows.push(row);}
  if(row.x+w>width-padding-(row.y===padding?76:0))continue;
  groups.push({id:`group-${groups.length+1}`,x:row.x,y:row.y,tiles});row.x+=w+groupGap;
 }
 return groups;
}
export interface Rect {x:number;y:number;width:number;height:number}
export function overlaps(a:Rect,b:Rect,padding=0):boolean{return a.x<b.x+b.width+padding&&a.x+a.width+padding>b.x&&a.y<b.y+b.height+padding&&a.y+a.height+padding>b.y;}
