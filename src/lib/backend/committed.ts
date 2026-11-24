import type {Command,GameEvent} from '../engine/types';
/** Only an exact recorded keep can settle a duplicate inspection completion.
 * Never retarget an action to a newer turn or infer completion from tile ownership. */
export function hasCommittedKeep(events:readonly GameEvent[],actor:string,command:Command){
 return command.type==='keep'&&events.some(event=>event.actor===actor&&event.command.type==='keep'&&event.command.turn===command.turn&&event.command.tile===command.tile);
}
