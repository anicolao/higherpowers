<script lang="ts">
 import {onMount,tick} from 'svelte';
 import {base} from '$app/paths';
 import GameTable from '$lib/components/play/GameTable.svelte';
 import TabletopRing from '$lib/components/play/TabletopRing.svelte';
 import {firebase} from '$lib/backend/firebase';
 import {createGame,resolveTableCode,readGame,watchGame,append,liveChannel,type LiveChannel} from '$lib/backend/repository';
 import {elementPose} from '$lib/tabletop/coordinates';
 import {parseTableCode} from '$lib/backend/codes';
 import {applyEvent,commandEvent,replay,type State,type Command,type GameEvent,type Group} from '$lib/engine/engine';
 import {trainedCommand,closeBotWorker} from '$lib/engine/trained-worker';
 import {botPending,availableBotLevels,defaultBotLevel} from '$lib/engine/trained-bot';
 import type {BotLevel} from '$lib/engine/types';
 let botDifficulty=$state<BotLevel>(defaultBotLevel);
 import type {LiveDraft} from '$lib/backend/live';
 import type {TableSeat} from '$lib/tabletop/seats';
 let gameState=$state<State|null>(null),owner=$state(''),table=$state(''),events=$state<GameEvent[]>([]),busy=$state(false),error=$state(''),connecting=$state(true),focus=$state(''),local=$state(false),liveDraft=$state<LiveDraft|null>(null),menuOpen=$state(false),menuAngle=$state(0),animating=false;
 let off:(()=>void)|undefined,channel:LiveChannel|undefined,timer:ReturnType<typeof setTimeout>|undefined,heartbeat:ReturnType<typeof setInterval>|undefined,disposed=false,latest:{groups:Group[];purgatory:string|null;turn:number;actor:string;revision:number}|null=null;
 const pending=$derived.by(()=>{const s=gameState;return s?.players.filter(p=>!p.bot&&(p.id===owner||p.local)&&(s.phase==='angels'||s.phase==='lobby'&&s.chooseOnJoin?!p.angel:s.phase==='judgment'?!p.ready:s.phase==='dance'?!s.dance?.choices[p.id]:false))??[];});
 const uid=$derived(pending.length?(pending.find(p=>p.id===focus)?.id??pending[0].id):(gameState&&['play','inspect','after-turn'].includes(gameState.phase)&&!gameState.players[gameState.turn].bot&&(gameState.players[gameState.turn].id===owner||gameState.players[gameState.turn].local)?gameState.players[gameState.turn].id:owner));
 function received(next:State,log?:GameEvent[]){if(disposed)return;if(log&&(!gameState||next.revision>=gameState.revision))events=log;if(gameState&&gameState.revision>=next.revision)return;gameState=next;if(!local)void channel?.authorize(next).catch(e=>error=e.message);schedule();}
 function schedule(){
  clearTimeout(timer);if(!gameState||busy||animating||disposed)return;const state=gameState,id=table,p=state.players.find(p=>botPending(state,p));if(!p)return;
  timer=setTimeout(async()=>{try{const c=await trainedCommand(state,p);if(disposed||busy||animating||table!==id||gameState?.revision!==state.revision||gameState.eventIds[0]!==state.eventIds[0])return;if(c)await sendAs(p.id,c);}catch(e){if((e as Error).name!=='AbortError'&&!disposed&&table===id&&gameState?.revision===state.revision&&gameState.eventIds[0]===state.eventIds[0])error=(e as Error).message;}},500);
 }
 async function run(work:()=>Promise<void>){if(busy)return;busy=true;error='';try{await work();}catch(e){error=e instanceof Error?e.message:String(e);}finally{busy=false;schedule();}}
 async function send(c:Command,actor:string){if(!gameState)return;let next:State;
  if(local){const event=commandEvent(gameState,actor,c,crypto.randomUUID());next=applyEvent(gameState,event);events=[...events,event];localStorage.setItem('hp-tabletop-local',JSON.stringify(events));received(next);}
  else{next=await append(table,gameState,actor,c);received(next);}
  if(c.type==='draw'&&next.phase==='inspect'&&next.inspection?.tiles.length===1){await tick();await send({type:'keep',tile:next.inspection.tiles[0],turn:next.turnNumber},actor);}
 }
 let autoKeep='';
 $effect(()=>{const s=gameState;if(!s||busy||connecting||s.phase!=='inspect'||s.inspection?.tiles.length!==1)return;const key=`${s.revision}/${s.inspection.player}`;if(autoKeep===key)return;autoKeep=key;void sendAs(s.inspection.player,{type:'keep',tile:s.inspection.tiles[0],turn:s.turnNumber});});
 async function sendAs(actor:string,c:Command){await run(()=>send(c,actor));}
 async function connect(id:string){off?.();channel?.close();table=await resolveTableCode(id);const restored=await readGame(table);if(!restored.tabletop)throw new Error('This is a personal-screen table. Open it in Play.');if(restored.owner!==owner)throw new Error('Open this shared table on the browser that created it. Use Play to join from another device.');received(restored);off=await watchGame(table,received,e=>error=e.message);channel=await liveChannel(table,d=>liveDraft=d,e=>error=e.message);await channel.authorize(restored);localStorage.setItem('hp-tabletop',table);history.replaceState(null,'',`${base}/tabletop?table=${table}`);}
 function join(seat:TableSeat,name:string,bot:boolean){void run(async()=>{
  if(!gameState){if(local){owner='tabletop-owner';const event=commandEvent(null,owner,{type:'create',name,seed:crypto.randomUUID(),seat,chooseOnJoin:true},crypto.randomUUID());events=[event];localStorage.setItem('hp-tabletop-local',JSON.stringify(events));received(applyEvent(null,event));}else{owner=(await firebase()).uid;await connect(await createGame(name,seat,true));}}
  else await send(bot?{type:'bot',id:`bot-${crypto.randomUUID().slice(0,8)}`,name,seat,difficulty:botDifficulty}:{type:'seat',id:`seat-${crypto.randomUUID().slice(0,8)}`,name,seat},owner);
 });}
 function publish(groups:Group[],dragging:boolean,purgatory:string|null){if(!gameState)return;latest={groups,purgatory,actor:uid,turn:gameState.turnNumber,revision:gameState.revision};if(!local)channel?.publish({version:1,...latest,dragging});}
 function animationChanged(active:boolean){animating=active;if(active)clearTimeout(timer);else schedule();}
 async function saveReplay(){const blob=new Blob([JSON.stringify({game:'higher-powers',version:1,events},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`higher-powers-tabletop-${table||'local'}.json`;a.click();URL.revokeObjectURL(url);}
 async function fullscreen(){if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
 function openMenu(event:MouseEvent){menuAngle=Math.round(elementPose(event.currentTarget as HTMLElement).angle/90)*90;menuOpen=true;}
 function mountMenu(node:HTMLDialogElement){node.showModal();}
 function newTable(){menuOpen=false;off?.();channel?.close();clearTimeout(timer);gameState=null;events=[];table='';latest=null;focus='';liveDraft=null;localStorage.removeItem(local?'hp-tabletop-local':'hp-tabletop');history.replaceState(null,'',`${base}/tabletop${local?'?local=1':''}`);}
 onMount(()=>{const params=new URL(location.href).searchParams;local=params.get('local')==='1';void(async()=>{try{
  if(local){const saved=localStorage.getItem('hp-tabletop-local');owner='tabletop-owner';if(saved){events=JSON.parse(saved);received(replay(events));}}
  else{owner=(await firebase()).uid;const id=params.get('table')??localStorage.getItem('hp-tabletop');if(id)await connect(parseTableCode(id));}
 }catch(e){error=e instanceof Error?e.message:String(e);}finally{connecting=false;}})();heartbeat=setInterval(()=>{if(!local&&gameState&&latest&&latest.turn===gameState.turnNumber&&latest.revision===gameState.revision)channel?.publish({version:1,...latest,dragging:false});},10000);return()=>{disposed=true;closeBotWorker();off?.();channel?.close();clearTimeout(timer);clearInterval(heartbeat);};});
</script>
<svelte:head><title>Shared tabletop · Higher Powers</title><meta name="description" content="Play Higher Powers around one shared touchscreen. Eight join positions, two to five Angels, and racks revealed behind physical screens."/></svelte:head>
{#snippet utilities()}<button class="tabletop-menu-trigger" aria-label="Tabletop menu" title="Tabletop menu" aria-haspopup="dialog" onclick={openMenu}>✧</button>{/snippet}
{#if menuOpen}<dialog class="tabletop-menu" aria-label="Tabletop menu" style:transform={`rotate(${menuAngle}deg)`} use:mountMenu onclose={()=>menuOpen=false} oncancel={()=>menuOpen=false}><button class="menu-close" aria-label="Close tabletop menu" onclick={()=>menuOpen=false}>×</button><strong>{local?'Local tabletop':table}</strong><nav><label>New computers<select aria-label="Tabletop computer difficulty" bind:value={botDifficulty}>{#each availableBotLevels as level}<option value={level}>{level[0].toUpperCase()+level.slice(1)}</option>{/each}</select></label><button onclick={()=>void fullscreen()}>Fullscreen</button><button onclick={()=>void saveReplay()}>Save replay</button><a href={`${base}/rules.html`} target="_blank" rel="noreferrer">Rulebook ↗</a><button onclick={newTable}>New tabletop</button><a href={`${base}/play`}>Personal screens</a><button onclick={()=>window.close()}>Exit</button></nav></dialog>{/if}
<main id="main" class="tabletop-page">
 {#if connecting}<div class="tabletop-welcome">Opening the table…</div>
 {:else if gameState}<GameTable state={gameState} {uid} {busy} {events} tabletop tableId={table||'tabletop-local'} send={c=>sendAs(c.type==='start'||c.type==='next-round'?owner:uid,c)} {sendAs} onJoin={join} onFocus={id=>focus=id} {liveDraft} {publish} onAnimating={animationChanged} {utilities}/>
 {:else}<TabletopRing onJoin={join} {busy}/><div class="tabletop-welcome"><p>Higher <em>Powers</em></p><span>Join from any edge · 2–5 Angels</span><small>Place a physical screen before revealing your rack.</small><a href={`${base}/play`}>Personal screens ↗</a></div>{/if}
 {#if error}<div class="tabletop-error" role="alert">{error}<button aria-label="Dismiss error" onclick={()=>error=''}>×</button>{#if !gameState}<button onclick={newTable}>Start a new table</button>{/if}</div>{/if}
</main>
<style>
 :global(body:has(.tabletop-page) .site-header),:global(body:has(.tabletop-page) .site-footer){display:none}.tabletop-page{position:fixed;inset:0;overflow:hidden;background:radial-gradient(ellipse at 40% 40%,#466257,#29483c 68%,#1c382f);touch-action:manipulation}.tabletop-welcome{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:grid;justify-items:center;gap:10px;text-align:center;color:#e4d3a7;pointer-events:none;max-width:40vw}.tabletop-welcome p{font:600 clamp(28px,4vw,58px) 'Cormorant Garamond',serif;margin:0}.tabletop-welcome span{font:22px 'Cormorant Garamond',serif}.tabletop-welcome small{font-size:12px;max-width:28ch}.tabletop-welcome a{font-size:12px;color:#c7b886;pointer-events:auto}.tabletop-menu-trigger{display:block;border:0;min-height:0;padding:0;width:40px;height:36px;background:none;color:#ebd7a3;font:30px Georgia;cursor:pointer}.tabletop-menu{position:fixed;inset:0;margin:auto;width:300px;max-width:calc(100vmin - 24px);max-height:calc(100vmin - 24px);overflow:auto;padding:30px 20px 20px;background:#f2e6c6;border:1px solid #bda464;border-radius:12px;box-shadow:0 12px 50px #0008;color:#594527;transform-origin:center}.tabletop-menu::backdrop{background:#0b211baa;backdrop-filter:blur(4px)}.tabletop-menu nav{display:grid;gap:5px;margin-top:12px}.tabletop-menu strong{font:700 20px monospace;letter-spacing:.05em}.tabletop-menu nav button,.tabletop-menu nav a{display:block;background:none;color:#594527;border:1px solid #bda46455;text-align:left;min-height:36px;font-size:14px;padding:8px;text-decoration:none;border-radius:5px}.tabletop-menu .menu-close{position:absolute;right:7px;top:5px;width:26px;height:26px;min-height:0;padding:0;background:none;border:0;color:#594527;font:26px Georgia}.tabletop-error{position:fixed;left:50%;top:45%;transform:translate(-50%,-50%);background:#f5dfc2;color:#764534;padding:16px;border:1px solid #b78c53;border-radius:8px;max-width:60vw;z-index:900}.tabletop-error button{margin-left:8px;min-height:28px;padding:3px 8px}
</style>
