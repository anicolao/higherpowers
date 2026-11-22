import {formation} from '../src/lib/engine/formations';
import {describe,test,expect} from 'bun:test';
import {canonicalGroup,findVerticalSnap,alignedStack,transposeStack,geometry,groupRect,type Metrics} from '../src/lib/tabletop/magnetism';
import {analyzeFormation,overlaps,type Soul,type Suit,type TileGroup} from '../src/lib/tabletop/rearrangement';
const metrics:Metrics={step:47,tileHeight:62.92,rowPitch:76.92};
function procession(id:string,color:Suit,ranks:(number|'joker')[],x=200,y=100):TileGroup{return {id,x,y,tiles:ranks.map((rank,i)=>({id:`${id}-${i}`,rank,color}))};}
function choir(id:string,rank:number,colors:Suit[],x=200,y=100):TileGroup{return {id,x,y,tiles:colors.map((color,i)=>({id:`${id}-${i}`,rank,color}))};}
let serial=0;const makeId=()=>`transposed-${serial++}`;
function ids(groups:TileGroup[]){return groups.flatMap(g=>g.tiles.map(t=>t.id)).sort();}
describe('Semantic north/south magnets',()=>{
 test('Processions align shared rank positions above and below, not their left edges',()=>{
  const target=procession('a','black',[3,4,5]),moving=procession('b','red',[4,5,6],251,183);
  const snap=findVerticalSnap([target,moving],'b',metrics,1200,700)!;expect(snap).not.toBeNull();expect(snap.moving.x).toBe(247);expect(snap.moving.y).toBeCloseTo(176.92);expect(snap.direction).toBe('south');
  const north={...moving,y:29};const above=findVerticalSnap([target,north],'b',metrics,1200,700)!;expect(above.moving.y).toBeCloseTo(23.08);expect(above.direction).toBe('north');
 });
 test('No common rank and occupied destination do not attract',()=>{
  const a=procession('a','black',[1,2,3]),b=procession('b','red',[4,5,6],200,180);expect(findVerticalSnap([a,b],'b',metrics,1200,700)).toBeNull();
  const matching=procession('b','red',[1,2,3],200,180),blocker=procession('c','green',[8,9,10],200,176.92);expect(findVerticalSnap([a,matching,blocker],'b',metrics,1200,700)).toBeNull();
 });
 test('Choirs align by standard suit with a visible gap for a missing internal suit',()=>{
  const a=choir('a',4,['black','red','blue','green']),b=choir('b',5,['green','black','blue'],204,182),snap=findVerticalSnap([a,b],'b',metrics,1200,700)!;
  expect(snap).not.toBeNull();expect(snap.kind).toBe('choir');expect(snap.moving.tiles.map(t=>t.color)).toEqual(['black','blue','green']);expect(snap.moving.slots).toEqual([0,2,3]);expect(snap.moving.x).toBe(200);
 });
 test('Stack discovery is transitive, orientation-specific and position-based',()=>{
  const groups=[procession('a','black',[3,4,5]),procession('b','red',[4,5,6],247,176.92),procession('c','blue',[4,5,6],247,253.84),choir('d',7,['black','red','blue'],247,330.76)];
  expect(alignedStack(groups,'a',metrics).map(g=>g.id)).toEqual(['a','b','c']);
 });
});
describe('Transpose into complementary formations',()=>{
 test('Three Processions become Choirs and preserve every physical soul',()=>{
  const stack=[procession('a','black',[4,5,6]),procession('b','red',[4,5,6],200,176.92),procession('c','blue',[4,5,6],200,253.84)],output=transposeStack(stack,metrics,1200,[],makeId);
  expect(output).toHaveLength(3);expect(output.every(g=>analyzeFormation(g.tiles).kind==='choir')).toBe(true);expect(ids(output)).toEqual(ids(stack));expect(stack[0].tiles.map(t=>t.rank)).toEqual([4,5,6]);
  const back=transposeStack(output,metrics,1200,[],makeId);expect(back).toHaveLength(3);expect(back.every(g=>analyzeFormation(g.tiles).kind==='procession')).toBe(true);expect(ids(back)).toEqual(ids(stack));
 });
 test('Unequal Procession lengths retain partial columns as disconnected pieces',()=>{
  const stack=[procession('a','black',[3,4,5]),procession('b','red',[4,5,6],247,176.92),procession('c','blue',[4,5,6],247,253.84)],out=transposeStack(stack,metrics,1200,[],makeId);
  expect(out.map(g=>g.tiles.length)).toEqual([1,3,3,2]);expect(out.map(g=>analyzeFormation(g.tiles).legal)).toEqual([false,true,true,false]);expect(ids(out)).toEqual(ids(stack));
 });
 test('Duplicate suits form the largest possible complete Choirs, with leftovers retained',()=>{
  const stack=['black','black','red','red','blue','green'].map((color,i)=>procession(`p${i}`,color as Suit,[3,4,5],200,100+i*metrics.rowPitch));const out=transposeStack(stack,metrics,1200,[],makeId);
  expect(out).toHaveLength(6);expect(out.every(g=>g.tiles.length===3&&analyzeFormation(g.tiles).kind==='choir')).toBe(true);expect(ids(out)).toEqual(ids(stack));
 });
 test('Choirs become sorted consecutive Processions even if row order differs',()=>{
  const stack=[choir('a',6,['green','red','blue']),choir('b',4,['blue','red','green'],200,176.92),choir('c',5,['red','green','blue'],200,253.84)],out=transposeStack(stack,metrics,1200,[],makeId);
  expect(out).toHaveLength(3);expect(out.every(g=>g.tiles.map(t=>t.rank).join(',')==='4,5,6')).toBe(true);expect(out.every(g=>analyzeFormation(g.tiles).kind==='procession')).toBe(true);expect(ids(out)).toEqual(ids(stack));
 });
 test('Rank gaps are split, never filled with invented souls',()=>{
  const stack=[choir('a',4,['black','red','blue']),choir('b',6,['black','red','blue']),choir('c',7,['black','red','blue'])],out=transposeStack(stack,metrics,1200,[],makeId);
  expect(out).toHaveLength(6);expect(out.filter(g=>g.tiles.length===1)).toHaveLength(3);expect(out.filter(g=>g.tiles.length===2)).toHaveLength(3);expect(ids(out)).toEqual(ids(stack));
 });
 test('Joker identities used for the transformation are preserved through sparse columns',()=>{
  const stack=[procession('a','black',[3,'joker',5]),procession('b','red',[3,4,5],200,176.92),procession('c','blue',[3,4,5],200,253.84)],out=transposeStack(stack,metrics,1200,[],makeId);
  expect(out.every(g=>analyzeFormation(g.tiles).legal)).toBe(true);expect(ids(out)).toEqual(ids(stack));const wild=out.find(g=>g.tiles.some(t=>t.rank==='joker'))!;expect(geometry(wild)!.cells.find(c=>c.tile.rank==='joker')?.rank).toBe(4);
 });
 test('A lone joker column retains its inferred face across a partial round trip',()=>{
  const stack=[procession('a','black',['joker',4,5]),procession('b','red',[4,5,6],247,176.92)],out=transposeStack(stack,metrics,1200,[],makeId),wild=out.find(g=>g.tiles.length===1&&g.tiles[0].rank==='joker')!;
  expect(geometry(wild)!.cells[0].rank).toBe(3);const back=transposeStack(out,metrics,1200,[],makeId);expect(back).toHaveLength(2);expect(back.every(g=>analyzeFormation(g.tiles).legal)).toBe(true);expect(ids(back)).toEqual(ids(stack));
 });
 test('Output is placed clear of unrelated groups and grows downward if needed',()=>{
  const stack=[procession('a','black',[4,5,6]),procession('b','red',[4,5,6],200,176.92)],other=[procession('blocked','green',[1,2,3,4,5],200,253.84)],out=transposeStack(stack,metrics,1200,other,makeId);
  expect(out.every(g=>other.every(o=>!overlaps(groupRect(g,47,62.92),groupRect(o,47,62.92),8)))).toBe(true);expect(ids(out)).toEqual(ids(stack));
 });
});

