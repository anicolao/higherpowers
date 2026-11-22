import {geometry,groupRect,type Metrics} from './magnetism';
import {overlaps,type TileGroup,type Rect} from './rearrangement';

/** Slide along each axis without crossing another group. Protected groups are obstacles. */
export function tidyGroups(groups:readonly TileGroup[],metrics:Metrics,width:number,editable:(g:TileGroup)=>boolean=()=>true):TileGroup[]{
 const result=groups.map(g=>({...g})),gap=12,edge=8;
 const box=(g:TileGroup)=>groupRect(g,metrics.step,metrics.tileHeight);
 for(const g of [...result].sort((a,b)=>a.y-b.y||a.x-b.x)){
  if(!editable(g))continue;const r=box(g);
  const above=result.filter(o=>o.id!==g.id).map(box).filter(o=>o.x<r.x+r.width+gap&&o.x+o.width+gap>r.x&&o.y+o.height<=r.y);
  g.y=Math.min(g.y,Math.max(edge,...above.map(o=>o.y+o.height+gap)));
 }
 const horizontal=(g:TileGroup)=>{const r=box(g);return result.filter(o=>o.id!==g.id).map(box).filter(o=>o.y<r.y+r.height+gap&&o.y+o.height+gap>r.y);};
 const choirs=result.filter(g=>geometry(g,undefined,metrics.classify)?.kind==='choir');
 for(const g of [...result].filter(g=>!choirs.includes(g)).sort((a,b)=>a.x-b.x)){
  if(!editable(g))continue;const left=horizontal(g).filter(o=>o.x+o.width<=g.x);
  g.x=Math.min(g.x,Math.max(edge,...left.map(o=>o.x+o.width+gap)));
 }
 for(const g of choirs.sort((a,b)=>b.x-a.x)){
  if(!editable(g))continue;const r=box(g),right=horizontal(g).filter(o=>o.x>=r.x+r.width);
  g.x=Math.max(g.x,Math.min(width-r.width-edge,...right.map(o=>o.x-r.width-gap)));
 }
 return result;
}

/** Nearest clear position to an existing anchor, using obstacle edges as candidates. */
export function nearestSpace(size:Pick<Rect,'width'|'height'>,occupied:readonly Rect[],anchor:{x:number;y:number},width:number){
 const xs=[8,anchor.x,...occupied.flatMap(r=>[r.x,r.x+r.width+12,r.x-size.width-12])];
 const ys=[8,anchor.y,...occupied.flatMap(r=>[r.y,r.y+r.height+12,r.y-size.height-12])];
 const candidates=ys.flatMap(y=>xs.map(x=>({x,y,...size}))).filter(r=>r.x>=8&&r.y>=8&&r.x+r.width<=Math.max(width,size.width+16)-8&&!occupied.some(o=>overlaps(r,o,10)));
 candidates.sort((a,b)=>Math.hypot(a.x-anchor.x,a.y-anchor.y)-Math.hypot(b.x-anchor.x,b.y-anchor.y)||a.y-b.y||a.x-b.x);
 return candidates[0]??{x:8,y:Math.max(8,...occupied.map(r=>r.y+r.height+12)),...size};
}
