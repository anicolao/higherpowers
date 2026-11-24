import type {Command,GameEvent} from '../engine/types';

type Organize=Extract<Command,{type:'organize'}>;
type StoredOrganize=Omit<Organize,'sanctuary'>&{sanctuary?:{groups:{tiles:string[]}[]}[]};
export type StoredEvent=Omit<GameEvent,'command'>&{command:Exclude<Command,Organize>|StoredOrganize};

/** Firestore permits arrays inside maps, but not arrays directly inside arrays.
 * Keep this storage representation outside the rules engine and replay files. */
export function encodeEvent(event:GameEvent):StoredEvent{
 const c=event.command;
 if(c.type!=='organize'||!c.sanctuary)return event as StoredEvent;
 return {...event,command:{...c,sanctuary:c.sanctuary.map(frame=>({groups:frame.map(tiles=>({tiles:[...tiles]}))}))}};
}
export function decodeEvent(value:unknown):GameEvent{
 const event=value as StoredEvent,c=event.command;
 if(c.type!=='organize'||!c.sanctuary)return event as GameEvent;
 // Also accept the original in-memory representation in imported transcripts.
 if(Array.isArray(c.sanctuary)&&c.sanctuary.every(Array.isArray))return event as unknown as GameEvent;
 if(!Array.isArray(c.sanctuary)||c.sanctuary.some(frame=>!frame||!Array.isArray(frame.groups)||frame.groups.some(group=>!group||!Array.isArray(group.tiles)||group.tiles.some(id=>typeof id!=='string'))))throw Error('Invalid stored Sanctuary arrangement.');
 return {...event,command:{...c,sanctuary:c.sanctuary.map(frame=>frame.groups.map(group=>[...group.tiles]))}};
}
