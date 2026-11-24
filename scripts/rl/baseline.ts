import {botCommand} from '../../src/lib/engine/bot';
import {decree,allowance,type State,type Player} from '../../src/lib/engine/engine';
import {formation} from '../../src/lib/engine/formations';
import {melds} from '../../src/lib/engine/rl/melds';
/** Exact fast path for the frozen heuristic's expensive no-meld case.
 * Every formation has a legal prefix of at most five tiles (Poker needs 4/5).
 * If any meld/extension exists, delegate to the untouched original policy so
 * its combination ordering, placement, and decisions remain unchanged.
 */
export function frozenHeuristic(s:State,p:Player){
 if(s.phase==='play'&&s.players[s.turn].id===p.id&&!melds(p.hand.map(id=>s.tiles[id]),decree(s),1).length){
  const extension=p.opened&&s.heaven.filter(g=>g.zone===null||g.zone===p.id).some(g=>p.hand.some(id=>Array.from({length:g.tiles.length+1},(_,at)=>[...g.tiles.slice(0,at),id,...g.tiles.slice(at)]).some(ts=>!!formation(ts.map(id=>s.tiles[id]),decree(s)))));
  if(!extension)return {type:'draw' as const,turn:s.turnNumber,foretell:p.angel==='uriel'&&!p.used&&s.bag.length>0&&allowance(s,p.id)<8};
 }
 return botCommand(s,p);
}
