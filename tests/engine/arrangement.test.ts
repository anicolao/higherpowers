import {test,expect} from 'bun:test';
import {arrangeDraftGroup,repairInsertion} from '../../src/lib/engine/arrangement';
import {formation} from '../../src/lib/engine/formations';
import {souls} from '../../src/lib/engine/engine';
import type {TileGroup,Repair} from '../../src/lib/tabletop/rearrangement';
const pool=souls();const group=(ids:string[]):TileGroup=>({id:'g',x:120,y:80,tiles:ids.map(id=>pool[id]),zone:'owner'});
test('complete out-of-order Processions sort without changing membership, ownership or position',()=>{for(const order of [[3,1,2],[3,2,1],[2,1,3],[2,3,1]]){const g=group(order.map(r=>`black-a-${r}`)),fixed=arrangeDraftGroup(g);expect(fixed.tiles.map(t=>t.rank)).toEqual([1,2,3]);expect([fixed.x,fixed.y,fixed.zone]).toEqual([120,80,'owner']);expect(g.tiles.map(t=>t.rank)).toEqual(order);}});
test('active decrees determine whether a reordering is a legal Procession',()=>{
 const examples:[number,string[]][]=[[1,['black-a-5','black-a-1','black-a-3']],[3,['red-a-3','black-a-1','green-a-2']],[4,['black-a-3','black-a-1','red-a-2']],[5,['black-a-1','black-a-13','black-a-2']],[7,['black-a-4','black-a-1','black-a-3','black-a-2']],[8,['black-a-6','black-a-1','black-a-3','black-a-5']]];
 for(const [decree,ids]of examples){const fixed=arrangeDraftGroup(group(ids),decree);expect(formation(fixed.tiles,decree,fixed.jokerFaces)).toBe('procession');expect(new Set(fixed.tiles.map(t=>t.id))).toEqual(new Set(ids));}
 const invalid=group(['black-a-1','red-a-2','green-a-3']);expect(arrangeDraftGroup(invalid).tiles).toEqual(invalid.tiles);
});
test('legal wrapping Processions and Choirs retain their order; jokers keep valid identities',()=>{
 for(const [decree,ids]of [[5,['black-a-13','black-a-1','black-a-2']],[0,['red-a-7','black-a-7','blue-a-7']]] as [number,string[]][]){const g=group(ids);expect(arrangeDraftGroup(g,decree).tiles).toEqual(g.tiles);}
 const fixed=arrangeDraftGroup({...group(['black-a-3','black-a-2','joker-1']),jokerFaces:{'joker-1':{rank:4,color:'black'}}});expect(fixed.tiles.map(t=>t.rank)).toEqual([2,3,'joker']);expect(fixed.jokerFaces?.['joker-1']).toEqual({rank:4,color:'black'});
});
test('low-end suggestions count existing tiles, not earlier missing additions',()=>{
 const repair:Repair={kind:'procession',completed:[3,4,5].map(rank=>({rank,color:'black'})),additions:[3,4].map(rank=>({rank,color:'black'}))};
 expect(repairInsertion(group(['black-a-5']).tiles,{rank:4,color:'black'},repair)).toBe(0);
 expect(repairInsertion(group(['black-a-4','black-a-5']).tiles,{rank:3,color:'black'},repair)).toBe(0);
 const full=[1,2,3,4].map(rank=>({rank,color:'black' as const}));expect(repairInsertion(group(['black-a-2','black-a-4']).tiles,{rank:3,color:'black'},{kind:'procession',completed:full,additions:[full[0],full[2]]})).toBe(1);
});
