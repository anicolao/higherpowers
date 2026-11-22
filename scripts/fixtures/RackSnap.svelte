<script lang="ts">
 import SharedHeaven from '../../src/lib/components/digital/SharedHeaven.svelte';
 import Rack from '../../src/lib/components/play/Rack.svelte';
 import {arrangeDraftGroup} from '../../src/lib/engine/arrangement';
 import {normalizeDraftGroup} from '../../src/lib/engine/draft';
 import type {TileGroup,Soul} from '../../src/lib/tabletop/rearrangement';
 let {initialGroups,tiles}:{initialGroups:TileGroup[];tiles:Soul[]}=$props();
 let board=$state<SharedHeaven>(null!);let groups=$state<TileGroup[]>([]);
 const hand=$derived(tiles.filter(t=>!groups.some(g=>g.tiles.some(s=>s.id===t.id))));
 $effect(()=>{(window as any).heaven=board;});
</script>
<SharedHeaven bind:this={board} game insetX={80} insetY={70} {initialGroups} boardKey="snap" orderGroup={g=>arrangeDraftGroup(g)} normalizeGroup={g=>normalizeDraftGroup(g)} canTouch={g=>!g.zone} onChange={g=>groups=g}/>
<div class="rack-source"><Rack tiles={hand} selected={tiles.map(t=>t.id)} canPlay onDrag={(ts,x,y,i)=>ts?board.previewTiles(ts,x,y,i):board.clearTilePreview()} onDropMany={(ts,x,y,i)=>{(window as any).drops=((window as any).drops??0)+1;return board.placeTiles(ts,x,y,i);}}/></div>
<style>.rack-source{position:fixed;bottom:15px;left:50%;transform:translateX(-50%);filter:drop-shadow(0 5px 5px #0005);z-index:200}</style>
