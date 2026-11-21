import {describe,test,expect} from 'bun:test';
import {analyzeFormation,isChoir,isProcession,initialPool,fitInitialGroups,splitTiles,insertTiles,overlaps,type Soul,type Suit} from '../src/lib/tabletop/rearrangement';
function run(ranks:(number|'joker')[],color:Suit='blue'):Soul[]{return ranks.map((rank,i)=>({id:`${color}-${rank}-${i}`,rank,color}));}
function choir(rank:number,colors:Suit[]):Soul[]{return colors.map(color=>({id:`${color}-${rank}`,rank,color}));}
describe('Freeform Heaven: ordinary formation legality',()=>{
 test('Choirs require three or four distinct suits of one rank',()=>{
  expect(isChoir(choir(7,['black','red','blue']))).toBe(true);expect(isChoir(choir(7,['black','red','blue','green']))).toBe(true);
  expect(isChoir(choir(7,['black','red']))).toBe(false);expect(isChoir(choir(7,['black','red','black']))).toBe(false);expect(isChoir([...choir(7,['black','red']),...choir(8,['green'])])).toBe(false);
  expect(isChoir(choir(14,['black','red','blue']))).toBe(false);
 });
 test('Processions must ascend consecutively without wrapping in a single suit',()=>{
  expect(isProcession(run([1,2,3]))).toBe(true);expect(isProcession(run([11,12,13]))).toBe(true);
  for(const ranks of [[1,2],[1,3,4],[3,2,1],[12,13,1],[3,3,4]])expect(isProcession(run(ranks))).toBe(false);
  expect(isProcession([...run([1,2]),...run([3],'red')])).toBe(false);
 });
 test('Jokers occupy real legal positions, including bounds and distinct Choir suits',()=>{
  expect(isProcession(run([3,'joker',5]))).toBe(true);expect(isProcession(run(['joker',12,13]))).toBe(true);expect(isProcession(run(['joker','joker',1]))).toBe(false);
  expect(isChoir([...choir(7,['black','red']),...run(['joker'])])).toBe(true);
  expect(isChoir([...choir(7,['black','black']),...run(['joker'])])).toBe(false);
 });
 test('A missing rank produces a genuine completion, rather than an extension that leaves the gap',()=>{
  const state=analyzeFormation(run([3,5]));expect(state.legal).toBe(false);expect(state.repairs).toHaveLength(1);expect(state.repairs[0].additions).toEqual([{rank:4,color:'blue'}]);
 });
 test('A two-soul Choir offers the missing suits as alternatives',()=>{
  const state=analyzeFormation(choir(7,['black','red']));expect(state.repairs).toHaveLength(2);
  expect(state.repairs.map(r=>r.additions[0].color).sort()).toEqual(['blue','green']);
 });
 test('All offered completions are legal, including singletons and joker groups',()=>{
  for(const tiles of [run([7]),run([2,4]),run([1,13]),run(['joker']),run(['joker','joker']),choir(7,['black','red']),[...run(['joker']),...choir(7,['red'])]]){
   const state=analyzeFormation(tiles);expect(state.repairs.length).toBeGreaterThan(0);
   for(const repair of state.repairs){expect(isChoir(repair.completed)||isProcession(repair.completed)).toBe(true);expect(repair.completed.length).toBe(tiles.length+repair.additions.length);}
  }
 });
 test('Duplicates, descending runs and incompatible colors/ranks cannot be fixed by additions alone',()=>{
  for(const tiles of [run([4,4]),run([4,3,2]),[...run([3],'red'),...run([6],'blue')]])expect(analyzeFormation(tiles).repairs).toHaveLength(0);
 });
});
describe('Freeform Heaven: manipulation and comfortable initial layouts',()=>{
 test('A split starts with the tapped soul and preserves every physical tile',()=>{
  const tiles=run([1,2,3,4,5]),parts=splitTiles(tiles,2)!;expect(parts[0].map(t=>t.rank)).toEqual([1,2]);expect(parts[1].map(t=>t.rank)).toEqual([3,4,5]);
  expect(insertTiles(parts[0],parts[1],2)).toEqual(tiles);expect(tiles).toHaveLength(5);expect(splitTiles(tiles,0)).toBeNull();
  const tail=splitTiles(tiles,4)!;expect(tail[1]).toHaveLength(1);
 });
 test('Joining inserts a soul between others to repair a Procession',()=>{const tiles=insertTiles(run([3,5]),run([4]),1);expect(tiles.map(t=>t.rank)).toEqual([3,4,5]);expect(isProcession(tiles)).toBe(true);});
 test('The full pool has 98 unique souls, both jokers, and only legal formations',()=>{
  const pool=initialPool(),tiles=pool.flat();expect(tiles).toHaveLength(98);expect(new Set(tiles.map(t=>t.id)).size).toBe(98);expect(tiles.filter(t=>t.rank==='joker')).toHaveLength(2);expect(pool.every(g=>analyzeFormation(g).legal)).toBe(true);
 });
 for(const [width,height,size] of [[280,720,38],[350,720,38],[728,720,44],[1294,760,44]])test(`Layout fits ${width} × ${height} without overlaps, shrinking ranks, or illegal fragments`,()=>{
  const groups=fitInitialGroups(width,height,size),step=size+3,rects=groups.map(g=>({x:g.x,y:g.y,width:g.tiles.length*step-3,height:size*1.43}));
  expect(groups.length).toBeGreaterThan(0);expect(groups.every(g=>analyzeFormation(g.tiles).legal)).toBe(true);
  for(let i=0;i<groups.length;i++){const r=rects[i];expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(width);expect(r.y+r.height).toBeLessThanOrEqual(height);for(let j=0;j<i;j++)expect(overlaps(r,rects[j])).toBe(false);}
  expect(new Set(groups.flatMap(g=>g.tiles.map(t=>t.id))).size).toBe(groups.flatMap(g=>g.tiles).length);
 });
});
