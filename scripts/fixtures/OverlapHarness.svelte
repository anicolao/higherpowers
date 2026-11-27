<script lang="ts">
 import {tick,onMount} from 'svelte';
 import SharedHeaven from '../../src/lib/components/digital/SharedHeaven.svelte';
 import GameTable from '../../src/lib/components/play/GameTable.svelte';
 import {overlapState} from './overlap-state';
 import {trainedCommand,closeBotWorker} from '../../src/lib/engine/trained-worker';
 import {applyEvent,commandEvent,souls,type BotLevel} from '../../src/lib/engine/engine';
 import type {TileGroup} from '../../src/lib/tabletop/rearrangement';
 const params=new URLSearchParams(location.search),mode=params.get('mode')??'tidy',level=(params.get('level')||undefined) as BotLevel|undefined,tabletop=params.has('tabletop'),pool=souls();
 const initial=overlapState(level);if(tabletop){initial.tabletop=true;initial.players[0].seat='north';initial.players[1].seat='south';}
 let state=$state(initial),board=$state<SharedHeaven>(null!);
 const g=(id:string,color:string,x:number,y:number):TileGroup=>({id,x,y,tiles:[1,2,3].map(r=>pool[`${color}-a-${r}`])});
 const initialGroups:TileGroup[]=mode==='manual'?[g('target','red',100,100),g('moving','blue',380,230)]:mode==='tidy'?[g('growing','black',100,100),g('blocker','red',100,100),{...g('third','blue',180,120),slots:[0,3,6]}]:mode==='transpose'?[...['black','red','blue'].map((c,i)=>({...g(c,c,100,80+i*102),zone:'own'})),g('blocker','green',100,320)]:[g('growing','black',100,100),{...g('blocker','red',250,100),zone:'opponent'}];
 onMount(()=>{(window as any).overlap={snapshot:()=>mode==='bot'?state.heaven:board.snapshot(),add:()=>board.addToGroup(pool['black-a-4'],'growing',3),merge:()=>{const b=document.querySelector('.heaven-board')!.getBoundingClientRect();return board.placeTiles([pool['black-a-4']],b.left+252,b.top+131);},automatic:()=>{const b=document.querySelector('.heaven-board')!.getBoundingClientRect();return board.placeTile(pool['black-a-4'],b.left+130,b.top+130);},run:async()=>{const c=await trainedCommand(state,state.players[1]);if(!c)throw Error('No computer command');state=applyEvent(state,commandEvent(state,'computer',c,'browser-overlap'));await tick();},revision:()=>state.revision};return closeBotWorker;});
</script>
{#if mode==='bot'}<GameTable {state} uid="you" {tabletop} tableId="overlap-review" send={async()=>{}}/>{:else}<SharedHeaven bind:this={board} game {initialGroups} boardKey={mode} canTouch={g=>g.zone!=='opponent'}/>{/if}
