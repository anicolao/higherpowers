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
