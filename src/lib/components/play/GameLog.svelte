<script lang="ts">
 import {tick,untrack,onMount} from 'svelte';
 import {applyEvent,type State,type GameEvent} from '$lib/engine/engine';
 import {describeEvent,type ChronicleEntry} from '$lib/engine/presentation';
 let {events=[]}:{events?:GameEvent[]}=$props();
 let entries=$state<ChronicleEntry[]>([]),scroll:HTMLOListElement;let cached:State|null=null,ids:string[]=[],follow=true;
 $effect(()=>{const transcript=events;untrack(()=>{
  const bottom=follow;
  if(transcript.length<ids.length||ids.length&&transcript[ids.length-1]?.id!==ids.at(-1)){cached=null;ids=[];entries=[];}
  const added:ChronicleEntry[]=[];for(const event of transcript.slice(ids.length)){const next=applyEvent(cached,event);added.push(...describeEvent(event,cached,next));cached=next;ids.push(event.id);}
  if(added.length){entries=[...entries,...added].slice(-80);if(bottom)void tick().then(()=>scroll?.scrollTo({top:scroll.scrollHeight}));}
 });});
 onMount(()=>{const observer=new ResizeObserver(()=>{if(follow)scroll?.scrollTo({top:scroll.scrollHeight});});observer.observe(scroll);return()=>observer.disconnect();});
</script>
<aside class="game-log" aria-label="Game log"><span class="scroll-top" aria-hidden="true"></span><!-- svelte-ignore a11y_no_noninteractive_tabindex (The scrollable history is deliberately keyboard-focusable.) -->
<ol tabindex="0" bind:this={scroll} onscroll={()=>follow=scroll.scrollHeight-scroll.scrollTop-scroll.clientHeight<28} role="log" aria-live="polite" aria-relevant="additions">{#each entries as entry(entry.id)}<li data-log-id={entry.id}><strong>{entry.actor}</strong> {entry.text}</li>{/each}</ol><span class="scroll-bottom" aria-hidden="true"></span></aside>
<style>
 .game-log{position:absolute;left:18px;bottom:255px;width:220px;height:155px;z-index:145;padding:10px 10px 9px;background:linear-gradient(100deg,#d6be8a,#f1e5c5 9%,#eee1bd 90%,#cfb27d);box-shadow:0 5px 12px #061e1955;border-radius:3px;color:#62502f;opacity:.9}.game-log:hover,.game-log:focus-within{opacity:1}.game-log ol{height:100%;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#ad8b4c transparent;list-style:none;margin:0;padding:0 3px;font:11px/1.45 'Atkinson Hyperlegible',sans-serif}.game-log li{margin:0;padding:5px 0;border-bottom:1px solid #b99c6333;font-size:inherit;line-height:inherit}.game-log strong{font-weight:700}.scroll-top,.scroll-bottom{position:absolute;left:-5px;right:-5px;height:9px;border:1px solid #a78a55;border-radius:5px;background:linear-gradient(#f3e6c2,#c5a66a 70%,#b29154);box-shadow:0 2px 3px #0d231733}.scroll-top{top:-3px}.scroll-bottom{bottom:-3px}@media(max-width:850px){.game-log{left:130px;bottom:30dvh;width:180px;height:110px;padding:7px}.game-log ol{font-size:10px}}@media(max-width:550px){.game-log{left:110px;bottom:30dvh;width:min(165px,calc(100vw - 210px));height:105px}.game-log ol{font-size:10px;line-height:1.35}}@media(max-height:600px) and (min-width:600px){.game-log{bottom:175px;height:110px;width:175px}}
</style>
