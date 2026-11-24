<script lang="ts">
 import {base} from '$app/paths';
 import {cardTotal,type Card} from '$lib/data/game';
 let {card,back=false,mono=false,inPlay=false}:{card:Card;back?:boolean;mono?:boolean;inPlay?:boolean}=$props();
</script>
<article class="game-card" class:back class:mono class:in-play={inPlay} class:dense={card.brief.length>310} data-card-id={card.id} data-kind={card.kind} aria-label={back?`${card.kind} card back`:card.name}>
 {#if back}
  <img class="back-art" data-layer="artwork" src={`${base}/art/cards/back-${card.kind}.webp`} alt="" draggable="false"/>
 {:else}
  <div class="paper-layer" data-layer="paper"></div>
  {#if !mono}<img class="background-layer" data-layer="background" src={`${base}/art/cards/heaven-background.webp`} alt="" draggable="false"/>{/if}
  {#if !mono}<img class="subject-layer" data-layer="illustration" src={`${base}/art/cards/${card.id}.webp`} alt="" draggable="false"/>{/if}
  <div class="card-heading" data-layer="typography" data-fit="title"><span>{card.kind==='angel'?'ANGEL':card.kind==='decree'?'HEAVENLY DECREE':'FINAL JUDGMENT'}</span><h3>{card.name}</h3></div>
  <div class="card-lettering" data-layer="typography">
   <div class="copy-panel" data-fit="copy">{#if card.kind==='angel'}<h4>{card.title}</h4>{/if}<p class="timing">{card.timing}</p><p class="effect">{card.brief}</p></div>
   <footer><span>Higher Powers</span><span>{card.code} · {card.number} of {cardTotal}</span></footer>
  </div>
  {#if !mono}<img class="frame-layer" data-layer="frame" src={`${base}/art/cards/frame.webp`} alt="" draggable="false"/>{/if}
 {/if}
</article>
<style>
 .in-play[data-kind=angel] .card-heading span{font-size:3cqw;line-height:1;letter-spacing:.12em}
 .in-play[data-kind=angel] .card-heading h3{font-size:9.8cqw;line-height:1.05;margin:0}
</style>
