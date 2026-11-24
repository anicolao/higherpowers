import {decree,total,type State,type Player,type Group} from '../engine';
export interface Rival {id:string;count:number;favor:number;angel:Player['angel'];used:boolean;opened:boolean;score:number;purgatory:string|null;}
export interface Observation {me:Player;rivals:Rival[];tiles:State['tiles'];heaven:Group[];decree:number;round:number;phase:State['phase'];active:boolean;turn:number;revision:number;bagCount:number;inspection:string[];communion:string[];danceCount:number;danceFrom:string;judgment:number;}
/** This is the entire information boundary used by every deployed policy. */
export function observe(s:State,id:string):Observation{
 const me=s.players.find(p=>p.id===id);if(!me)throw Error('Unknown bot');
 return {me:structuredClone(me),rivals:s.players.filter(p=>p.id!==id).map(p=>({id:p.id,count:p.hand.length,favor:p.favor,angel:p.angel,used:p.used,opened:p.opened,score:total(p),purgatory:p.purgatory})),tiles:s.tiles,heaven:s.heaven,decree:decree(s),round:s.round,phase:s.phase,active:s.players[s.turn].id===id,turn:s.turnNumber,revision:s.revision,bagCount:s.bag.length,inspection:s.inspection?.player===id?[...s.inspection.tiles]:[],communion:s.communion?.player===id?[...s.players.find(p=>p.id===s.communion!.target)!.hand]:[],danceCount:s.dance?.count??0,danceFrom:s.players[(s.players.indexOf(me)+1)%s.players.length].id,judgment:s.judgment};
}
