import {test,expect} from 'bun:test';
import {tidyGroups,nearestSpace,separateGroups,formationRect} from '../src/lib/tabletop/layout';
import {groupRect} from '../src/lib/tabletop/magnetism';
import {overlaps,type TileGroup} from '../src/lib/tabletop/rearrangement';
const metrics={step:47,tileHeight:63,rowPitch:77};
const group=(id:string,x:number,y:number,kind:'procession'|'choir'='procession'):TileGroup=>({id,x,y,layoutKind:kind,tiles:[1,2,3].map((rank,i)=>({id:`${id}-${rank}`,rank:kind==='choir'?3:rank,color:kind==='choir'?(['black','red','blue'] as const)[i]:'black'}))});
test('tidy slides upward first, processions left, choirs right, preserving physical groups',()=>{
 const input=[group('p',170,200),group('c',500,350,'choir')],output=tidyGroups(input,metrics,900);
 expect(output.map(g=>[g.x,g.y])).toEqual([[8,8],[754,8]]);
 expect(output.map(g=>g.tiles)).toEqual(input.map(g=>g.tiles));expect(input[0].x).toBe(170);
});
test('tidy never crosses obstacles or moves protected sanctuaries',()=>{
 const input=[{...group('safe',170,50),zone:'opponent'},group('p',170,300),group('c',500,350,'choir')];
 const output=tidyGroups(input,metrics,900,g=>!g.zone);
 expect(output[0]).toEqual(input[0]);expect(output[1].y).toBe(135);
 for(let i=0;i<output.length;i++)for(let j=i+1;j<output.length;j++)expect(overlaps(groupRect(output[i],47,63),groupRect(output[j],47,63),10)).toBe(false);
});
test('nearest clear placement keeps its anchor when free and uses the closest gap when blocked',()=>{
 const size={width:138,height:63};expect(nearestSpace(size,[],{x:18,y:18},900)).toMatchObject({x:18,y:18});
 const placed=nearestSpace(size,[{x:18,y:18,...size}],{x:18,y:18},900);
 expect(placed).toMatchObject({x:18,y:93});
});

const assertClear=(groups:TileGroup[])=>{for(let i=0;i<groups.length;i++)for(let j=i+1;j<groups.length;j++)expect(overlaps(formationRect(groups[i],metrics),formationRect(groups[j],metrics)),`${groups[i].id}/${groups[j].id}`).toBe(false);};
test('Tidy repairs coincident, partially overlapping, and slotted sets before sliding',()=>{
 const input=[group('first',100,100),group('second',100,100),{...group('wide',160,110),slots:[0,3,8]},group('choir',100,100,'choir')];
 const before=structuredClone(input),output=tidyGroups(input,metrics,600);assertClear(output);expect(input).toEqual(before);expect(output.map(g=>g.tiles)).toEqual(input.map(g=>g.tiles));
});
test('clear placement reserves future anchors and includes Sanctuary frames',()=>{
 const input=[{...group('fixed',20,40),zone:'opponent'},group('growing',70,40),group('untouched',20,180)];
 const out=separateGroups(input,metrics,600,g=>g.zone!=='opponent',g=>g.id==='growing'?1:0);assertClear(out);expect(out[0]).toEqual(input[0]);expect(out[2]).toEqual(input[2]);
 expect(separateGroups(out,metrics,600,g=>g.zone!=='opponent')).toEqual(out);
 expect(separateGroups([group('edge',800,40)],metrics,600)[0]).toMatchObject({x:454,y:40});
});
test('dense deterministic layouts stay clear after placement and Tidy at narrow and wide widths',()=>{
 let seed=191;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
 for(let sample=0;sample<100;sample++){
  const width=sample%2?1000:320,input=Array.from({length:15},(_,i)=>({...group(`g${i}`,Math.round(random()*500),Math.round(random()*500),i%3?'procession':'choir'),...(i%4===0?{zone:'owner'}:{}),...(i%5===0?{slots:[0,3,7]}:{})}));
  const out=separateGroups(input,metrics,width);assertClear(out);assertClear(tidyGroups(input,metrics,width));expect(separateGroups(input,metrics,width)).toEqual(out);
 }
});
