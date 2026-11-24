import {test,expect} from 'bun:test';
import {applyEvent,commandEvent,souls,tryCommand,angelIds,type State,type Angel,type Command} from '../src/lib/engine/engine';
import {observe} from '../src/lib/engine/rl/observation';
import {choices,learnedCommand,initialWeights,type Model} from '../src/lib/engine/rl/policy';
import {melds} from '../src/lib/engine/rl/melds';
import {formation} from '../src/lib/engine/formations';
const model:Model={version:1,level:'standard',algorithm:'test',weights:initialWeights,powers:true,planning:2};
function fixture(angel:Angel):State{
 let s:State|null=null;const act=(actor:string,c:Command)=>s=applyEvent(s,commandEvent(s,actor,c,String((s?.revision??0)+1)));
 act('a',{type:'create',name:'A',seed:'rl-fixture'});act('a',{type:'bot',id:'b',name:'B'});act('a',{type:'start'});for(const p of s!.players)act(p.id,{type:'angel',angel:p.options[0]});
 const state=s!;state.phase='play';state.turn=0;state.round=1;state.decrees=[0,0];state.players[0].angel=angel;state.players[0].opened=true;state.players[0].hand=['red-a-1','red-a-2','red-a-3','blue-a-10'];state.players[1].hand=['green-b-13'];state.heaven=[{id:'run',x:10,y:10,zone:null,tiles:['black-a-4','black-a-5','black-a-6','black-a-7','black-a-8']}];rebalance(state);return state;
}
function rebalance(s:State){const used=new Set([...s.players.flatMap(p=>[...p.hand,...(p.purgatory?[p.purgatory]:[])]),...s.heaven.flatMap(g=>g.tiles)]);s.bag=Object.keys(s.tiles).filter(id=>!used.has(id));}
function gift(c:Command){return c.type==='before'||c.type==='communion'||c.type==='organize'&&!!c.power||c.type==='draw'&&c.foretell||c.type==='continue'&&c.zeal;}
test('every Angel has legal power candidates, including organizing powers and Zeal',()=>{
 for(const angel of angelIds){const s=fixture(angel);if(angel==='jegudiel')s.phase='after-turn';if(angel==='selaphiel')s.heaven.push({id:'choir',x:10,y:100,zone:null,tiles:['black-a-9','red-a-9','blue-a-9']});rebalance(s);const legal=choices(observe(s,'a'),model).filter(c=>gift(c.command)&&!tryCommand(s,'a',c.command));expect(legal.length,angel).toBeGreaterThan(0);}
});
test('policy features and choices are invariant under hidden hands, options, and bag order',()=>{
 const a=fixture('gabriel'),b=structuredClone(a);[b.players[1].hand[0],b.bag[0]]=[b.bag[0],b.players[1].hand[0]];b.bag.reverse();b.seed='inaccessible';b.players[1].options=['michael','uriel'];
 expect(observe(a,'a')).toEqual(observe(b,'a'));expect(choices(observe(a,'a'),model)).toEqual(choices(observe(b,'a'),model));expect(learnedCommand(a,'a',model)).toEqual(learnedCommand(b,'a',model));
});
test('Communion reveals only the selected hand and supplies a playable contribution',()=>{
 let s=fixture('chamuel');s.players[0].hand=['red-a-2','black-a-2','red-a-12'];s.players[1].hand=['blue-a-2','green-b-13'];rebalance(s);expect(observe(s,'a').communion).toEqual([]);
 s=applyEvent(s,commandEvent(s,'a',{type:'communion',target:'b',turn:s.turnNumber},'communion-test'));expect(observe(s,'a').communion).toEqual(s.players[1].hand);expect(observe(s,'b').communion).toEqual([]);
 expect(choices(observe(s,'a'),model).some(c=>c.command.type==='organize'&&c.command.communionTile==='blue-a-2'&&!tryCommand(s,'a',c.command))).toBe(true);
});
test('Purgatory rescue and compound openings remain legal',()=>{
 const s=fixture('raphael');s.players[0].purgatory='red-a-4';rebalance(s);expect(choices(observe(s,'a'),model).some(c=>c.command.type==='organize'&&c.command.groups.some(g=>g.tiles.includes('red-a-4'))&&!tryCommand(s,'a',c.command))).toBe(true);
 s.players[0].purgatory=null;s.players[0].opened=false;rebalance(s);const c=learnedCommand(s,'a',model)!;expect(c.type).toBe('organize');expect(tryCommand(s,'a',c)).toBeNull();
});
test('structured formation candidates support every decree and physical joker copies',()=>{
 const all=souls(),cases:[number,string[]][]=[[0,['black-a-1','black-a-2','black-a-3']],[1,['black-a-1','black-a-3','black-a-5']],[2,['black-a-3','black-b-3','red-a-3']],[3,['black-a-1','green-a-2','blue-a-3']],[4,['black-a-1','red-a-2','black-a-3']],[5,['black-a-12','black-a-13','black-a-1']],[6,['black-a-2','black-b-2','red-a-5','blue-a-5']],[7,['black-a-1','black-a-2','black-a-3','black-a-4']],[8,['black-a-1','black-a-3','black-a-4']],[9,['red-a-1','blue-a-1']],[10,['black-a-1','black-a-13']],[0,['black-a-1','joker-1','black-a-3']]];
 for(const [decree,ids] of cases){const found=melds(ids.map(id=>all[id]),decree);expect(found.some(ts=>ts.length===ids.length),String(decree)).toBe(true);expect(found.every(ts=>formation(ts.map(id=>all[id]),decree))).toBe(true);}
});

