import {test,expect} from 'bun:test';
import {applyEvent,commandEvent,assertInventory,type State,type Command,type Group,type Angel} from '../../src/lib/engine/engine';
import {sanctuaryFrame} from '../../src/lib/engine/sanctuary';
let serial=0;
const g=(tiles:string[],id:string,zone:string|null=null):Group=>({id,x:18,y:18,tiles,zone});
const run=(from:number,to:number)=>Array.from({length:to-from+1},(_,i)=>`black-a-${from+i}`);
function fixture(angel:Angel='barachiel'){
 let s:State|null=null;const act=(actor:string,c:Command)=>s=applyEvent(s,commandEvent(s,actor,c,String(++serial)));
 act('a',{type:'create',name:'A',seed:'sanctuary-corrected'});act('a',{type:'bot',id:'b',name:'B'});act('a',{type:'start'});for(const p of s!.players)act(p.id,{type:'angel',angel:p.options[0]});
 const state=s!;state.phase='play';state.turn=0;state.turnNumber=7;state.round=1;state.decrees=[0,0];state.players[0].angel=angel;state.players[0].opened=true;state.players[0].hand=['red-a-1','red-a-2','red-a-3','blue-a-13'];state.players[1].hand=['green-b-13'];state.heaven=[];return state;
}
function inventory(s:State){const used=new Set([...s.heaven.flatMap(g=>g.tiles),...s.players.flatMap(p=>p.hand)]);s.bag=Object.keys(s.tiles).filter(id=>!used.has(id));assertInventory(s);}
const act=(s:State,c:Command)=>applyEvent(s,commandEvent(s,'a',c,String(++serial)));
const delivered=g(['red-a-1','red-a-2','red-a-3'],'delivery');
function active(s:State){s.players[0].used=true;s.players[0].sanctuary=true;}
test('creation protects exactly one formation for either Sanctuary, including newly completed formations',()=>{
 for(const angel of ['barachiel','selaphiel'] as const){const s=fixture(angel),a=angel==='barachiel'?run(1,3):['black-a-7','red-a-7','blue-a-7'],b=angel==='barachiel'?run(7,9):['black-a-8','red-a-8','blue-a-8'];s.heaven=[g(a,'one'),g(b,'two')];inventory(s);
  const c:Command={type:'organize',groups:[g(a,'one','a'),g(b,'two','a')],power:{kind:'sanctuary',group:'one'},turn:7};expect(()=>act(s,c)).toThrow('exactly one');
  const next=act(s,{...c,groups:[g(a,'one','a'),g(b,'two')]});expect(next.heaven.filter(g=>g.zone==='a')).toHaveLength(1);
  const legacy=commandEvent(s,'a',c,String(++serial));legacy.version=1;expect(applyEvent(s,legacy).players[0].sanctuary).toBe(true);
 }
 const s=fixture();s.players[0].hand.push(...run(1,3));inventory(s);expect(act(s,{type:'organize',groups:[g(run(1,3),'new','a')],power:{kind:'sanctuary',group:'new'},turn:7}).players[0].sanctuary).toBe(true);
});
test('an active Sanctuary rejects importing an independent formation from Heaven or the rack',()=>{
 for(const fromRack of [false,true]){const s=fixture();active(s);s.heaven=[g(run(1,3),'safe','a')];if(fromRack)s.players[0].hand.push(...run(8,10));else s.heaven.push(g(run(8,10),'new'));inventory(s);
  expect(()=>act(s,{type:'organize',groups:[...s.heaven.filter(g=>g.id!=='new'),g(run(8,10),'new','a'),delivered],turn:7})).toThrow('entirely new');
 }
});
test('protected formations can split into several and can accept extensions',()=>{
 const s=fixture();active(s);s.heaven=[g(run(1,6),'safe','a')];s.players[0].hand.push('black-a-7');inventory(s);
 const next=act(s,{type:'organize',groups:[g(run(1,3),'left','a'),g(run(4,7),'right','a'),delivered],turn:7});expect(next.heaven.filter(g=>g.zone==='a')).toHaveLength(2);expect(next.players[0].sanctuary).toBe(true);
});
test('a witnessed extension may split off entirely new tiles, without permanent original-tile tracking',()=>{
 const s=fixture();active(s);s.heaven=[g(run(1,3),'safe','a')];s.players[0].hand.push(...run(4,6));inventory(s);
 const groups=[g(run(1,3),'left','a'),g(run(4,6),'right','a'),delivered],c:Command={type:'organize',groups,turn:7};expect(()=>act(s,c)).toThrow('entirely new');
 const sanctuary=[sanctuaryFrame([g(run(1,6),'extended','a')],'a')];const next=act(s,{...c,sanctuary});expect(next.heaven.filter(g=>g.zone==='a')).toHaveLength(2);
 // The original tiles may all be released after the legal extension.
 const replaced=act(s,{...c,groups:[g(run(1,3),'released'),g(run(4,6),'right','a'),delivered],sanctuary});expect(replaced.heaven.filter(g=>g.zone==='a').flatMap(g=>g.tiles)).toEqual(run(4,6));
});
test('a witness cannot invent souls or borrow another player’s protected tiles',()=>{
 const s=fixture();active(s);s.heaven=[g(run(1,3),'safe','a'),g(run(4,6),'other','b')];s.players[1].sanctuary=true;inventory(s);
 const c:Command={type:'organize',groups:[...s.heaven,delivered],turn:7,sanctuary:[[run(1,6)]]};expect(()=>act(s,c)).toThrow('Unknown soul');expect(()=>act(s,{...c,sanctuary:[[run(1,7)]]})).toThrow('Unknown soul');
});
test('emptying Sanctuary at action end closes it; emptying temporarily is unnecessary in the witness',()=>{
 const s=fixture();active(s);s.heaven=[g(run(1,3),'safe','a')];inventory(s);const next=act(s,{type:'organize',groups:[g(run(1,3),'released'),delivered],turn:7});expect(next.players[0].sanctuary).toBe(false);
});
