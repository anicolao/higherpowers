<script lang="ts">
 import {base} from '$app/paths';
 const cover=`${base}/art/integrations/higher-powers-cover-v1.webp`;
 const previous=`${base}/art/cards/heaven-background.webp`;
</script>
<svelte:head><title>Launcher artwork — Higher Powers</title><meta name="description" content="Dedicated painterly Higher Powers cover for Game Room and the tabletop launcher."/></svelte:head>
<main id="main" class="art-review">
 <p class="eyebrow">GAME ROOM & TABLETOP</p><h1>A cover with presence.</h1>
 <p class="intro">Antique gold, ivory wings, and deep green. A distinct cover for the cabinet and the table.</p>
 <div class="showcase">
  <figure class="hero-cover"><img src={cover} alt="Higher Powers in gold lettering above a golden-winged angel and four ivory suit tiles on dark green velvet" width="900" height="1200"/><figcaption>The new catalogue cover</figcaption></figure>
  <section class="studies" aria-label="Launcher size comparisons">
   <h2>Readable at a glance.</h2><p>The launchers can keep their white title labels. The darker cover gives them room to breathe.</p>
   <div class="comparison">
    {#each [{name:'Previous scenery',src:previous},{name:'New cover',src:cover}] as art}
     <figure><div class="label-study"><img src={art.src} alt={art.name} width="180" height="240"/><strong>Higher Powers</strong></div><figcaption>{art.name} · white title overlay</figcaption></figure>
    {/each}
   </div>
   <h3>Tabletop thumbnail</h3><div class="thumbnail-study"><img src={cover} alt="New Higher Powers cover at tabletop thumbnail size" width="96" height="128"/><strong>Higher Powers</strong></div>
   <div class="actions"><a class="button" href={cover} download>Download cover · WebP</a><a class="text-link" href={`${base}/gallery`}>Back to components</a></div>
  </section>
 </div>
</main>
<style>
 .art-review{max-width:1150px;margin:auto;padding:40px 28px 70px}.art-review h1{margin-bottom:12px}.intro{font-size:1.15rem;max-width:680px;margin-bottom:38px}.showcase{display:grid;grid-template-columns:minmax(220px,400px) minmax(0,1fr);gap:60px;align-items:start}figure{margin:0}.hero-cover>img{display:block;width:100%;height:auto;border-radius:3px;box-shadow:7px 12px 28px #16251c44}figcaption{font-size:.78rem;color:#695b43;line-height:1.5;margin:12px 0}.studies h2{font-size:2.6rem;margin:6px 0 15px}.studies h3{font-size:1.65rem;margin:28px 0 16px}.comparison{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:26px}.label-study{position:relative;aspect-ratio:3/4;overflow:hidden;box-shadow:0 4px 12px #1d291e33}.label-study img{display:block;width:100%;height:100%;object-fit:cover}.label-study strong{position:absolute;left:5%;right:5%;bottom:5%;color:white;text-align:center;font:700 clamp(16px,2vw,24px)/1.1 Georgia,serif}.thumbnail-study{width:160px;padding:14px 14px 12px;display:grid;justify-items:center;gap:14px;background:#102d24;border:1px solid #a28645;border-radius:9px}.thumbnail-study img{width:96px;height:128px;object-fit:contain}.thumbnail-study strong{color:#fff;font:400 15px/1.1 Georgia,serif}.actions{align-items:center;gap:20px}.studies>p{max-width:500px}
 @media(max-width:700px){.showcase{grid-template-columns:1fr;gap:32px}.hero-cover{max-width:380px}.art-review{padding:28px 20px 50px}.comparison{max-width:450px}.label-study strong{font-size:20px}}
</style>