describe('Active-decree magnets',()=>{
 const classify=(decree:number)=>(g:TileGroup)=>{const kind=formation(g.tiles,decree,g.jokerFaces);return kind==='poker'?'other' as const:kind;};
 test('Candy Cane Processions align ranks while retaining alternating suits',()=>{const a=procession('a','black',[1,2,3],200,150),b=procession('b','red',[2,3,4],251,233);a.tiles[1].color='red';b.tiles[1].color='black';const active={...metrics,classify:classify(4)},snap=findVerticalSnap([a,b],'b',active,1200,700)!;expect(snap?.kind).toBe('procession');expect(snap.moving.x).toBe(247);expect(snap.moving.tiles.map(t=>t.color)).toEqual(['red','black','red']);});
 test('repeated-colour Choirs keep separate physical copies',()=>{const a=choir('a',4,['black','black','red'],200,150),b=choir('b',5,['black','red','red'],204,233),snap=findVerticalSnap([a,b],'b',{...metrics,classify:classify(2)},1200,700)!;expect(snap?.kind).toBe('choir');expect(new Set(snap.moving.slots).size).toBe(3);expect(ids([snap.moving])).toEqual(ids([b]));});
 test('Mirror Choirs are treated as Choirs, with their two different ranks preserved',()=>{const a=procession('a','red',[1,13],200,150),b=procession('b','red',[2,12],204,233),snap=findVerticalSnap([a,b],'b',{...metrics,classify:classify(10)},1200,700)!;expect(snap?.kind).toBe('choir');expect(snap.moving.tiles.map(t=>t.rank)).toEqual([2,12]);});
 test('Eternal Circle Processions align across 13 to 1 without reordering their souls',()=>{const a=procession('a','black',[12,13,1],200,150),b=procession('b','red',[13,1,2],251,233),snap=findVerticalSnap([a,b],'b',{...metrics,classify:classify(5)},1200,700)!;expect(snap?.kind).toBe('procession');expect(snap.moving.x).toBe(247);expect(snap.moving.tiles.map(t=>t.rank)).toEqual([13,1,2]);});
 test('Poker formations do not masquerade as Choirs',()=>{const a=procession('a','black',[2,2,5,5],200,150);expect(geometry(a,undefined,classify(6))).toBeNull();});
});