test('difficulty is replayed from bot registration, while legacy bots retain the heuristic',async()=>{
 const {trainedBotCommand}=await import('../src/lib/engine/trained-bot');const {botCommand}=await import('../src/lib/engine/bot');let s=fixture('michael');s.players[0].bot=true;
 expect(trainedBotCommand(s,s.players[0])).toEqual(botCommand(s,s.players[0]));s.players[0].difficulty='easy';expect(tryCommand(s,'a',trainedBotCommand(s,s.players[0])!)).toBeNull();
 let lobby=applyEvent(null,commandEvent(null,'a',{type:'create',name:'Host',seed:'levels'},'level-create'));
 for(const difficulty of ['easy','standard','hard'] as const){lobby=applyEvent(lobby,commandEvent(lobby,'a',{type:'bot',id:difficulty,name:difficulty,difficulty},`level-${difficulty}`));expect(lobby.players.at(-1)!.difficulty).toBe(difficulty);}
 expect(()=>applyEvent(lobby,commandEvent(lobby,'a',{type:'bot',id:'bad',name:'Bad',difficulty:'expert'} as any,'bad-level'))).toThrow('Unknown computer difficulty');
});

test('Sanctuary planners can leave three safe and reuse a released fourth soul',()=>{
 const s=fixture('selaphiel');s.players[0].used=true;s.players[0].sanctuary=true;s.players[0].hand=['green-a-8','green-a-9','red-a-1'];s.heaven=[{id:'safe',x:10,y:10,zone:'a',tiles:['black-a-7','red-a-7','blue-a-7','green-a-7']}];rebalance(s);
 expect(choices(observe(s,'a'),model).some(c=>c.command.type==='organize'&&c.command.groups.some(g=>g.tiles.includes('green-a-7')&&g.tiles.includes('green-a-8')&&g.tiles.includes('green-a-9'))&&c.command.groups.some(g=>g.zone==='a'&&g.tiles.length===3)&&!tryCommand(s,'a',c.command))).toBe(true);
});

test('Transfiguration values net rack reduction rather than gross deliveries',()=>{
 const s=fixture('jophiel'),options=choices(observe(s,'a'),model),candidate=options.find(c=>c.command.type==='organize'&&c.command.power?.kind==='transfigure'&&!tryCommand(s,'a',c.command))!;
 expect(candidate).toBeDefined();const next=applyEvent(s,commandEvent(s,'a',candidate.command,'net-transfiguration'));expect(candidate.features[1]).toBe(s.players[0].hand.length-next.players[0].hand.length);expect(candidate.features[1]).toBe(1);
});
