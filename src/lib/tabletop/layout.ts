import {geometry,groupRect,type Metrics} from './magnetism';
import {overlaps,type TileGroup,type Rect} from './rearrangement';

/** Include the painted Sanctuary frame, not just the numbered tile faces. */
export function formationRect(group:TileGroup,metrics:Pick<Metrics,'step'|'tileHeight'>):Rect{
 const r=groupRect(group,metrics.step,metrics.tileHeight);
 return group.zone?{x:r.x-12,y:r.y-15,width:r.width+24,height:r.height+25}:r;
}

/** Preserve clear anchors; move conflicts to the nearest free space. Fixed regions
 * and not-yet-processed anchors are reserved while finding a replacement. */
export function separateGroups(groups:readonly TileGroup[],metrics:Pick<Metrics,'step'|'tileHeight'>,width:number,editable:(g:TileGroup)=>boolean=()=>true,priority:(g:TileGroup)=>number=()=>0):TileGroup[]{
 const result=groups.map(g=>({...g})),fixed=result.filter(g=>!editable(g)),moving=result.filter(editable).sort((a,b)=>priority(a)-priority(b));
 const occupied=fixed.map(g=>formationRect(g,metrics));
 for(let i=0;i<moving.length;i++){
  const g=moving[i],r=formationRect(g,metrics),limit=Math.max(width,r.width+16);
  if(r.x<8||r.y<8||r.x+r.width>limit-8||occupied.some(o=>overlaps(r,o))){
   const reserved=[...occupied,...moving.slice(i+1).map(g=>formationRect(g,metrics))];
   const anchor={x:Math.max(8,Math.min(r.x,limit-r.width-8)),y:Math.max(8,r.y)};
   const at=nearestSpace({width:r.width,height:r.height},reserved,anchor,limit);g.x+=at.x-r.x;g.y+=at.y-r.y;
  }
  occupied.push(formationRect(g,metrics));
 }
 return result;
}

/** Slide along each axis without crossing another group. Protected groups are obstacles. */
export function tidyGroups(groups:readonly TileGroup[],metrics:Metrics,width:number,editable:(g:TileGroup)=>boolean=()=>true):TileGroup[]{
 const result=separateGroups(groups,metrics,width,editable),gap=12,edge=8;
 const box=(g:TileGroup)=>formationRect(g,metrics);
 for(const g of [...result].sort((a,b)=>a.y-b.y||a.x-b.x)){
  if(!editable(g))continue;const r=box(g);
  const above=result.filter(o=>o.id!==g.id).map(box).filter(o=>o.x<r.x+r.width+gap&&o.x+o.width+gap>r.x&&o.y+o.height<=r.y);
  g.y+=Math.min(r.y,Math.max(edge,...above.map(o=>o.y+o.height+gap)))-r.y;
 }
 const horizontal=(g:TileGroup)=>{const r=box(g);return result.filter(o=>o.id!==g.id).map(box).filter(o=>o.y<r.y+r.height+gap&&o.y+o.height+gap>r.y);};
 const choirs=result.filter(g=>geometry(g,undefined,metrics.classify)?.kind==='choir');
 for(const g of [...result].filter(g=>!choirs.includes(g)).sort((a,b)=>a.x-b.x)){
  if(!editable(g))continue;const r=box(g),left=horizontal(g).filter(o=>o.x+o.width<=r.x);
  g.x+=Math.min(r.x,Math.max(edge,...left.map(o=>o.x+o.width+gap)))-r.x;
 }
 for(const g of choirs.sort((a,b)=>b.x-a.x)){
  if(!editable(g))continue;const r=box(g),right=horizontal(g).filter(o=>o.x>=r.x+r.width);
  g.x+=Math.max(r.x,Math.min(width-r.width-edge,...right.map(o=>o.x-r.width-gap)))-r.x;
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
