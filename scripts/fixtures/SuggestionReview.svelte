<script lang="ts">
 import GameTable from '../../src/lib/components/play/GameTable.svelte';
 import {applyEvent,commandEvent,souls,type State,type Command} from '../../src/lib/engine/engine';
 let s:State|null=null;const act=(actor:string,c:Command)=>s=applyEvent(s,commandEvent(s,actor,c,crypto.randomUUID()));act('you',{type:'create',name:'You',seed:'suggestion'});act('them',{type:'join',name:'Other'});act('you',{type:'start'});for(const p of s!.players)act(p.id,{type:'angel',angel:p.options[0]});
 const state=s!;state.turn=0;state.phase='play';state.decrees=[0];state.players[0].opened=true;state.players[0].hand=['black-a-4','black-a-3','red-a-8'];state.players[1].hand=['red-a-9'];state.heaven=[{id:'low-end',x:100,y:80,tiles:['black-a-5'],zone:null}];const used=new Set([...state.players.flatMap(p=>p.hand),'black-a-5']);state.bag=Object.keys(souls()).filter(id=>!used.has(id));
</script>
<GameTable {state} uid="you" tableId="suggestion-test" send={async()=>{}}/>
