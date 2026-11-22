import {mount,unmount} from 'svelte';
import SharedHeaven from '../../src/lib/components/digital/SharedHeaven.svelte';
import {normalizeDraftGroup} from '../../src/lib/engine/draft';
import {souls} from '../../src/lib/engine/engine';
import type {TileGroup} from '../../src/lib/tabletop/rearrangement';
const target=document.createElement('div');target.style.cssText='position:fixed;inset:0;z-index:9999;background:#f4eddc;padding:20px;overflow:auto';document.body.append(target);
const pool=souls();let component:ReturnType<typeof mount>;
const group:TileGroup={id:'source',x:30,y:100,tiles:['black-a-1','black-a-2','black-a-3','black-a-4','black-a-5','black-a-6','joker-1'].map(id=>pool[id]),jokerFaces:{'joker-1':{rank:7,color:'black'}},zone:null};
async function load(legacy=false){if(component)await unmount(component);const initialGroups=legacy?[{...group,tiles:group.tiles.slice(0,3)},{...group,id:'returned',x:260,tiles:group.tiles.slice(3)}]:[group];component=mount(SharedHeaven,{target,props:{game:true,boardKey:legacy?'legacy':'new',initialGroups,normalizeGroup:g=>normalizeDraftGroup(g),onChange:gs=>{(window as any).draft=gs;}}});(window as any).heaven=component;}
(window as any).loadFixture=load;void load();
