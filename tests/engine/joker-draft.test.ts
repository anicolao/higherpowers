import {test,expect} from 'bun:test';
import {jokerFacesFor,type TileGroup} from '../../src/lib/tabletop/rearrangement';
import {normalizeDraftGroup} from '../../src/lib/engine/draft';
import {formation} from '../../src/lib/engine/formations';
import {applyEvent,commandEvent,tryCommand,souls,type State,type Command} from '../../src/lib/engine/engine';
const pool=souls(),joker=pool['joker-1'];
const view=(ids:string[],faces:TileGroup['jokerFaces']):TileGroup=>({id:'test',x:20,y:20,tiles:ids.map(id=>pool[id]),jokerFaces:faces});
test('split declarations stay only with their physical joker',()=>{
 const faces={'joker-1':{rank:4,color:'black' as const}},left=['black-a-1','black-a-2','black-a-3'],right=['joker-1','black-a-5','black-a-6'];
 expect(jokerFacesFor(left.map(id=>pool[id]),faces)).toBeUndefined();expect(jokerFacesFor(right.map(id=>pool[id]),faces)).toEqual(faces);
});
test('repair a legacy split group without moving, adding or removing any soul',()=>{
 const bad=view(['black-a-1','black-a-2','black-a-3'],{'joker-1':{rank:4,color:'black'}}),fixed=normalizeDraftGroup(bad);
 expect(fixed.jokerFaces).toBeUndefined();expect(fixed.tiles).toEqual(bad.tiles);expect([fixed.x,fixed.y,fixed.id]).toEqual([20,20,'test']);expect(bad.jokerFaces).toBeDefined();
});
test('returning a joker to its original group clears orphan declarations elsewhere',()=>{
 const groups=[view(['black-a-1','black-a-2','joker-1'],{'joker-1':{rank:3,color:'black'}}),{...view(['red-a-4','red-a-5','red-a-6'],{'joker-1':{rank:3,color:'black'}}),id:'other',x:300}],fixed=groups.map(g=>normalizeDraftGroup(g));
 expect(fixed[0].jokerFaces).toEqual({'joker-1':{rank:3,color:'black'}});expect(fixed[1].jokerFaces).toBeUndefined();expect(fixed.flatMap(g=>g.tiles.map(t=>t.id))).toEqual(groups.flatMap(g=>g.tiles.map(t=>t.id)));
});
test('a new legal formation can assign a new joker identity; valid existing choices survive',()=>{
 const fixed=normalizeDraftGroup(view(['black-a-8','black-a-9','joker-1'],{'joker-1':{rank:3,color:'black'}}));expect(fixed.jokerFaces?.['joker-1']).toEqual({rank:10,color:'black'});expect(formation(fixed.tiles,0,fixed.jokerFaces)).toBe('procession');
 const choir=view(['black-a-7','red-a-7','joker-1'],{'joker-1':{rank:7,color:'green'}});expect(normalizeDraftGroup(choir).jokerFaces).toEqual(choir.jokerFaces);
});
test('all decree variants use the active rules when repairing a joker',()=>{
 const g=view(['black-a-1','joker-1','black-a-5'],{'joker-1':{rank:2,color:'black'}}),fixed=normalizeDraftGroup(g,1);expect(fixed.jokerFaces?.['joker-1']).toEqual({rank:3,color:'black'});expect(formation(fixed.tiles,1,fixed.jokerFaces)).toBe('procession');
});
test('normalization does not disguise an illegal layout',()=>{
 const g=view(['black-a-1','black-a-8','joker-1'],{'joker-1':{rank:2,color:'black'}});expect(formation(normalizeDraftGroup(g).tiles,0,normalizeDraftGroup(g).jokerFaces)).toBeNull();
});
test('a legal draft blocked by orphan metadata becomes committable after normalization',()=>{
 let s:State|null=null;const act=(actor:string,c:Command)=>{s=applyEvent(s,commandEvent(s,actor,c,crypto.randomUUID()));};act('a',{type:'create',name:'A',seed:'joker-repair'});act('b',{type:'join',name:'B'});act('c',{type:'join',name:'C'});act('a',{type:'start'});for(const p of s!.players)act(p.id,{type:'angel',angel:p.options[0]});const state=s!;state.phase='play';state.turn=0;state.decrees=[0];state.players[0].opened=true;state.players[0].hand=['red-a-1'];state.players[1].hand=['green-b-12'];state.players[2].hand=['green-b-13'];
 state.heaven=[{id:'joker-group',x:20,y:20,zone:null,tiles:['black-a-1','black-a-2','joker-1'],jokerFaces:{'joker-1':{rank:3,color:'black'}}},{id:'red-group',x:300,y:20,zone:null,tiles:['red-a-2','red-a-3','red-a-4']}];
 const used=new Set([...state.players.flatMap(p=>p.hand),...state.heaven.flatMap(g=>g.tiles)]);state.bag=Object.keys(pool).filter(id=>!used.has(id));
 const groups=state.heaven.map(g=>({...g,tiles:g.id==='red-group'?['red-a-1',...g.tiles]:g.tiles,jokerFaces:{'joker-1':{rank:3,color:'black' as const}}}));const command:Command={type:'organize',groups,turn:state.turnNumber};expect(tryCommand(state,'a',command)).toBe('Invalid joker face.');
 const repaired=groups.map(g=>{const fixed=normalizeDraftGroup({...g,tiles:g.tiles.map(id=>pool[id])});return {...g,jokerFaces:fixed.jokerFaces};});expect(tryCommand(state,'a',{...command,groups:repaired})).toBeNull();
});
