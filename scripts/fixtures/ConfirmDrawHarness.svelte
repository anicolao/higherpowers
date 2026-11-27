<script lang="ts">
 import {onMount} from 'svelte';
 import GameTable from '../../src/lib/components/play/GameTable.svelte';
 import {overlapState} from './overlap-state';
 import {applyEvent,commandEvent,assertInventory,type Command,type Group} from '../../src/lib/engine/engine';
 import type {TableSeat} from '../../src/lib/tabletop/seats';
 const params=new URLSearchParams(location.search),seat=params.get('seat') as TableSeat|null,mode=params.get('mode');
 const initial=overlapState();initial.turn=0;initial.players[0].opened=true;initial.players[0].used=false;initial.players[0].angel='uriel';initial.players[0].sanctuary=false;initial.players[0].hand=['black-a-4','black-a-5','green-a-13'];initial.players[1].hand=['blue-a-13'];initial.players[1].angel='barachiel';initial.players[1].sanctuary=true;initial.heaven[1].zone='computer';initial.heaven[0].x=320;initial.heaven[0].y=100;
 if(mode==='rescue'){initial.players[0].angel='raphael';initial.players[0].used=true;initial.players[0].purgatory='black-a-4';initial.players[0].hand=['green-a-13'];}
 if(seat){initial.tabletop=true;initial.players[0].seat=seat;initial.players[0].name='You';initial.players[1].seat=seat==='north'?'south':'north';}
 const used=new Set([...initial.players.flatMap(p=>[...p.hand,...(p.purgatory?[p.purgatory]:[])]),...initial.heaven.flatMap(g=>g.tiles)]);initial.bag=Object.keys(initial.tiles).filter(id=>!used.has(id));assertInventory(initial);
 let state=$state(initial),events:Command[]=[],draft:Group[]=[];
 async function send(c:Command){state=applyEvent(state,commandEvent(state,'you',c,String(state.revision+1)));events.push(c);}
 onMount(()=>{(window as any).drawReview={state:()=>JSON.parse(JSON.stringify(state)),events:()=>events,draft:()=>draft,update:()=>send({type:'rack',tiles:[...state.players[0].hand].reverse()})};});
</script>
<GameTable {state} uid="you" tabletop={!!seat} tableId="confirm-draw-review" {send} publish={gs=>draft=JSON.parse(JSON.stringify(gs))}/>
