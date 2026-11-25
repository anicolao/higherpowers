import {test,expect} from 'bun:test';
import {formation,resolveJokers} from '../../src/lib/engine/formations';
import {melds} from '../../src/lib/engine/rl/melds';
import {suits,type Soul} from '../../src/lib/tabletop/rearrangement';
import {applyEvent,commandEvent,souls,assertInventory,type State,type Command} from '../../src/lib/engine/engine';
const tile=(rank:number,color:Soul['color'],i:number):Soul=>({id:`${color}-${rank}-${i}`,rank,color});
test('every pair in Two Pair has different colours; colours may repeat across ranks',()=>{
 for(const a of suits)for(const b of suits)for(const c of suits)for(const d of suits){const ts=[tile(2,a,0),tile(2,b,1),tile(5,c,2),tile(5,d,3)];expect(formation(ts,6)).toBe(a!==b&&c!==d?'poker':null);}
});
test('a Full House has a distinct-colour pair and a distinct-colour triple',()=>{
 for(const a of suits)for(const b of suits)for(const c of suits)for(const d of suits)for(const e of suits){const ts=[tile(2,a,0),tile(2,b,1),tile(5,c,2),tile(5,d,3),tile(5,e,4)];expect(formation(ts,6)).toBe(a!==b&&new Set([c,d,e]).size===3?'poker':null);}
});
test('wild jokers use available colours and declared joker colours remain binding',()=>{
 const catalog=souls(),ts=(ids:string[])=>ids.map(id=>catalog[id]),pair=ts(['black-a-2','red-a-2','black-a-5','joker-1']),house=ts(['black-a-2','red-a-2','black-a-5','red-a-5','joker-1']);
 const faces=resolveJokers(pair,6)!;expect(faces).not.toBeNull();expect(formation(pair,6,faces)).toBe('poker');expect(faces['joker-1'].color).not.toBe('black');
 expect(formation(house,6,{'joker-1':{rank:5,color:'black'}})).toBeNull();expect(formation(house,6,{'joker-1':{rank:5,color:'blue'}})).toBe('poker');
 expect(resolveJokers(ts(['black-a-2','black-b-2','black-a-5','joker-1']),6)).toBeNull();
 expect(formation(ts(['black-a-2','red-a-2','black-a-5','joker-1','joker-2']),6)).toBe('poker');
});
test('bot meld generation keeps legal poker options and rejects duplicate colours',()=>{
 const catalog=souls(),pool=['black-a-2','black-b-2','red-a-2','black-a-5','black-b-5','blue-a-5'].map(id=>catalog[id]),options=melds(pool,6);
 expect(options.some(ids=>ids.length===4&&formation(ids.map(id=>catalog[id]),6)==='poker')).toBe(true);
 for(const ids of options)expect(formation(ids.map(id=>catalog[id]),6)).not.toBeNull();
 expect(options.some(ids=>ids.includes('black-a-2')&&ids.includes('black-b-2'))).toBe(false);
});
test('old duplicate-colour poker events remain replayable but new Organize actions reject them',()=>{
 let s:State|null=null;const act=(actor:string,c:Command)=>s=applyEvent(s,commandEvent(s,actor,c,String((s?.revision??0)+1)));
 act('a',{type:'create',name:'A',seed:'poker-versioning'});act('a',{type:'bot',id:'b',name:'B'});act('a',{type:'start'});for(const p of s!.players)act(p.id,{type:'angel',angel:p.options[0]});
 const state=s!;state.phase='play';state.turn=0;state.decrees=[6,0];state.heaven=[];state.players[0].hand=['black-a-2','black-b-2','red-a-5','blue-a-5','green-a-13'];state.players[0].opened=false;state.players[1].hand=['red-a-13'];state.bag=Object.keys(state.tiles).filter(id=>!state.players.some(p=>p.hand.includes(id)));assertInventory(state);
 const tiles=state.players[0].hand.slice(0,4),c:Command={type:'organize',groups:[{id:'poker',x:20,y:20,zone:null,tiles}],opening:tiles,turn:state.turnNumber},e=commandEvent(state,'a',c,'poker');
 expect(e.version).toBe(3);expect(()=>applyEvent(state,e)).toThrow('legal');
 for(const version of [1,2] as const)expect(applyEvent(state,{...e,version}).heaven[0].tiles).toEqual(tiles);
});
