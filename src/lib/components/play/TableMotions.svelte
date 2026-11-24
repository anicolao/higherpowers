<script lang="ts">
 import SoulTile from '../digital/SoulTile.svelte';
 import type {Soul} from '$lib/tabletop/rearrangement';
 export interface Flight {key:string;tile:Soul;back:boolean;from:{x:number;y:number;width:number;angle?:number};to:{x:number;y:number;width:number;angle?:number};delay:number}
 let {flights=[],onFinish}:{flights?:Flight[];onFinish?:(key:string)=>void}=$props();
 function fly(node:HTMLElement,flight:Flight){
  document.body.appendChild(node);const {from,to,delay}=flight,start=from.angle??0,end=start+((((to.angle??0)-start+540)%360+360)%360-180),midX=(from.x+to.x)/2,midY=(from.y+to.y)/2-Math.min(75,Math.hypot(to.x-from.x,to.y-from.y)*.13);
  const motion=node.animate([{transform:`translate(${from.x}px,${from.y}px) scale(${from.width/44}) rotate(${start}deg)`,opacity:1},{transform:`translate(${midX}px,${midY}px) scale(${Math.max(from.width,to.width)/44}) rotate(${(start+end)/2}deg)`,offset:.5},{transform:`translate(${to.x}px,${to.y}px) scale(${to.width/44}) rotate(${end}deg)`,opacity:1}],{duration:560,delay,easing:'cubic-bezier(.25,.55,.25,1)',fill:'both'});
  // Restore the underlying tile when its own flight finishes or is interrupted.
  void motion.finished.then(()=>onFinish?.(flight.key),()=>onFinish?.(flight.key));
  return {destroy(){motion.cancel();node.remove();}};
 }
</script>
{#each flights as flight(flight.key)}<div class="computer-flight" use:fly={flight} data-flight-id={flight.tile.id} aria-hidden="true"><SoulTile rank={flight.tile.rank} color={flight.tile.color} back={flight.back} size={44}/></div>{/each}
<style>.computer-flight{position:fixed;left:0;top:0;z-index:2000;pointer-events:none;transform-origin:0 0;filter:drop-shadow(0 9px 6px #041a1777)}</style>
