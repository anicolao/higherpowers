import type {Group,State} from '../engine/types';
export interface LiveDraft {version:1;revision:number;turn:number;actor:string;session:string;sequence:number;sentAt:number;groups:Group[];purgatory:string|null;dragging:boolean}
export function acceptsDraft(s:State,draft:LiveDraft|null,now=Date.now()):draft is LiveDraft{
 if(!draft||draft.version!==1||s.phase!=='play'||draft.revision!==s.revision||draft.turn!==s.turnNumber||draft.actor!==s.players[s.turn].id||!Number.isFinite(draft.sentAt)||Math.abs(now-draft.sentAt)>=45000||!Array.isArray(draft.groups)||draft.groups.length>106)return false;
 if(draft.purgatory!==null&&(!s.tiles[draft.purgatory]||s.heaven.some(g=>g.zone!==null&&g.tiles.includes(draft.purgatory!))))return false;
 const allowed=new Set([...s.heaven.flatMap(g=>g.tiles),...s.players[s.turn].hand,...(s.players[s.turn].purgatory?[s.players[s.turn].purgatory!]:[]),...(s.communion?s.players.find(p=>p.id===s.communion!.target)?.hand??[]:[])]),seen=new Set<string>(),groups=new Set<string>();
 for(const g of draft.groups){if(!g||typeof g.id!=='string'||groups.has(g.id)||!Number.isFinite(g.x)||!Number.isFinite(g.y)||g.x<0||g.y<0||g.x>20000||g.y>20000||!Array.isArray(g.tiles)||!g.tiles.length||g.zone!==null&&!s.players.some(p=>p.id===g.zone))return false;groups.add(g.id);for(const id of g.tiles){if(!allowed.has(id)||seen.has(id))return false;seen.add(id);}}
 if(draft.purgatory&&(!allowed.has(draft.purgatory)||seen.has(draft.purgatory)))return false;
 return true;
}
// Realtime Database removes empty arrays and null object fields. Reconstruct schema explicitly.
export function decodeLive(value:unknown):LiveDraft|null{if(!value||typeof value!=='object')return null;const v=value as LiveDraft;return {...v,purgatory:v.purgatory??null,groups:Array.isArray(v.groups)?v.groups.map(g=>({...g,zone:g.zone??null,tiles:Array.isArray(g.tiles)?g.tiles:[]})):[]};}
