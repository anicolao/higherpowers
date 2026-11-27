<script lang="ts">
 import {onMount} from 'svelte';
 import SoulTile from '../digital/SoulTile.svelte';
 import type {Soul} from '$lib/tabletop/rearrangement';
 let {tiles,angle=0,foretell=false,rescue=false,onConfirm,onCancel}:{tiles:Soul[];angle?:number;foretell?:boolean;rescue?:boolean;onConfirm:()=>void;onCancel:()=>void}=$props();
 let dialog:HTMLDialogElement,cancel:HTMLButtonElement,confirm:HTMLButtonElement;
 function trapFocus(event:KeyboardEvent){
  if(event.key!=='Tab')return;
  if(event.shiftKey&&document.activeElement===cancel){event.preventDefault();confirm.focus();}
  else if(!event.shiftKey&&document.activeElement===confirm){event.preventDefault();cancel.focus();}
 }
 onMount(()=>{dialog.showModal();cancel.focus();return()=>dialog.close();});
</script>
<dialog bind:this={dialog} class="confirm-draw" class:sideways={Math.abs(angle%180)===90} style:transform={`rotate(${angle}deg)`} aria-labelledby="confirm-draw-title" aria-describedby="confirm-draw-note" onkeydown={trapFocus} oncancel={event=>{event.preventDefault();onCancel();}}>
 <h2 id="confirm-draw-title">{tiles.length?'Return these tiles to your hand and draw?':'Undo this Organize move and draw?'}</h2>
 {#if tiles.length}<ul class="return-tiles" aria-label="Tiles returning to your hand">{#each tiles as tile(tile.id)}<li data-return-tile={tile.id} aria-label={`${tile.color} ${tile.rank}`}><SoulTile rank={tile.rank} color={tile.color} size={50}/></li>{/each}</ul>{/if}
 <p id="confirm-draw-note">{rescue?'Your Purgatory rescue will also be undone.':'You can finish organizing instead.'}{#if foretell} Foretelling will be used to draw.{/if}</p>
 <div class="choices"><button bind:this={cancel} class="cancel" onclick={onCancel}>Cancel</button><button bind:this={confirm} class="confirm" onclick={onConfirm}>{tiles.length?'Return tiles and draw':'Undo and draw'}</button></div>
</dialog>
<style>
 .confirm-draw{width:min(520px,86vmin);max-height:calc(100dvh - 32px);padding:24px;border:1px solid #b3924d;border-radius:12px;color:#46371f;background:#f6edd6;box-shadow:0 16px 55px #061b17aa,inset 0 0 0 5px #dac79555;overflow:auto;transform-origin:center;box-sizing:border-box}
 .confirm-draw.sideways{max-height:86vmin}
 .confirm-draw::backdrop{background:#09251dd9;backdrop-filter:blur(4px)}h2{margin:0;text-align:center;font:600 clamp(22px,3.8vmin,31px)/1.12 'Cormorant Garamond',Georgia,serif}.return-tiles{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;list-style:none;padding:4px;margin:24px 0 18px;max-height:32vmin;overflow:auto}.return-tiles li{display:block;flex:none}p{font:15px/1.4 'Atkinson Hyperlegible',sans-serif;text-align:center;margin:18px 0 24px}.choices{display:flex;justify-content:center;flex-wrap:wrap;gap:12px}.choices button{min-height:46px;padding:10px 18px;border:1px solid #9b7a3f;border-radius:6px;font:700 15px/1.2 'Atkinson Hyperlegible',sans-serif;cursor:pointer}.cancel{color:#514025;background:#fffaf0}.confirm{color:#fff3d5;background:#254c3d}.choices button:focus-visible{outline:3px solid #9c722e;outline-offset:3px}.cancel:hover{background:#ede0bf}.confirm:hover{background:#163c2f}
</style>
