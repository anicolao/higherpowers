import {formationRect,separateGroups} from '../tabletop/layout';
import type {TileGroup} from '../tabletop/rearrangement';
import type {State,Command} from './types';

/** Presentation after policy selection: retain the chosen tiles, gifts and
 * Sanctuary witness, changing only formation coordinates in the final command. */
export function layoutBotCommand(s:State,actor:string,c:Command|null):Command|null{
 if(c?.type!=='organize')return c;
 const view=(g:typeof c.groups[number]):TileGroup=>({...g,tiles:g.tiles.map(id=>s.tiles[id])});
 const metrics={step:47,tileHeight:44*1.43},groups=c.groups.map(view);
 const unchanged=new Set(c.groups.filter(g=>{const old=s.heaven.find(o=>o.id===g.id);return old&&JSON.stringify(old)===JSON.stringify(g);}).map(g=>g.id));
 const width=Math.max(1000,...groups.map(g=>{const r=formationRect(g,metrics);return r.x+r.width+8;}));
 const arranged=separateGroups(groups,metrics,width,g=>!g.zone||g.zone===actor,g=>unchanged.has(g.id)?0:1);
 return {...c,groups:c.groups.map((g,i)=>({...g,x:arranged[i].x,y:arranged[i].y}))};
}
