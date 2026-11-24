import {suits,type Soul} from './rearrangement';
export type RackSort='number'|'colour';
/** Keep set-aside Scales souls together and unranked jokers last in each section. */
export function sortRack(tiles:readonly Soul[],mode:RackSort,committed:readonly string[]=[]):Soul[]{
 const setAside=new Set(committed);
 return [...tiles].sort((a,b)=>{
  const section=Number(setAside.has(a.id))-Number(setAside.has(b.id));if(section)return section;
  if(a.rank==='joker'||b.rank==='joker')return Number(a.rank==='joker')-Number(b.rank==='joker');
  const number=a.rank-b.rank,colour=suits.indexOf(a.color)-suits.indexOf(b.color);
  return mode==='number'?number||colour:colour||number;
 });
}

/** Largest tile size that fits a wrapped rack, including gaps and Scales markers. */
export function fittedRackSize(tiles:readonly Soul[],width:number,height:number,maximum:number,committed:readonly string[]=[]){
 const aside=new Set(committed);
 function fits(size:number){let x=0,y=0,rowHeight=0;for(const tile of tiles){const w=size+(aside.has(tile.id)?8:0),h=size*1.43+(aside.has(tile.id)?3:0);if(x>0&&x+3+w>width){y+=rowHeight+3;x=0;rowHeight=0;}if(w>width)return false;x+=(x?3:0)+w;rowHeight=Math.max(rowHeight,h);}return y+rowHeight<=height;}
 let lo=1,hi=maximum;for(let i=0;i<16;i++){const mid=(lo+hi)/2;if(fits(mid))lo=mid;else hi=mid;}return Math.floor(lo*100)/100;
}
