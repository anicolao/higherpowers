<script lang="ts">
 import type {Snippet} from 'svelte';
 import {untrack} from 'svelte';
 import {tableSeats,seatPose,type TableSeat} from '$lib/tabletop/seats';
 import type {Player,State} from '$lib/engine/types';
 import {angels} from '$lib/data/game';
 import GameCard from '../GameCard.svelte';
 import DivineFavor from '../digital/DivineFavor.svelte';
 import SoulTile from '../digital/SoulTile.svelte';
 import ScoreSlip from './ScoreSlip.svelte';
 import {total} from '$lib/engine/engine';
 let {state:gameState=null,uid='',busy=false,onJoin,onAngel,onCard,onFocus,onPrivacy,station}:{state?:State|null;uid?:string;busy?:boolean;onJoin:(seat:TableSeat,name:string,bot:boolean)=>void;onAngel?:(id:string,angel:NonNullable<Player['angel']>)=>void;onCard?:(id:string)=>void;onFocus?:(id:string)=>void;onPrivacy?:(open:string[])=>void;station?:Snippet<[Player,number]>}=$props();
 let width=$state(1600),height=$state(1000),joining=$state<TableSeat|null>(null),name=$state(''),open=$state<string[]>([]),round=-1;
 const portrait=$derived(height>width),short=$derived(Math.min(width,height)),long=$derived(Math.max(width,height));
 const depth=$derived(Math.min(160,Math.max(110,short*.17))),span=$derived(Math.min(500,(long-2*depth)/3-12));
 const scale=$derived(Math.min(1,span/480,depth/144));
 function location(seat:TableSeat){const pose=seatPose(seat,portrait);let x:number,y:number;
  if(!portrait){x=seat==='east'?width-depth/2:seat==='west'?depth/2:depth+((pose.x-25)/25+.5)*(width-2*depth)/3;y=seat.startsWith('south')?height-depth/2:seat.startsWith('north')?depth/2:height/2;}
  else{x=seat.startsWith('south')?depth/2:seat.startsWith('north')?width-depth/2:width/2;y=seat==='east'?height-depth/2:seat==='west'?depth/2:depth+((seatPose(seat).x-25)/25+.5)*(height-2*depth)/3;}
  return {x,y,angle:pose.angle};
 }
 function cover(){open=[];onPrivacy?.([]);}
 function reveal(id:string){open=open.includes(id)?open.filter(p=>p!==id):[...open,id];onPrivacy?.([...open]);if(open.includes(id))onFocus?.(id);}
 $effect(()=>{const r=gameState?.round??0;if(r!==round)untrack(()=>{round=r;cover();});});
 function join(bot=false){if(!joining||(!bot&&!name.trim()))return;onJoin(joining,bot?'Computer':name.trim(),bot);joining=null;name='';}
