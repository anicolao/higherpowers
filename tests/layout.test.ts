import {test,expect} from 'bun:test';
import {tidyGroups,nearestSpace} from '../src/lib/tabletop/layout';
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
 expect(output[0]).toEqual(input[0]);expect(output[1].y).toBe(125);
 for(let i=0;i<output.length;i++)for(let j=i+1;j<output.length;j++)expect(overlaps(groupRect(output[i],47,63),groupRect(output[j],47,63),10)).toBe(false);
});
test('nearest clear placement keeps its anchor when free and uses the closest gap when blocked',()=>{
 const size={width:138,height:63};expect(nearestSpace(size,[],{x:18,y:18},900)).toMatchObject({x:18,y:18});
 const placed=nearestSpace(size,[{x:18,y:18,...size}],{x:18,y:18},900);
 expect(placed).toMatchObject({x:18,y:93});
});
