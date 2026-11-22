import {test,expect} from 'bun:test';
import {sortRack} from '../src/lib/tabletop/rack';
import type {Soul} from '../src/lib/tabletop/rearrangement';
const hand:Soul[]=[{id:'blue7',color:'blue',rank:7},{id:'red2',color:'red',rank:2},{id:'black7a',color:'black',rank:7},{id:'green1',color:'green',rank:1},{id:'black2',color:'black',rank:2},{id:'joker',color:'black',rank:'joker'},{id:'black7b',color:'black',rank:7}];
test('number and four-colour rack sorts preserve copies, leave jokers last and do not mutate the rack',()=>{const before=JSON.stringify(hand);expect(sortRack(hand,'number').map(t=>t.id)).toEqual(['green1','black2','red2','black7a','black7b','blue7','joker']);expect(sortRack(hand,'colour').map(t=>t.id)).toEqual(['black2','black7a','black7b','red2','blue7','green1','joker']);expect(JSON.stringify(hand)).toBe(before);});
test('Scales commitments remain in a separate sorted section',()=>{expect(sortRack(hand,'number',['blue7','green1']).map(t=>t.id)).toEqual(['black2','red2','black7a','black7b','joker','green1','blue7']);});