</script>
<svelte:window bind:innerWidth={width} bind:innerHeight={height} onblur={cover} onkeydown={e=>{if(e.key==='Escape'){cover();joining=null;}}}/>
<svelte:document onvisibilitychange={()=>{if(document.hidden)cover();}}/>
<div class="tabletop-ring" style={`--table-depth:${depth}px`} aria-label="Eight tabletop positions">
 {#each tableSeats as seat}{@const p=gameState?.players.find(p=>p.seat===seat)}{@const pose=location(seat)}
 <section class="tabletop-port" data-tabletop-seat={seat} data-player-seat={p?.id} data-angle={pose.angle} class:occupied={!!p} class:turn={!!p&&gameState?.players[gameState.turn]?.id===p.id&&gameState?.round>0} style={`left:${pose.x}px;top:${pose.y}px;width:480px;height:144px;transform:translate(-50%,-50%) rotate(${pose.angle}deg) scale(${scale})`} aria-label={p?`${p.name} at ${seat}`:`Join at ${seat}`}>
  {#if p}
   <div class="seat-public">
    <button class="seat-angel" class:spent={p.used} aria-label={`${p.name}’s Angel`} onclick={()=>onCard?.(p.id)}><GameCard card={angels.find(a=>a.id===p.angel)??angels[0]} back={!p.angel||(gameState?.phase==='angels'&&!gameState.players.every(p=>p.angel))}/></button>
    <div class="seat-status"><span class="tabletop-name" title={p.name}>{p.name}</span><DivineFavor value={p.favor}/><div class="seat-score"><ScoreSlip value={total(p)+(p.scores.length<(gameState?.round??0)?p.credit:0)}/></div>
     {#if gameState?.phase!=='lobby'&&!p.bot&&(p.local||p.id===gameState?.owner)}<button class="screen-tab" aria-label={`${open.includes(p.id)?'Cover':'Reveal'} ${p.name}’s rack`} aria-expanded={open.includes(p.id)} onclick={()=>reveal(p.id)}>{open.includes(p.id)?'◒ Cover rack':'◓ Reveal rack'}</button>{/if}
    </div>
   </div>
   <div class="seat-rack-area">
   {#if gameState?.phase==='lobby'}<div class="seated-message">{p.bot?'Computer ready':'Ready for the deal'}</div>
   {:else if p.bot||(!p.local&&p.id!==gameState?.owner)}<div class="covered-tiles" aria-label={`${p.name}’s covered rack`}>{#each p.hand.slice(0,14) as id}<span data-tile-back={id}><SoulTile back size={18}/></span>{/each}</div>
   {:else}
    {#if open.includes(p.id)}
     <div class="private-seat" data-private-seat={p.id}>
      {#if gameState?.phase==='angels'&&!p.angel}<div class="seat-choices" aria-label={`Choose ${p.name}’s Angel`}>{#each p.options as angel}<button aria-label={`Choose ${angels.find(a=>a.id===angel)?.name} for ${p.name}`} disabled={busy} onclick={()=>onAngel?.(p.id,angel)}><GameCard card={angels.find(a=>a.id===angel)!}/></button>{/each}</div>
      {:else if station}{@render station(p,pose.angle)}{/if}
     </div>
    {:else}<div class="privacy-cover"><div class="covered-tiles">{#each p.hand.slice(0,14) as id}<span data-tile-back={id}><SoulTile back size={18}/></span>{/each}</div><span>Place a physical screen here before revealing.</span></div>{/if}
   {/if}
   </div>
  {:else if !gameState||gameState.phase==='lobby'}
   {#if joining===seat}<form class="seat-join" onsubmit={e=>{e.preventDefault();join();}}><label for={`name-${seat}`}>Your name</label><input id={`name-${seat}`} bind:value={name} maxlength="40" autocomplete="off" placeholder="An ambitious angel"/><div><button disabled={busy||!name.trim()}>Sit here</button><button type="button" aria-label="Cancel joining" onclick={()=>joining=null}>×</button></div></form>
   {:else}<button class="join-position" disabled={busy||(gameState?.players.length??0)>=5} aria-label={`Join ${seat}`} onclick={()=>{joining=seat;name='';}}><span class="join-halo">✧</span><span>{(gameState?.players.length??0)>=5?'Five Angels seated':'Join here'}</span></button>{#if gameState&&(gameState.players.length<5)&&uid===gameState.owner}<button class="add-computer-seat" disabled={busy} aria-label={`Add computer at ${seat}`} onclick={()=>onJoin(seat,'Computer',true)}>+ Computer</button>{/if}{/if}
  {/if}
 </section>{/each}
</div>
<style>
 .tabletop-ring{position:absolute;inset:0;pointer-events:none;z-index:160}
 .tabletop-port{position:absolute;transform-origin:center;pointer-events:auto;box-sizing:border-box;color:#f9eac5;--favor-size:42px;isolation:isolate}
 .tabletop-port.occupied{display:grid;grid-template-columns:162px minmax(0,1fr);gap:8px;padding:5px;border-radius:12px;background:linear-gradient(#ddc88c0d,#0c241c44);box-shadow:0 1px 0 #dfc78e33}
 .turn{outline:1px solid #f0d38966;box-shadow:0 0 20px #f4db8222!important}
 .seat-public{display:grid;grid-template-columns:88px minmax(0,1fr);align-items:center;gap:7px;min-width:0}
 .seat-angel{width:88px;border:0;background:none;padding:0;min-height:0;filter:drop-shadow(0 3px 4px #0007)}
 .seat-angel.spent{transform:rotate(90deg) scale(.7)}
 .seat-status{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-width:0;height:100%}
 .tabletop-name{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:600 16px 'Cormorant Garamond',serif}
 .seat-score{width:38px;height:25px}
 .screen-tab{width:100%;border:1px solid #bfaa7066;border-radius:8px;background:#e8d7a7;color:#594522;min-height:30px;padding:4px 2px;font-size:10px;line-height:1.15}
 .seat-rack-area{display:flex;align-items:center;justify-content:center;min-width:0;min-height:0;padding-top:24px;position:relative}
 .privacy-cover{width:100%;box-sizing:border-box;border:1px solid #d5b97044;border-radius:7px;padding:8px;background:repeating-linear-gradient(90deg,#ab8a4733 0 1px,transparent 1px 18px),linear-gradient(#2c4735,#193227)}
 .privacy-cover>span{display:block;text-align:center;font-size:11px;line-height:1.3;color:#e4d6b5}
 .covered-tiles{display:flex;justify-content:center;gap:2px;overflow:hidden;height:40px;padding:7px 0;max-width:100%}
 .private-seat{position:relative;width:100%;min-width:0}
 .private-seat :global(.rack){padding:7px 8px;gap:3px;min-height:0;max-height:105px;overflow:auto}
 .private-seat :global(.rack-tools){top:-25px;right:0}
 .private-seat :global(.rack-sort){height:24px}
 .seat-choices{display:flex;justify-content:center;gap:12px}.seat-choices button{width:68px;min-height:0;border:0;background:none;padding:0}.seated-message{text-align:center;margin:0;font:20px 'Cormorant Garamond',serif;color:#dbc99b}.join-position{display:grid;justify-items:center;margin:20px auto 0;background:none;border:0;color:#dac58d;padding:0 20px;min-height:0;font:20px 'Cormorant Garamond',serif}.join-halo{display:grid;place-items:center;width:56px;height:56px;border:1px solid #ddc48a77;border-radius:50%;font:40px Georgia;box-shadow:0 0 24px #efdca011,inset 0 0 20px #efdca011}.join-position:disabled{opacity:.3}.join-position:hover .join-halo{box-shadow:0 0 18px #efda9855}.add-computer-seat{display:block;margin:8px auto;padding:2px 10px;background:none;border:0;color:#c1b17e;min-height:24px;font-size:11px}.seat-join{display:grid;gap:4px;width:240px;margin:0 auto;padding:8px;background:#f4e9ca;border:1px solid #bda164;border-radius:9px;color:#5c4729}.seat-join input{padding:8px;width:100%;box-sizing:border-box;font:16px Georgia;background:#fff9e9;border:1px solid #bda164;border-radius:4px}.seat-join>div{display:flex;gap:8px}.seat-join button{padding:5px 12px;min-height:30px;border:1px solid #bda164;background:#e5d4a5;color:#5c4729}.seat-join label{font:18px 'Cormorant Garamond',serif}
</style>
