<script lang="ts">
 import {base} from '$app/paths';
 import SuitSymbol from './SuitSymbol.svelte';
 import InkNumeral from './InkNumeral.svelte';
 export type SoulColor='blue'|'red'|'green'|'black';
 let {rank=7,color='blue',size=64,selected=false,back=false,body=true,face=true,states=true,exploded=false}:{rank?:number|'joker';color?:SoulColor;size?:number;selected?:boolean;back?:boolean;body?:boolean;face?:boolean;states?:boolean;exploded?:boolean}=$props();
</script>
<span class="digital-soul" class:selected={selected&&states} class:exploded data-color={color} data-rank={back?'hidden':rank} style={`--tile-size:${size}px`} role="img" aria-label={back?'Face-down soul':rank==='joker'?'Joker, wild soul':`${color} ${rank}, ${color==='black'?'spades':color==='red'?'hearts':color==='blue'?'diamonds':'clubs'}${selected?', selected':''}`}>
 {#if body}<img class="tile-material" data-layer="tile-body" src={`${base}/art/digital/soul-tile-body-v2.webp`} alt="" draggable="false"/>{/if}
 {#if face}<span class="tile-face" data-layer="tile-face" aria-hidden="true">
  {#if back}<span class="tile-seal">✺</span>
  {:else if rank==='joker'}<span class="joker-mark">✦</span><span class="joker-well">∞</span>
  {:else}<span class="tile-rank"><InkNumeral value={rank} width={720} height={1030} centerX={360} centerY={330} fontSize={388.8}/></span><span class="tile-pip"><SuitSymbol {color}/></span>{/if}
 </span>{/if}
 {#if selected&&states}<span class="tile-selection" data-layer="tile-state" aria-hidden="true"><span>✓</span></span>{/if}
</span>
<style>
 .digital-soul{position:relative;display:inline-block;width:var(--tile-size);height:calc(var(--tile-size)*1.43);flex:none;vertical-align:middle;isolation:isolate;color:#2463a6;--soul-color:#2463a6;filter:drop-shadow(0 3px 2px #1e1b1833)}
 .digital-soul[data-color=red]{color:#b5333e;--soul-color:#b5333e}.digital-soul[data-color=green]{color:#267044;--soul-color:#267044}.digital-soul[data-color=black]{color:#252c2c;--soul-color:#252c2c}
 .tile-material{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;z-index:0;pointer-events:none}.tile-face{position:absolute;inset:0;z-index:1;pointer-events:none}.tile-rank{position:absolute;inset:0}
 .tile-pip :global(svg){display:block;width:100%;height:100%}.tile-pip{position:absolute;top:65.1%;left:37.1%;width:24%;height:16.8%}.tile-seal{position:absolute;inset:12%;display:grid;place-items:center;color:#9f813e;font:400 calc(var(--tile-size)*.83)/1 Georgia,serif}.joker-mark{position:absolute;inset:23% 10% 28%;display:grid;place-items:center;color:#a37a2b;font:400 calc(var(--tile-size)*.76)/1 Georgia,serif}.joker-well{position:absolute;left:37.1%;top:65.1%;width:24%;height:16.8%;display:grid;place-items:center;color:#9b782a;font:500 calc(var(--tile-size)*.26)/1 Georgia,serif}
 .tile-selection{position:absolute;inset:2%;z-index:2;border:2px solid #ba943e;border-radius:9%;box-shadow:0 0 0 2px #fff7dd,0 0 14px #f3d47b80;pointer-events:none}.tile-selection>span{position:absolute;right:-7px;top:-7px;width:19px;height:19px;display:grid;place-items:center;border-radius:50%;color:#fff9e8;background:#745822;font:700 12px/1 sans-serif;box-shadow:0 1px 3px #0004}
 .exploded .tile-material{transform:translate(-23px,18px) rotate(-9deg)}.exploded .tile-face{transform:translate(24px,-21px) rotate(7deg)}.exploded .tile-selection{transform:translate(42px,-42px) rotate(12deg)}
</style>
