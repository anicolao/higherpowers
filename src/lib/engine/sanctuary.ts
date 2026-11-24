import {formation,type FormationKind} from './formations';
import type {Group,State} from './types';

export type SanctuaryFrame=string[][];
export const sanctuaryFrame=(groups:Group[],owner:string):SanctuaryFrame=>groups.filter(g=>g.zone===owner).map(g=>[...g.tiles]);
export function sameSanctuary(a:SanctuaryFrame,b:SanctuaryFrame){
 const key=(frame:SanctuaryFrame)=>JSON.stringify(frame.map(ids=>[...ids].sort()).sort((a,b)=>a.join('|').localeCompare(b.join('|'))));
 return key(a)===key(b);
}
/** A turn-local witness, not permanent original-tile ownership. Every resulting
 * formation must grow from protected tiles in the preceding arrangement.
 * Record a legal extension before splitting off an entirely new end. */
export function sanctuaryStep(before:SanctuaryFrame,after:SanctuaryFrame,tiles:State['tiles'],decree:number,kind:FormationKind){
 const previous=new Set(before.flat()),next=after.flat();
 return next.length<=106&&new Set(next).size===next.length&&after.every(ids=>ids.length>0&&ids.every(id=>!!tiles[id])&&ids.some(id=>previous.has(id))&&formation(ids.map(id=>tiles[id]),decree)===kind);
}
export function sanctuaryError(before:Group[],after:Group[],owner:string,tiles:State['tiles'],decree:number,kind:FormationKind,steps:SanctuaryFrame[]=[]){
 if(!Array.isArray(steps)||steps.length>64)return 'Too many Sanctuary rearrangements in one action.';
 let previous=sanctuaryFrame(before,owner);
 for(const next of [...steps,sanctuaryFrame(after,owner)]){
  if(!Array.isArray(next)||next.some(ids=>!Array.isArray(ids))||!sanctuaryStep(previous,next,tiles,decree,kind))return 'Extend or split protected formations; an entirely new formation cannot enter Sanctuary.';
  previous=next;
 }
 return null;
}
