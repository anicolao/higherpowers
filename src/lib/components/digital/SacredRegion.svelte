<script lang="ts">
 import {base} from '$app/paths';
 import type {Snippet} from 'svelte';
 let {kind='sanctuary',owner,title,available=true,children}:{kind?:'sanctuary'|'purgatory';owner:string;title:string;available?:boolean;children?:Snippet}=$props();
</script>
{#if available}<section class="sacred-region" data-region={kind} aria-label={`${owner}’s ${title}`}>
 <div class="region-surface">
  <img class="region-art" data-layer="region-art" src={`${base}/art/digital/${kind==='sanctuary'?'sanctuary-garden':'purgatory-threshold'}.webp`} alt="" draggable="false"/>
  <div class="region-souls" data-layer="region-contents">{@render children?.()}</div>
 </div>

</section>{/if}
<style>
 .sacred-region{min-width:0}.region-surface{position:relative;isolation:isolate;aspect-ratio:3/2;overflow:hidden;border-radius:12px;border:1px solid #baab7c;box-shadow:0 3px 7px #34271a15;background:#efe9dc}.region-art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0}.region-souls{position:absolute;inset:27% 5% 10%;display:flex;align-items:center;justify-content:center;gap:3px;z-index:1}
</style>
