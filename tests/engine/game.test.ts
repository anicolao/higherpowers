import {describe,test,expect} from 'bun:test';
import {applyEvent,commandEvent,replay,assertInventory,allowance,souls,type State,type Command,type GameEvent} from '../../src/lib/engine/engine';
import {formation} from '../../src/lib/engine/formations';
import {botCommand} from '../../src/lib/engine/bot';
import {acceptsDraft} from '../../src/lib/backend/live';
function table(seed='test',count=3){let s:State|null=null;const events:GameEvent[]=[];function act(actor:string,c:Command){const e=commandEvent(s,actor,c,String(events.length+1));s=applyEvent(s,e);events.push(e);return s;}act('a',{type:'create',name:'A',seed});for(let i=1;i<count;i++)act('a',{type:'bot',id:String.fromCharCode(97+i),name:`Player ${i}`});act('a',{type:'start'});for(const p of s!.players)act(p.id,{type:'angel',angel:p.options[0]});return {get state(){return s!;},events,act};}
const tiles=souls(),ts=(...ids:string[])=>ids.map(id=>tiles[id]);
describe('decrees',()=>{
 test('all ten formation changes and ordinary formations',()=>{
 expect(formation(ts('black-a-1','black-a-2','black-a-3'))).toBe('procession');
 expect(formation(ts('black-a-1','black-a-3','black-a-5'),1)).toBe('procession');
 expect(formation(ts('black-a-1','black-a-2','black-a-3'),1)).toBeNull();
 expect(formation(ts('black-a-3','black-b-3','red-a-3'),2)).toBe('choir');
 expect(formation(ts('black-a-1','green-a-2','blue-a-3'),3)).toBe('procession');
 expect(formation(ts('black-a-1','red-a-2','black-a-3'),4)).toBe('procession');
 expect(formation(ts('black-a-1','black-a-2','black-a-3'),4)).toBeNull();
 expect(formation(ts('black-a-12','black-a-13','black-a-1'),5)).toBe('procession');
 expect(formation(ts('black-a-2','black-b-2','red-a-5','blue-a-5'),6)).toBe('poker');
 expect(formation(ts('black-a-1','black-a-2','black-a-3'),7)).toBeNull();
 expect(formation(ts('black-a-1','black-a-3','black-a-4'),8)).toBe('procession');
 expect(formation(ts('red-a-1','blue-a-1'),9)).toBe('choir');
 expect(formation(ts('black-a-1','black-a-13'),10)).toBe('choir');
 expect(formation(ts('black-a-7','black-b-7'),10)).toBeNull();
 expect(formation(ts('black-a-1','joker-1','black-a-3'))).toBe('procession');
 });
});
test('deterministic complete three-round replay, 3–5 players',()=>{for(let n=3;n<=5;n++){const t=table(`play-${n}`,n);let moves=0;while(t.state.phase!=='ended'&&moves++<3500){const s=t.state;if(s.phase==='round-end'){t.act('a',{type:'next-round'});continue;}let acted=false;for(const p of s.players){const c=botCommand(s,p);if(c){t.act(p.id,c);acted=true;break;}}expect(acted).toBe(true);assertInventory(t.state);}expect(t.state.phase).toBe('ended');expect(replay(t.events)).toEqual(t.state);expect(t.state.players.every(p=>p.scores.length===3)).toBe(true);}});
test('ties give lower draw allowance and invalid logs fail visibly',()=>{const t=table();t.state.players.forEach(p=>p.favor=0);expect(allowance(t.state,'a')).toBe(1);t.state.players[0].favor=5;t.state.players[1].favor=5;expect(allowance(t.state,'a')).toBe(2);expect(()=>replay(t.events.slice(1))).toThrow();expect(()=>replay([...t.events,t.events.at(-1)!])).toThrow();});
test('rack order preserves identity and rejects other turns and invented tiles',()=>{const t=table(),s=t.state,p=s.players[s.turn];expect(()=>t.act(p.id,{type:'rack',tiles:[]})).toThrow();t.act(p.id,{type:'rack',tiles:[...p.hand].reverse()});expect(()=>t.act(p.id,{type:'draw',turn:0})).toThrow();expect(()=>t.act(s.players[(s.turn+1)%3].id,{type:'draw',turn:s.turnNumber})).toThrow();});
test('live drafts expire and cannot cross revisions, turns, or actors',()=>{const s=table().state,d={version:1 as const,revision:s.revision,turn:s.turnNumber,actor:s.players[s.turn].id,session:'one',sequence:1,sentAt:1000,groups:[],purgatory:null,dragging:true};expect(acceptsDraft(s,d,1001)).toBe(true);expect(acceptsDraft(s,d,47000)).toBe(false);expect(acceptsDraft(s,{...d,revision:d.revision-1},1001)).toBe(false);expect(acceptsDraft(s,{...d,actor:'intruder'},1001)).toBe(false);});
