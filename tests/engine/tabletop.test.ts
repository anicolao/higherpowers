import {test,expect} from 'bun:test';
import {applyEvent,commandEvent,replay,assertInventory,type State,type Command,type GameEvent} from '../../src/lib/engine/engine';
import {tableSeats,seatPose} from '../../src/lib/tabletop/seats';
import {botCommand} from '../../src/lib/engine/bot';
function fixture(){let s:State|null=null;const events:GameEvent[]=[];return {get state(){return s!;},events,act(actor:string,c:Command){const e=commandEvent(s,actor,c,crypto.randomUUID());s=applyEvent(s,e);events.push(e);return s;}};}
test('eight physical positions rotate around the long edges in both orientations',()=>{
 expect(tableSeats).toHaveLength(8);expect(new Set(tableSeats).size).toBe(8);
 for(const seat of tableSeats){const p=seatPose(seat),portrait=seatPose(seat,true);expect(portrait).toEqual({x:100-p.y,y:p.x,angle:p.angle+90});}
 expect(tableSeats.filter(s=>s.startsWith('south'))).toHaveLength(3);expect(tableSeats.filter(s=>s.startsWith('north'))).toHaveLength(3);
});
test('tabletop seats are unique, capped at five, host controlled, and ordered clockwise when dealt',()=>{
 const t=fixture();t.act('host',{type:'create',name:'Host',seed:'tabletop',seat:'north'});
 t.act('host',{type:'seat',id:'west-player',name:'West',seat:'west'});
 expect(()=>t.act('west-player',{type:'seat',id:'cheat',name:'Cheat',seat:'east'})).toThrow('host');
 expect(()=>t.act('host',{type:'seat',id:'collision',name:'Collision',seat:'west'})).toThrow('free');
 t.act('host',{type:'bot',id:'computer',name:'Computer',seat:'east'});
 t.act('remote',{type:'join',name:'Remote',seat:'south-east'});
 t.act('host',{type:'seat',id:'south-player',name:'South',seat:'south'});
 expect(()=>t.act('host',{type:'seat',id:'sixth',name:'Sixth',seat:'north-west'})).toThrow('full');
 t.act('host',{type:'start'});
 expect(t.state.players.map(p=>p.seat)).toEqual(['south','south-east','east','north','west']);
 expect(t.state.players.filter(p=>p.local).map(p=>p.id)).toEqual(['south-player','west-player']);
 expect(()=>t.act('host',{type:'seat',id:'late',name:'Late',seat:'north-west'})).toThrow('started');
 expect(replay(t.events)).toEqual(t.state);
});
test('shared human actors play complete deterministic games using the existing rules',()=>{
 const t=fixture();t.act('host',{type:'create',name:'Host',seed:'screened-table',seat:'south-east'});t.act('host',{type:'seat',id:'north-player',name:'North',seat:'north-west'});t.act('host',{type:'start'});
 let moves=0;while(t.state.phase!=='ended'&&moves++<3500){const s=t.state;if(s.phase==='round-end'){t.act('host',{type:'next-round'});continue;}let acted=false;for(const p of s.players){const c=botCommand(s,p);if(c){t.act(p.id,c);acted=true;break;}}expect(acted).toBe(true);assertInventory(t.state);}
 expect(t.state.phase).toBe('ended');expect(replay(t.events)).toEqual(t.state);
});
test('ordinary tables cannot acquire local human controllers',()=>{const t=fixture();t.act('host',{type:'create',name:'Host',seed:'old'});expect(()=>t.act('host',{type:'seat',id:'extra',name:'Extra',seat:'west'})).toThrow('not a shared');});
test('name-free tabletop joining reserves two distinct Angels and preserves choices through clockwise dealing',()=>{
 const t=fixture();t.act('host',{type:'create',name:'Angel',seed:'walk-up',seat:'north',chooseOnJoin:true});
 expect(t.state.players[0].options).toHaveLength(2);const hostOptions=[...t.state.players[0].options];t.act('host',{type:'angel',angel:hostOptions[1]});expect(t.state.phase).toBe('lobby');expect(t.state.players[0].name.toLowerCase()).toBe(hostOptions[1]);
 t.act('host',{type:'seat',id:'south',name:'Angel',seat:'south'});t.act('host',{type:'bot',id:'bot',name:'Computer',seat:'east'});
 expect(new Set(t.state.players.flatMap(p=>p.options)).size).toBe(6);expect(()=>t.act('host',{type:'start'})).toThrow('choose');expect(()=>t.act('south',{type:'angel',angel:hostOptions[0]})).toThrow('two Angels');
 for(const p of t.state.players.filter(p=>!p.angel))t.act(p.id,p.bot?botCommand(t.state,p)!:{type:'angel',angel:p.options[0]});
 const choices=Object.fromEntries(t.state.players.map(p=>[p.id,{options:p.options,angel:p.angel,name:p.name}]));t.act('host',{type:'start'});
 expect(t.state.phase).toBe('play');expect(t.state.players.map(p=>p.seat)).toEqual(['south','east','north']);for(const p of t.state.players){expect({options:p.options,angel:p.angel,name:p.name}).toEqual(choices[p.id]);expect(p.hand).toHaveLength(14);}expect(replay(t.events)).toEqual(t.state);assertInventory(t.state);
});
