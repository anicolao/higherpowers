<script lang="ts">
 import type {Snippet} from 'svelte';
 import {tick,untrack,onDestroy} from 'svelte';
 import {base} from '$app/paths';
 import SharedHeaven from '../digital/SharedHeaven.svelte';
 import SoulTile from '../digital/SoulTile.svelte';
 import DivineFavor from '../digital/DivineFavor.svelte';
 import GameCard from '../GameCard.svelte';
 import Rack from './Rack.svelte';
 import PlayerSeat from './PlayerSeat.svelte';
 import TabletopRing from './TabletopRing.svelte';
 import {elementPose} from '$lib/tabletop/coordinates';
 import {seatPose,type TableSeat} from '$lib/tabletop/seats';
 import type {Player} from '$lib/engine/types';
 import SoulBag from './SoulBag.svelte';
 import ScoreSlip from './ScoreSlip.svelte';
 import GameLog from './GameLog.svelte';
 import TableMotions,{type Flight} from './TableMotions.svelte';
 import {tileTransfers,type TilePlace} from '$lib/engine/presentation';
 import SacredRegion from '../digital/SacredRegion.svelte';
 import InkNumeral from '../digital/InkNumeral.svelte';
 import {angels,decrees,judgments,type Card} from '$lib/data/game';
 import {arrangeDraftGroup,repairInsertion} from '$lib/engine/arrangement';
 import {availableBotLevels,defaultBotLevel} from '$lib/engine/trained-bot';
 import type {BotLevel} from '$lib/engine/types';
 let botDifficulty=$state<BotLevel>(defaultBotLevel);
 import {normalizeDraftGroup} from '$lib/engine/draft';
 import {sanctuaryFrame,sanctuaryStep,sameSanctuary,type SanctuaryFrame} from '$lib/engine/sanctuary';
 import {formation,inspectFormation} from '$lib/engine/formations';
 import {decree,allowance,total,tryCommand,type State,type Group,type Command,type OrganizingPower,type GameEvent} from '$lib/engine/engine';
 import type {TileGroup,Soul,SoulSpec,Repair} from '$lib/tabletop/rearrangement';
 import {acceptsDraft,type LiveDraft} from '$lib/backend/live';
 let {state:gameState,uid,tabletop=false,sendAs,onJoin,onFocus,busy=false,send,liveDraft=null,publish,tableId,events=[],animateMoves=true,onAnimating,utilities,invitation}:{state:State;uid:string;tabletop?:boolean;sendAs?:(actor:string,c:Command)=>Promise<void>;onJoin?:(seat:TableSeat,name:string,bot:boolean)=>void;onFocus?:(id:string)=>void;busy?:boolean;send:(command:Command)=>Promise<void>;liveDraft?:LiveDraft|null;publish?:(groups:Group[],dragging:boolean,purgatory:string|null)=>void;tableId:string;events?:GameEvent[];animateMoves?:boolean;onAnimating?:(active:boolean)=>void;utilities?:Snippet;invitation?:Snippet}=$props();
 let sanctuarySteps=$state<SanctuaryFrame[]>([]);
 let board=$state<SharedHeaven>(null!);let draft=$state<Group[]>([]),opening=$state<string[]|undefined>(),stage=$state<Group[]|undefined>(),power=$state<OrganizingPower|undefined>(),selected=$state<string[]>([]),rackOrder=$state<string[]>([]),target=$state(''),rank=$state(1),count=$state(1),giftOpen=$state(false),giftGroup=$state(''),giftTiles=$state<string[]>([]),communionTile=$state<string|undefined>(),focusedCard=$state<Card|null>(null),zoneMode=$state(false),message=$state('');
 const me=$derived(gameState.players.find(p=>p.id===uid)!);
 const active=$derived(gameState.players[gameState.turn]);
 const myTurn=$derived(active?.id===uid&&gameState.phase==='play');
 let uncovered=$state<string[]>([]),turning=$state(false),motionPending=$state(false);
 const privateVisible=$derived(!tabletop||uncovered.includes(uid));
 const editable=$derived(myTurn&&!busy&&privateVisible&&!turning&&(!tabletop||!motionPending));
 const zealAvailable=$derived(active?.id===uid&&gameState.phase==='after-turn'&&me.angel==='jegudiel'&&!me.used&&!busy&&privateVisible);
 let zealStart:Promise<void>|null=null,rackPreviewSequence=0;
 function startZeal(){if(zealStart)return zealStart;if(!zealAvailable)return Promise.resolve();zealStart=(async()=>{await action({type:'continue',zeal:true,turn:gameState.turnNumber});await tick();})().finally(()=>zealStart=null);return zealStart;}
 const currentDecree=$derived(decree(gameState));
 const card=$derived(gameState.round===3?judgments[gameState.judgment-1]:decrees[currentDecree-1]);
 const angel=$derived(angels.find(a=>a.id===me?.angel));
 const remote=$derived(!myTurn&&acceptsDraft(gameState,liveDraft)?liveDraft:null);
 const committedKey=$derived(`${gameState.turnNumber}/${gameState.phase}/${tabletop?uid:''}/${JSON.stringify(gameState.heaven)}`);
 let previousKey='';let screenWidth=$state(1280),screenHeight=$state(900);let controlsHost=$state<HTMLElement|null>(null);
 const portrait=$derived(screenHeight>=screenWidth);const bottomStrip=$derived(portrait?Math.min(320,screenHeight*.38):Math.min(200,Math.max(150,screenHeight*.29)));const opponentScale=$derived(Math.min(1,(Math.min(240,Math.max(190,screenWidth*.2))-20)/195));
 const edgeDepth=$derived(Math.min(160,Math.max(110,Math.min(screenWidth,screenHeight)*.17)));
 const squareHeaven=$derived(tabletop&&gameState.players.some(p=>p.seat==='east'||p.seat==='west'));
 const tableWidth=$derived(Math.max(80,screenWidth-(gameState.round>0&&!squareHeaven&&!portrait?24:2*edgeDepth))),tableHeight=$derived(Math.max(80,screenHeight-(gameState.round>0&&!squareHeaven&&portrait?24:2*edgeDepth)));
 const heavenWidth=$derived(squareHeaven?Math.min(tableWidth,tableHeight):portrait?tableHeight:tableWidth);
 const heavenHeight=$derived(squareHeaven?Math.min(tableWidth,tableHeight):portrait?tableWidth:tableHeight);
 const facing=$derived((gameState.round>0?active:gameState.players.find(p=>p.id===gameState.owner))?.seat);
 const targetAngle=$derived(tabletop&&facing?seatPose(facing,portrait).angle:0);
 let tableAngle=$state(0),turnTimer:ReturnType<typeof setTimeout>|undefined,playArea:HTMLDivElement;let turnAnimation:Animation|undefined;
 $effect(()=>{const target=targetAngle;if(tabletop&&motionPending)return;untrack(()=>{
  const start=playArea?elementPose(playArea).angle:tableAngle,delta=(((target-start+540)%360+360)%360)-180;if(Math.abs(delta)<.01)return;
  clearTimeout(turnTimer);turnAnimation?.cancel();tableAngle=start+delta;turning=!document.hidden&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(turning){
   const frames=Array.from({length:25},(_,i)=>{const angle=start+delta*i/24,radians=angle*Math.PI/180,cos=Math.abs(Math.cos(radians)),sin=Math.abs(Math.sin(radians));const fit=Math.min(1,tableWidth/(cos*heavenWidth+sin*heavenHeight),tableHeight/(sin*heavenWidth+cos*heavenHeight));return {transform:`translate(-50%,-50%) rotate(${angle}deg) scale(${fit*(i>0&&i<24?.995:1)})`};});
   turnAnimation=playArea?.animate(frames,{duration:650,easing:'cubic-bezier(.25,.65,.25,1)'});onAnimating?.(true);turnTimer=setTimeout(()=>{turning=false;onAnimating?.(motionBatches.size>0);},680);
  }
 });});

 $effect(()=>{const key=committedKey;if(key!==previousKey)untrack(()=>{draft=JSON.parse(JSON.stringify(gameState.heaven));sanctuarySteps=[];opening=undefined;power=undefined;stage=undefined;communionTile=undefined;selected=[];giftTiles=[];giftOpen=false;zoneMode=false;message='';previousKey=key;});});
 const initial=$derived((remote?.groups??gameState.heaven).map(toView));
 const boardKey=$derived(`${committedKey}/${remote?`${remote.session}/${remote.sequence}`:'committed'}`);
 $effect(()=>{const revision=gameState.revision;if(myTurn)untrack(()=>publish?.(board?.hasPreview()?board.previewSnapshot().map(fromView):draft,false,draftPurgatory()));});
 const onTable=$derived(new Set(draft.flatMap(g=>g.tiles)));
 const remaining=$derived(me?me.hand.filter(id=>!onTable.has(id)&&!(power?.kind==='penance'&&power.tile===id)):[]);
 const availableRackIds=$derived([...remaining,...(power?.kind==='forgive'&&!onTable.has(power.tile)&&!remaining.includes(power.tile)?[power.tile]:[]),...(power?.kind==='transfigure'?power.tiles.filter(id=>!remaining.includes(id)):[])]);
 const rackIds=$derived([...rackOrder.filter(id=>availableRackIds.includes(id)),...availableRackIds.filter(id=>!rackOrder.includes(id))]);
 const rackTiles=$derived(rackIds.map(id=>gameState.tiles[id]));
 const playableRack=$derived(rackTiles.filter(t=>power?.kind!=='transfigure'||!power.tiles.includes(t.id)));
 const organizing=$derived.by(()=>{const c:Command={type:'organize',groups:draft,turn:gameState.turnNumber,...(opening?{opening}:{}),...(power?{power}:{}),...(stage?{stage}:{}),...(communionTile?{communionTile}:{}),...(sanctuarySteps.length&&power?.kind!=='sanctuary'?{sanctuary:sanctuarySteps}:{})};return {command:c,error:tryCommand(gameState,uid,c)};});
 const giftName=$derived(angel?.title??'Gift');
 function toView(g:Group):TileGroup{return {...g,tiles:g.tiles.map(id=>gameState.tiles[id]).filter(Boolean)};}
 function fromView(g:TileGroup):Group{return {id:g.id,x:g.x,y:g.y,tiles:g.tiles.map(t=>t.id),zone:g.zone??null,...(g.slots?{slots:g.slots}:{}),...(g.jokerFaces?{jokerFaces:g.jokerFaces}:{})};}
 function allowed(g:TileGroup){return editable&&(g.zone==null||g.zone===uid)&&(me.opened||!!opening||g.tiles.every(t=>me.hand.includes(t.id)));}
 function draftPurgatory(){return power?.kind==='penance'?power.tile:me.purgatory&&!draft.some(g=>g.tiles.includes(me.purgatory!))?me.purgatory:null;}
 function sanctuaryWitness(next:SanctuaryFrame):SanctuaryFrame[]|null{
  const original=sanctuaryFrame(gameState.heaven,uid),frames=[original,...sanctuarySteps],kind=me.angel==='selaphiel'?'choir':'procession';
  // A draft can undo a release. Reuse the shortest earlier legal arrangement;
  // only a committed empty region closes Sanctuary for the round.
  const from=frames.findIndex(frame=>sanctuaryStep(frame,next,gameState.tiles,currentDecree,kind));
  if(from<0)return null;
  return [...sanctuarySteps.slice(0,from),...(sameSanctuary(frames[from],next)?[]:[next])];
 }
 function rememberSanctuary(){
  const next=sanctuaryFrame(draft,uid),previous=sanctuarySteps.at(-1)??sanctuaryFrame(gameState.heaven,uid);
  if(!next.length||sameSanctuary(previous,next))return;
  const witness=sanctuaryWitness(next);if(witness)sanctuarySteps=witness;
 }
 function changed(gs:TileGroup[],dragging:boolean){if(!myTurn)return;draft=gs.map(fromView);if(!dragging&&me.sanctuary&&!power)rememberSanctuary();if(!me.opened&&opening){const placed=new Set(draft.flatMap(g=>g.tiles));if(power?.kind==='forgive'||power?.kind==='penance')placed.add(power.tile);if(power?.kind==='transfigure')power.tiles.forEach(id=>placed.add(id));if(opening.some(id=>!placed.has(id)))opening=undefined;}if(!me.opened&&!opening){const first=draft.find(g=>g.tiles.every(id=>me.hand.includes(id))&&formation(g.tiles.map(id=>gameState.tiles[id]),currentDecree));if(first)opening=[...first.tiles];}publish?.(draft,dragging,draftPurgatory());}
 function toggle(id:string){selected=selected.includes(id)?selected.filter(t=>t!==id):[...selected,id];}
 async function action(c:Command){await send(c);selected=[];giftOpen=false;}
 async function addMany(tiles:Soul[],x:number,y:number,anchorIndex=0){
  const area=document.querySelector('.play-viewport')?.getBoundingClientRect();if((zealAvailable||zealStart)&&area&&x>=area.left&&x<=area.right&&y>=area.top&&y<=area.bottom)await startZeal();
  if(!editable)return false;const bag=document.querySelector('[data-soul-bag]')?.getBoundingClientRect();
  if(giftOpen&&me.angel==='raguel'&&bag&&x>=bag.left&&x<=bag.right&&y>=bag.top&&y<=bag.bottom){selected=[...new Set([...selected,...tiles.map(t=>t.id)])];void useBefore();return true;}
  const retrieved=power?.kind==='transfigure'?power.tiles:[];if(tiles.some(t=>retrieved.includes(t.id))){message='Keep the two retrieved souls in your hand.';return false;}
  const arranged=arrangeDraftGroup({id:'opening',x:0,y:0,tiles},currentDecree);const previousOpening=opening;if(!me.opened&&!opening&&tiles.every(t=>me.hand.includes(t.id))&&formation(arranged.tiles,currentDecree,arranged.jokerFaces))opening=arranged.tiles.map(t=>t.id);const placed=board.placeTiles(tiles,x,y,anchorIndex);if(placed)selected=[];else opening=previousOpening;return placed;
 }
 async function placeSelected(x:number,y:number){const tiles=rackTiles.filter(t=>selected.includes(t.id));if(!tiles.length)return;if(!await addMany(tiles,x,y))blockedDrop();}
 function previewRack(tiles:Soul[]|null,x:number,y:number,anchorIndex:number){const sequence=++rackPreviewSequence;
  if(tiles&&(zealAvailable||zealStart)){const area=document.querySelector('.play-viewport')?.getBoundingClientRect();if(area&&x>=area.left&&x<=area.right&&y>=area.top&&y<=area.bottom)void startZeal().then(()=>{if(sequence===rackPreviewSequence&&editable)previewRack(tiles,x,y,anchorIndex);});return;}
  if(!tiles||!editable){board.clearTilePreview();if(editable)publish?.(draft,false,draftPurgatory());return;}
  const arranged=arrangeDraftGroup({id:'opening-preview',x:0,y:0,tiles},currentDecree);board.previewTiles(tiles,x,y,anchorIndex,!me.opened&&!opening&&tiles.every(t=>me.hand.includes(t.id))&&!!formation(arranged.tiles,currentDecree,arranged.jokerFaces));publish?.(board.previewSnapshot().map(fromView),true,draftPurgatory());
 }
 function blockedDrop(){if(busy){message='Wait for this move to finish.';return;}message=active?.id!==uid?'Wait for your turn to play into Heaven.':gameState.phase==='inspect'?'Choose a soul from the bag first.':'Finish the current choice before playing into Heaven.';}

 function reorder(ids:string[]){rackOrder=ids;if(remaining.length===me.hand.length&&gameState.phase!=='lobby')void send({type:'rack',tiles:ids.filter(id=>me.hand.includes(id))});}
 function suggestion(spec:SoulSpec,groupId:string,repair:Repair){const tile=playableRack.find(t=>t.rank===spec.rank&&t.color===spec.color)??playableRack.find(t=>t.rank==='joker');const group=draft.find(g=>g.id===groupId);if(!tile||!group||!editable)return;board.addToGroup(tile,groupId,repairInsertion(group.tiles.map(id=>gameState.tiles[id]),spec,repair,currentDecree));}

 function cancelDraft(){draft=JSON.parse(JSON.stringify(gameState.heaven));sanctuarySteps=[];opening=undefined;power=undefined;stage=undefined;communionTile=undefined;selected=[];giftTiles=[];boardReset++;publish?.(draft,false,draftPurgatory());}
 let boardReset=$state(0);
 function chooseGiftTile(id:string){giftTiles=giftTiles.includes(id)?giftTiles.filter(t=>t!==id):[...giftTiles,id];}
 function planGift(){if(!me.angel)return;stage=JSON.parse(JSON.stringify(draft));const kind=me.angel;
  if(kind==='zadkiel'||kind==='raphael'){if(giftTiles.length!==1){message='Choose one soul in Heaven.';return;}const id=giftTiles[0];if(board.removeTile(id))power={kind:kind==='zadkiel'?'forgive':'penance',tile:id};}
  else if(kind==='jophiel'){if(giftTiles.length!==2){message='Choose exactly two souls in Heaven.';return;}for(const id of giftTiles)board.removeTile(id);power={kind:'transfigure',tiles:[...giftTiles]};}
  else if(kind==='selaphiel'||kind==='barachiel'){if(!giftGroup){message='Choose a complete formation.';return;}if(board.shelter(giftGroup,uid))power={kind:'sanctuary',group:giftGroup};}
  giftOpen=false;
 }
 async function useBefore(){const returned=[...selected];cancelDraft();const map:Record<string,'judgment'|'dance'|'calling'|'banish'>={raguel:'judgment',haniel:'dance',gabriel:'calling',michael:'banish'};await action({type:'before',power:map[me.angel!],rank:Number(rank),target,tiles:returned,count:Number(count),turn:gameState.turnNumber});}

 let flights=$state<Flight[]>([]),motionTiles=$state<string[]>([]);let priorScene:State|null=null,motionSequence=0;const motionBatches=new Map<number,{ids:string[];timer?:ReturnType<typeof setTimeout>;favor?:string[]}>();
 function refreshMotionTiles(){motionPending=motionBatches.size>0;motionTiles=[...new Set([...motionBatches.values()].flatMap(batch=>batch.ids))];}
 let motionDisposed=false;
 function pulseFavor(players:string[]=[]){
  for(const id of players)for(const node of document.querySelectorAll(!tabletop&&id===uid?'.own-favor .favor-coin':`[data-player-seat="${id}"] .favor-coin`))node.animate([{transform:'scale(1)'},{transform:'scale(1.1)'},{transform:'scale(1)'}],{duration:380});
 }
 function finishFlight(key:string){
  if(motionDisposed)return;
  const flight=flights.find(f=>f.key===key);if(!flight)return;
  flights=flights.filter(f=>f.key!==key);
  const sequence=Number(key.split('-')[0]),batch=motionBatches.get(sequence);
  if(batch){batch.ids=batch.ids.filter(id=>id!==flight.tile.id);if(!batch.ids.length){clearTimeout(batch.timer);motionBatches.delete(sequence);pulseFavor(batch.favor);}}
  refreshMotionTiles();onAnimating?.(motionBatches.size>0||turning);
 }
 function clearMotions(){
  for(const batch of motionBatches.values())clearTimeout(batch.timer);
  motionBatches.clear();flights=[];clearTimeout(turnTimer);turnAnimation?.cancel();turning=false;refreshMotionTiles();onAnimating?.(false);
 }
 type Box={x:number;y:number;width:number;height:number;angle?:number};
 function renderedTiles(includeFlights=false){const boxes=new Map<string,Box>();for(const selector of ['[data-tile-back]','[data-rack-tile]','[data-purgatory-tile]','[data-tile-id]',...(includeFlights?['[data-flight-id]']:[])])for(const node of document.querySelectorAll<HTMLElement>(selector)){const id=node.dataset.tileBack??node.dataset.rackTile??node.dataset.purgatoryTile??node.dataset.tileId??node.dataset.flightId;if(id){const p=elementPose(node);boxes.set(id,{x:p.x,y:p.y,width:p.width*p.scale,height:p.height*p.scale,angle:p.angle});}}return boxes;}
 function bagBox():Box|null{const b=document.querySelector('[data-soul-bag]')?.getBoundingClientRect();return b?{x:b.x+b.width/2-22,y:b.y+b.height*.6-31,width:44,height:63}:null;}
 function tablePositions(s:State){return new Map(s.heaven.flatMap(g=>g.tiles.map((id,i)=>[id,{x:g.x+(g.slots?.[i]??i)*47,y:g.y}] as const)));}
 $effect.pre(()=>{const next=gameState;untrack(()=>{
  const before=priorScene;priorScene=JSON.parse(JSON.stringify(next));if(!before||next.revision<=before.revision||!animateMoves)return;
  const dealt=before.round!==next.round,computer=before.players[before.turn]?.bot,passed=before.phase==='dance'&&next.phase!=='dance',automaticKeep=before.phase==='inspect'&&before.inspection?.tiles.length===1&&next.phase!=='inspect';if(!tabletop&&!dealt&&!computer&&!passed&&!automaticKeep)return;
  const transfers=tileTransfers(before,next).filter(t=>(!dealt||t.to.kind==='hand')&&(!tabletop||t.to.kind!=='heaven'||!document.querySelector(`[data-tile-id="${t.id}"]`))),oldPositions=tablePositions(before),newPositions=tablePositions(next);
  if(tabletop&&!transfers.length&&JSON.stringify(before.heaven)===JSON.stringify(next.heaven))return;
  const shifted=[...newPositions.keys()].filter(id=>oldPositions.has(id));
  if(!transfers.length&&!shifted.length)return;
  if(document.hidden||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const source=renderedTiles(true),bag=bagBox(),sequence=++motionSequence;motionBatches.set(sequence,{ids:[...new Set([...transfers.map(t=>t.id),...shifted])],favor:next.players.filter(p=>p.favor!==(before.players.find(old=>old.id===p.id)?.favor??0)).map(p=>p.id)});refreshMotionTiles();onAnimating?.(true);
  void tick().then(async()=>{
   if(!motionBatches.has(sequence))return;

   const destination=renderedTiles(),toBag=bagBox()??bag;
   const staged=[...transfers,...shifted.map(id=>({id,from:{kind:'heaven'} as TilePlace,to:{kind:'heaven'} as TilePlace}))];
   const planned:Flight[]=staged.flatMap((move,i)=>{
    const from=dealt?(bag??toBag):move.from.kind==='bag'?bag:source.get(move.id)??bag,to=move.to.kind==='bag'?toBag:destination.get(move.id);if(!from||!to)return [];if(!dealt&&Math.abs(from.x-to.x)+Math.abs(from.y-to.y)+Math.abs(from.width-to.width)+Math.abs((from.angle??0)-(to.angle??0))<1)return [];
    return [{key:`${sequence}-${i}-${move.id}`,tile:next.tiles[move.id],back:move.to.kind==='bag'||tabletop&&move.to.kind==='hand'||move.to.kind==='hand'&&move.to.owner!==uid,from,to,delay:dealt?i*12:move.from.kind==='heaven'?0:i*55}];
   });
   const replacing=new Set(planned.map(f=>f.tile.id));for(const old of flights){if(replacing.has(old.tile.id))continue;const to=destination.get(old.tile.id),from=source.get(old.tile.id);if(to&&from&&Math.abs(old.to.x-to.x)+Math.abs(old.to.y-to.y)+Math.abs(old.to.width-to.width)>1){planned.push({...old,key:`${sequence}-continued-${old.tile.id}`,from,to,delay:0});replacing.add(old.tile.id);}}
   for(const [id,batch]of motionBatches)if(id!==sequence){batch.ids=batch.ids.filter(id=>!replacing.has(id));if(!batch.ids.length){clearTimeout(batch.timer);motionBatches.delete(id);}}motionBatches.get(sequence)!.ids=planned.map(f=>f.tile.id);flights=[...flights.filter(f=>!replacing.has(f.tile.id)),...planned];refreshMotionTiles();
   if(!planned.length){motionBatches.delete(sequence);refreshMotionTiles();onAnimating?.(motionBatches.size>0||turning);return;}
   motionBatches.get(sequence)!.timer=setTimeout(()=>{const batch=motionBatches.get(sequence);if(!batch)return;motionBatches.delete(sequence);flights=flights.filter(f=>!f.key.startsWith(`${sequence}-`));refreshMotionTiles();pulseFavor(batch.favor);onAnimating?.(motionBatches.size>0||turning);},640+Math.max(...planned.map(m=>m.delay)));
  }).catch(()=>{motionBatches.delete(sequence);flights=flights.filter(f=>!f.key.startsWith(`${sequence}-`));refreshMotionTiles();onAnimating?.(motionBatches.size>0||turning);});
 });});
 onDestroy(()=>{motionDisposed=true;clearTimeout(turnTimer);turnAnimation?.cancel();for(const batch of motionBatches.values())clearTimeout(batch.timer);motionBatches.clear();onAnimating?.(false);});

 const opponents=$derived.by(()=>{const seat=gameState.players.findIndex(p=>p.id===uid);return Array.from({length:gameState.players.length-1},(_,i)=>gameState.players[(seat+i+1)%gameState.players.length]);});
 const targeting=$derived(giftOpen&&['chamuel','michael'].includes(me.angel!)||gameState.phase==='judgment'&&gameState.judgment===2&&!me.ready);
 const canFinish=$derived(editable&&!organizing.error);
 const cue=$derived.by(()=>{if(message)return message;if(zealAvailable)return 'Play again to use Zeal, or end your turn to save it.';if(gameState.phase==='judgment'&&!me.ready)return gameState.judgment===2?'Choose another Angel.':'Set aside up to five souls, then touch the Judgment card.';if(gameState.phase==='dance'&&!gameState.dance?.choices[uid])return `Choose ${gameState.dance?.count} souls to pass to the right.`;if(zoneMode)return 'Touch a protected formation to release it, or return its released tiles.';if(!giftOpen)return '';if(['zadkiel','raphael','jophiel'].includes(me.angel!))return `Touch ${me.angel==='jophiel'?'two unprotected souls':'an unprotected soul'} in Heaven.`;if(['selaphiel','barachiel'].includes(me.angel!))return 'Touch a complete formation to shelter it.';if(me.angel==='chamuel')return 'Choose another Angel to look at their rack.';if(me.angel==='michael')return 'Choose a rank on your rack, then another Angel.';if(me.angel==='raguel')return 'Choose souls on your rack, then return them to the bag.';return '';});
 $effect(()=>{if(message){const timer=setTimeout(()=>message='',5500);return()=>clearTimeout(timer);}});
 async function finish(){if(busy||active?.id!==uid||!privateVisible||turning)return;if(gameState.phase==='after-turn'){await action({type:'continue',turn:gameState.turnNumber});return;}if(organizing.error){message=organizing.error;return;}await action(organizing.command);}
 async function drawFromBag(){if(zealAvailable||zealStart)await startZeal();if(!myTurn||busy||tabletop&&(motionPending||turning))return;if(giftOpen&&me.angel==='raguel'){if(!selected.length){message='Choose the souls to return first.';return;}await useBefore();return;}await action({type:'draw',turn:gameState.turnNumber});}
 function selectRack(id:string){if(gameState.phase==='judgment'&&gameState.judgment===3&&gameState.tiles[id].rank==='joker'){message='Scales takes numbered souls.';return;}if(giftOpen&&me.angel==='michael'){const r=gameState.tiles[id].rank;if(r==='joker'){message='Choose a numbered soul.';return;}rank=r;selected=me.hand.filter(t=>gameState.tiles[t].rank===r);return;}toggle(id);}
 async function activateAngel(){if(busy)return;message='';if(gameState.phase==='dance'&&!gameState.dance?.choices[uid]){await passDance();return;}if(gameState.phase==='after-turn'&&active.id===uid&&me.angel==='jegudiel'){await startZeal();return;}if(myTurn&&me.sanctuary&&me.used){zoneMode=!zoneMode;giftOpen=false;return;}if(!myTurn||me.used||me.purgatory){focusedCard=angel??null;return;}if(power){message='This gift is already in your arrangement.';return;}if(me.angel==='uriel'){await action({type:'draw',foretell:true,turn:gameState.turnNumber});return;}giftOpen=!giftOpen;zoneMode=false;giftTiles=[];}
 async function opponentPicked(id:string){if(busy)return;message='';if(gameState.phase==='judgment'&&gameState.judgment===2&&!me.ready){await action({type:'judgment-choice',target:id});return;}if(giftOpen&&me.angel==='chamuel'){await action({type:'communion',target:id,turn:gameState.turnNumber});return;}if(giftOpen&&me.angel==='michael'){if(!selected.length){message='Choose a rank from your rack first.';return;}target=id;await useBefore();return;}focusedCard=angels.find(a=>a.id===gameState.players.find(p=>p.id===id)?.angel)??null;}
 function pickHeaven(tileId:string,groupId:string):boolean{const g=draft.find(g=>g.id===groupId);if(!g)return false;if(zoneMode){if(g.zone&&g.zone!==uid){message='Only its owner can move this Sanctuary.';return true;}if(g.zone!==uid&&!sanctuaryWitness(sanctuaryFrame(draft.map(q=>q.id===groupId?{...q,zone:uid}:q),uid))){message='Extend a protected formation; a new formation cannot enter Sanctuary.';return true;}board.shelter(groupId,g.zone===uid?null:uid);zoneMode=false;return true;}if(!giftOpen)return false;if(!me.opened&&!opening){message='First meld a complete formation from your rack.';return true;}if(['selaphiel','barachiel'].includes(me.angel!)){if(g.zone&&g.zone!==uid){message='That Sanctuary belongs to another Angel.';return true;}const kind=me.angel==='selaphiel'?'choir':'procession';if(formation(g.tiles.map(id=>gameState.tiles[id]),currentDecree)!==kind){message=`Choose a complete ${kind==='choir'?'Choir':'Procession'}.`;return true;}giftGroup=groupId;planGift();return true;}if(['zadkiel','raphael','jophiel'].includes(me.angel!)){if(g.zone){message='Choose an unprotected soul.';return true;}if(me.angel==='jophiel'&&!gameState.heaven.some(g=>g.tiles.includes(tileId))){message='Choose a soul already on the table.';return true;}chooseGiftTile(tileId);if(giftTiles.length===(me.angel==='jophiel'?2:1))planGift();return true;}return false;}
 async function roundCardPicked(){if(busy)return;if(gameState.phase==='judgment'&&gameState.judgment===3&&!me.ready){if(selected.length>5){message='Set aside at most five souls.';return;}await action({type:'judgment-choice',tiles:selected});return;}focusedCard=card??null;}
 async function passDance(){if(selected.length!==gameState.dance?.count){message=`Choose exactly ${gameState.dance?.count} souls.`;return;}await action({type:'dance-choice',tiles:selected,turn:gameState.turnNumber});}
 async function chooseNumber(n:number){if(me.angel==='haniel'){count=n;await useBefore();}else{rank=n;await useBefore();}}
 function selectCommunion(id:string){if(communionTile===id){if(board.removeTile(id))communionTile=undefined;return;}if(communionTile&&!board.removeTile(communionTile))return;const b=document.querySelector('.heaven-board')!.getBoundingClientRect();if(board.placeTile(gameState.tiles[id],b.left+b.width*.45,b.top+b.height*.48)){communionTile=id;}}
</script>
{#snippet bagChoices()}
 <div class="tabletop-inspection" aria-label="Choose one inspected soul to keep">{#each gameState.inspection?.tiles??[] as id}<button class="tile-object" disabled={busy} aria-label={`Keep ${gameState.tiles[id].color} ${gameState.tiles[id].rank}`} onclick={()=>action({type:'keep',tile:id,turn:gameState.turnNumber})}><SoulTile rank={gameState.tiles[id].rank} color={gameState.tiles[id].color} size={21}/></button>{/each}</div>
{/snippet}
{#snippet tabletopStation(player:Player,angle:number)}
 {@const own=player.id===uid}
 {@const inspection=own&&gameState.phase==='inspect'&&gameState.inspection?.player===uid}
 <Rack size={32} fitHeight={inspection?86:105} footer={inspection?bagChoices:undefined} rotation={angle} tapToPlace tiles={own?rackTiles:player.hand.map(id=>gameState.tiles[id])} hidden={motionTiles} canPlay={own&&(editable||zealAvailable)} committed={player.scales} selected={own?selected:[]} onSelect={own?selectRack:undefined} onDropMany={own?addMany:undefined} onDrag={own?previewRack:undefined} onBlockedDrop={own?blockedDrop:()=>{message='Wait for your turn to play into Heaven.';}} onReorder={own?reorder:tiles=>void sendAs?.(player.id,{type:'rack',tiles})}/>
 {#if own}
  {#if gameState.phase==='judgment'&&!me.ready&&gameState.judgment===3}<button class="station-choice" disabled={busy} onclick={roundCardPicked}>Commit Scales</button>{/if}
  {#if gameState.phase==='dance'&&!gameState.dance?.choices[uid]}<button class="station-choice" disabled={busy} onclick={passDance}>Pass {gameState.dance?.count} souls →</button>{/if}
  {#if gameState.communion?.player===uid}<div class="tabletop-inspection communion-private" aria-label="Communion: choose a soul from the opponent’s hand">{#each gameState.players.find(p=>p.id===gameState.communion!.target)!.hand as id}<button class="tile-object" disabled={busy} class:taken={communionTile===id} aria-label={`Choose ${gameState.tiles[id].color} ${gameState.tiles[id].rank} with Communion`} onclick={()=>selectCommunion(id)}><SoulTile rank={gameState.tiles[id].rank} color={gameState.tiles[id].color} size={25}/></button>{/each}</div>{/if}
 {/if}
{/snippet}

<svelte:window bind:innerWidth={screenWidth} bind:innerHeight={screenHeight} onkeydown={e=>{if(e.key==='Escape'){focusedCard=null;giftOpen=false;zoneMode=false;}}}/>
<svelte:document onvisibilitychange={()=>{if(document.hidden)clearMotions();}}/>
<div class="game-table" style={`--bottom-strip:${bottomStrip}px;--opponent-scale:${opponentScale};--table-depth:${edgeDepth}px;--heaven-width:${heavenWidth}px;--heaven-height:${heavenHeight}px;--table-angle:${tableAngle}deg;--seat-angle:${me.seat?seatPose(me.seat,portrait).angle:0}deg`} class:portrait class:tabletop class:in-round={gameState.round>0} data-fullscreen-table>
 {#if tabletop}<TabletopRing state={gameState} {uid} {busy} onJoin={(seat,name,bot)=>onJoin?.(seat,name,bot)} onFocus={onFocus} hidden={motionTiles} onPrivacy={ids=>{uncovered=ids;if(!ids.includes(uid)){giftOpen=false;zoneMode=false;selected=[];}}} onAngel={(id,angel)=>void sendAs?.(id,{type:'angel',angel})} onCard={id=>{if(gameState.phase==='angels')return;if(id===uid&&privateVisible)void activateAngel();else void opponentPicked(id);}} station={tabletopStation}/>{/if}
 <div class="play-area" bind:this={playArea} class:tabletop-play-area={tabletop} data-turning={turning} data-transferring={motionPending} data-square={squareHeaven} data-angle={targetAngle}>
 {#if gameState.round>0}
  <SharedHeaven bind:this={board} game insetX={8} insetY={8} reserveBottom={8} {controlsHost} initialGroups={initial} boardKey={`${boardKey}/${boardReset}`} readOnly={!editable} canTouch={allowed} magnetKind={g=>{const k=formation(g.tiles,currentDecree,g.jokerFaces);return k==='poker'?'other':k;}} orderGroup={g=>g.zone&&g.zone!==uid?g:arrangeDraftGroup(g,currentDecree)} normalizeGroup={g=>g.zone&&g.zone!==uid?g:normalizeDraftGroup(g,currentDecree)} onChange={changed} onSuggestion={suggestion} hand={privateVisible?playableRack:[]} inspect={tiles=>inspectFormation(tiles,currentDecree)} zoneLabel={zone=>gameState.players.find(p=>p.id===zone)?.name??''} onFinish={myTurn?finish:undefined} finishAllowed={canFinish} finishReason={organizing.error??''} onTilePick={pickHeaven} tapToPlace={tabletop&&selected.some(id=>rackIds.includes(id))} onPlaceTap={tabletop?(x,y)=>void placeSelected(x,y):undefined} pickedTiles={giftTiles} {motionTiles} returnable={communionTile?[communionTile]:[]}/>
 {/if}
 <aside class="status-rail" aria-label="Table controls and status"><div class="rail-content">
  <div class="status-controls" bind:this={controlsHost}></div>
 <div class="table-utilities">{@render utilities?.()}</div>
 {#if !tabletop}<div class="opponent-seats" class:four={opponents.length===4} aria-label="Other Angels">{#each opponents as player}<PlayerSeat compact={portrait} {player} active={active?.id===player.id} reveal={gameState.phase!=='angels'||gameState.players.every(p=>p.angel)} {targeting} round={gameState.round} hidden={motionTiles} onpick={opponentPicked}/>{/each}</div>{/if}
 {#if gameState.phase!=='lobby'&&gameState.phase!=='angels'}
  <div class="table-tools" aria-label="Rearrangement tools"><button class="ivory-token" aria-label="Undo" title="Undo · Command/Control Z" disabled={busy} onclick={()=>board.undo()}><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 10H5V4m1 6a12 12 0 1 1-1 13"/></svg></button><button class="ivory-token" aria-label="Restore Heaven" title="Restore the table to the start of this action" disabled={busy} onclick={cancelDraft}><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m15 8-9 8 9 8V8Zm12 0-9 8 9 8V8Z"/></svg></button></div>
  {#if card}<div class="round-card"><button class="paper-card" class:awaiting={gameState.phase==='judgment'&&!me.ready} aria-label={gameState.phase==='judgment'&&gameState.judgment===3&&!me.ready?'Commit Scales souls':`Inspect ${card.name}`} title={gameState.phase==='judgment'&&gameState.judgment===3&&!me.ready?'Touch after choosing your Scales souls':card.name} onclick={roundCardPicked}><GameCard {card}/></button><div class="round-seals" role="img" aria-label={`Round ${gameState.round} of 3`}>{#each [1,2,3]as n}<span class:current={n===gameState.round} class:complete={n<gameState.round}>✧</span>{/each}</div></div>{/if}
  {#if gameState.phase==='after-turn'&&active.id===uid}<button class="end-turn-seal ivory-token" aria-label="End turn" title="Pass on Zeal and end your turn" onclick={()=>action({type:'continue',turn:gameState.turnNumber})}><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m8 16 6 6L26 9"/></svg></button>{/if}
 {/if}
 </div></aside>
 {#if gameState.round>0}
  <div class="special-areas">{#each gameState.players as p}{@const purgatory=remote&&p.id===remote.actor?remote.purgatory:p.id===uid&&power?.kind==='penance'?power.tile:p.purgatory&&!draft.some(g=>g.tiles.includes(p.purgatory!))?p.purgatory:null}{#if purgatory}<div class="purgatory-object"><span class="purgatory-caption">Purgatory · {p.name}</span><SacredRegion kind="purgatory" owner={p.name} title="Purgatory"><button class="tile-object" disabled={!editable||p.id!==uid||power?.kind==='penance'} data-purgatory-tile={purgatory} aria-label={`Rescue ${p.name}’s Purgatory into Heaven`} title={`${p.name} · Purgatory`} onclick={()=>{const b=document.querySelector('.heaven-board')!.getBoundingClientRect();board.placeTile(gameState.tiles[purgatory],b.left+b.width*.3,b.top+b.height*.5);}}><SoulTile rank={gameState.tiles[purgatory].rank} color={gameState.tiles[purgatory].color} size={40}/></button></SacredRegion>{#if editable&&p.id===uid&&power?.kind!=='penance'}<span class="purgatory-hint">Tap tile to rescue</span>{/if}</div>{/if}{/each}</div>
 {/if}
 {#if tabletop&&gameState.round>0}<div class="tabletop-bag"><SoulBag count={gameState.bag.length} active={(myTurn||zealAvailable)&&privateVisible&&!turning&&!motionPending} label="Draw a soul" onpick={drawFromBag}/></div><div class="tabletop-log"><GameLog {events}/></div>{/if}
 </div>
 {#if !tabletop}<div class="bottom-strip" aria-label="Your cards and rack">
 {#if gameState.phase!=='lobby'&&gameState.phase!=='angels'}
  <div class="soul-bag-place"><SoulBag count={gameState.bag.length} active={myTurn||zealAvailable} label={giftOpen&&me.angel==='raguel'?`Return ${selected.length} souls and draw ${selected.length*2}`:`Draw · inspect ${allowance(gameState,uid)}`} onpick={drawFromBag}/></div>
 <div class="own-station" aria-label="Your Angel and status">
  {#if angel}<div class="own-angel" class:spent={me.used} class:unopened={!me.opened} class:invoked={giftOpen||zoneMode} class:active={active?.id===uid}><button class="paper-card" aria-label={`Use ${giftName}`} title={me.sanctuary&&me.used?'Arrange your Sanctuary':`${angel.name} · ${giftName}${me.used?' · spent':''}`} onclick={activateAngel} oncontextmenu={e=>{e.preventDefault();focusedCard=angel!;}}><GameCard card={angel} inPlay/></button></div>{/if}
  <div class="own-favor" title={`${me.favor} Divine Favor · inspect ${allowance(gameState,uid)} souls`}><DivineFavor value={me.favor}/><div class="own-score"><ScoreSlip value={total(me)+(me.scores.length<gameState.round?me.credit:0)}/></div></div>
 </div>
  <div class="your-hand" class:active={myTurn} aria-label="Your rack"><Rack tiles={rackTiles} fitHeight={Math.max(44,bottomStrip-(portrait?150:65))} hidden={motionTiles} canPlay={editable||zealAvailable} committed={me.scales} {selected} onSelect={selectRack} onDropMany={addMany} onDrag={previewRack} onBlockedDrop={blockedDrop} onReorder={reorder}/></div>
 {/if}
 <GameLog {events}/>
 </div>{/if}
 {#if gameState.phase==='lobby'&&!(gameState.chooseOnJoin&&!tabletop&&!me.angel)}
  <div class="setup-table">{#if invitation}<div class="lobby-invitation">{@render invitation()}<p class="lobby-count">{gameState.players.length} of 5 Angels · deal when at least 2 have joined</p></div>{/if}<div class="lobby-art-actions"><div class="empty-seats">{#if !tabletop&&uid===gameState.owner}{#if gameState.players.length<5}<div class="computer-setup"><label class="computer-difficulty">Computer difficulty<select aria-label="Computer difficulty" bind:value={botDifficulty}>{#each availableBotLevels as level}<option value={level}>{level[0].toUpperCase()+level.slice(1)}</option>{/each}</select></label><button class="paper-card empty-seat" aria-label="Add computer" title="Add a computer Angel" disabled={busy} onclick={()=>action({type:'bot',id:`bot-${crypto.randomUUID().slice(0,8)}`,name:`Angel ${gameState.players.length+1}`,difficulty:botDifficulty})}><GameCard card={angels[0]} back/><span class="add-seat">✧</span><span class="seat-caption">Add computer</span></button></div>{/if}{/if}</div>{#if uid===gameState.owner}<button class="paper-card deal-pile" aria-label={gameState.chooseOnJoin?'Deal souls':'Deal Angels'} title={gameState.chooseOnJoin?'Deal souls when everyone has chosen an Angel':'Deal Angels · two to five players'} disabled={busy||gameState.players.length<2||!!gameState.chooseOnJoin&&gameState.players.some(p=>!p.angel)} onclick={()=>action({type:'start'})}><GameCard card={angels[0]} back/></button>{/if}</div></div>
 {:else if gameState.phase==='angels'||gameState.phase==='lobby'&&gameState.chooseOnJoin}
  {#if !tabletop}<div class="angel-choice" aria-label="Choose your Angel">{#if !me.angel}{#each me.options as id}<button class="paper-card" disabled={busy} aria-label={`Choose ${angels.find(a=>a.id===id)?.name}`} title="Choose this Angel" onclick={()=>action({type:'angel',angel:id})}><GameCard card={angels.find(a=>a.id===id)!}/></button>{/each}{:else}<div class="chosen-angel"><GameCard card={angel!}/></div>{/if}</div>{/if}
 {:else}
  {#if !tabletop&&gameState.phase==='inspect'&&gameState.inspection?.player===uid&&(gameState.inspection.tiles.length>1||!busy)}<div class="inspection-rack" aria-label="Choose one inspected soul to keep">{#each gameState.inspection.tiles as id}<button class="tile-object" disabled={busy} title="Keep this soul" aria-label={`Keep ${gameState.tiles[id].color} ${gameState.tiles[id].rank}`} onclick={()=>action({type:'keep',tile:id,turn:gameState.turnNumber})}><SoulTile rank={gameState.tiles[id].rank} color={gameState.tiles[id].color} size={64}/></button>{/each}</div>{/if}
  {#if privateVisible&&giftOpen&&myTurn&&['gabriel','haniel'].includes(me.angel!)}<div class="number-offering" aria-label={me.angel==='gabriel'?'Call a rank':'Choose how many souls to pass'}>{#each Array.from({length:me.angel==='gabriel'?13:Math.min(...gameState.players.map(p=>p.hand.length))},(_,i)=>i+1)as n}<button class="tile-object" aria-label={`${me.angel==='gabriel'?'Call rank':'Pass'} ${n}`} onclick={()=>chooseNumber(n)}>{#if me.angel==='gabriel'}<SoulTile rank={n} color="black" size={34}/>{:else}<span class="number-token"><InkNumeral value={n} width={100} height={100} centerX={50} centerY={50} fontSize={44}/></span>{/if}</button>{/each}</div>{/if}
  {#if !tabletop&&gameState.communion?.player===uid}<div class="communion-rack" aria-label="The opponent’s entire hand. Choose a soul or tap it again to return it.">{#each gameState.players.find(p=>p.id===gameState.communion!.target)!.hand as id}<button class="tile-object" class:taken={communionTile===id} data-communion-tile={id} title={communionTile===id?'Return this soul':'Choose this soul for Communion'} aria-label={`Choose ${gameState.tiles[id].color} ${gameState.tiles[id].rank} for Communion`} onclick={()=>selectCommunion(id)}><SoulTile rank={gameState.tiles[id].rank} color={gameState.tiles[id].color} size={46}/></button>{/each}</div>{/if}
  {#if gameState.phase==='dance'&&!gameState.dance?.choices[uid]}<button class="pass-offering ivory-token" aria-label="Pass selected souls to the right" title="Pass selected souls to the right" onclick={passDance}><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 16h22m-9-8 9 8-9 8"/></svg></button>{/if}
 {/if}

 {#if cue}<p class="table-cue" role="status">{cue}</p>{/if}
 {#if gameState.phase==='round-end'||gameState.phase==='ended'}<section class="score-ledger" aria-label="Round scores"><h1>{gameState.players.find(p=>p.id===gameState.winner)?.name}</h1><p class="ledger-subtitle">{gameState.phase==='ended'?'The Grand Order · final reckoning':`Round ${gameState.round}`}</p><table><thead><tr><th></th>{#each [1,2,3]as n}<th>{n}</th>{/each}<th>∑</th></tr></thead><tbody>{#each [...gameState.players].sort((a,b)=>total(b)-total(a))as p}<tr><th>{p.name}</th>{#each [0,1,2]as n}<td>{p.scores[n]??'·'}</td>{/each}<td>{total(p)}</td></tr>{/each}</tbody></table>{#if gameState.phase==='ended'}<p class="ledger-winner">{gameState.players.filter(p=>total(p)===Math.max(...gameState.players.map(total))).map(p=>p.name).join(' & ')}<br/><small>God’s Favorite</small></p>{:else if uid===gameState.owner||tabletop}<button class="paper-card next-deal" disabled={busy} aria-label={`Deal round ${gameState.round+1}`} title={`Deal round ${gameState.round+1}`} onclick={()=>action({type:'next-round'})}><GameCard card={decrees[0]} back/></button>{/if}</section>{/if}
</div>
<TableMotions {flights} onFinish={finishFlight}/>
{#if focusedCard}<div class="card-inspection" role="dialog" aria-modal="true" aria-label={focusedCard.name}><button class="paper-card inspected-card" style:transform={tabletop?`rotate(${me.seat?seatPose(me.seat,portrait).angle:0}deg)`:undefined} aria-label="Return to Heaven" title="Return to Heaven" onclick={()=>focusedCard=null}><GameCard card={focusedCard}/></button></div>{/if}

<style>
 .computer-setup{display:flex;flex-direction:column;align-items:center;gap:10px}.computer-difficulty{display:grid;gap:4px;color:#e1d0a5;font-size:13px}.computer-difficulty select{max-width:145px;color:#f0dfb8;background:#213b30;border:1px solid #9c8757;border-radius:4px;padding:6px 10px}

 .game-table{position:fixed;inset:0;overflow:hidden;background:radial-gradient(ellipse at 35% 35%,#466257,#29483c 68%,#1c382f);isolation:isolate}.game-table :global(.heaven-layout){position:absolute;inset:0}.game-table :global(.play-viewport){height:100dvh;width:100vw;border:0;border-radius:0;background:none}.game-table :global(.heaven-board){background:radial-gradient(ellipse at 35% 35%,#466257,#29483c 68%,#1c382f);box-shadow:none}.game-table :global(.legality){left:22px;right:auto;top:17px;width:83px;height:76px;z-index:150}.game-table :global(.transpose-control){left:50px;right:auto;top:103px}.game-table :global(.tidy-control){left:17px;right:auto;top:103px}.opponent-seats{position:absolute;top:15px;left:130px;right:240px;display:flex;justify-content:center;gap:clamp(10px,3vw,65px);pointer-events:none;z-index:140}.opponent-seats.four{gap:10px}.paper-card{display:block;position:relative;min-height:0;padding:0;border:0;background:none;border-radius:5px;filter:drop-shadow(0 6px 6px #031a1677);cursor:pointer;touch-action:manipulation;transition:transform .18s,filter .18s}.paper-card:hover{background:none;filter:drop-shadow(0 0 8px #f8df8b55) drop-shadow(0 6px 6px #031a1677)}.paper-card:focus-visible{outline:2px solid #f3d481;outline-offset:4px}.paper-card :global(.game-card){pointer-events:none}.round-card{position:absolute;right:22px;top:22px;width:195px;z-index:140;transform:rotate(4deg)}.round-card>.paper-card{width:100%}.round-seals{display:flex;justify-content:center;gap:15px;margin-top:9px;color:#cfb47555;font-size:23px;line-height:1}.round-seals .current{color:#f9e6a8;filter:drop-shadow(0 0 5px #f4d585aa)}.round-seals .complete{color:#c3a964}.awaiting{filter:drop-shadow(0 0 12px #ffe8a0aa)}.own-angel{position:absolute;left:36px;bottom:24px;width:138px;z-index:155;transform:rotate(-6deg);transition:transform .25s;pointer-events:auto}.own-angel>.paper-card{width:100%}.own-angel.spent{transform:rotate(-90deg);left:48px;bottom:34px;width:121px}.own-angel.unopened:not(.spent){transform:translateY(-4px) rotate(-12deg)}.own-angel.invoked{filter:drop-shadow(0 0 12px #f5d381aa);transform:translateY(-12px) rotate(-4deg)}.own-angel.active:after{content:'';position:absolute;inset:-12px;border-radius:15px;background:radial-gradient(ellipse,#ffe59e22,transparent 70%);z-index:-1}.own-favor{position:absolute;right:178px;bottom:28px;z-index:155;--favor-size:88px;filter:drop-shadow(0 5px 5px #061d1566)}.own-score{position:relative;width:61px;height:40px;margin:0 auto;color:#705028;transform:rotate(6deg)}.soul-bag-place{position:absolute;right:17px;bottom:12px;z-index:155}.table-tools{position:absolute;left:21px;top:146px;display:flex;gap:10px;z-index:150}.ivory-token{display:grid;place-items:center;width:33px;height:33px;min-height:0;padding:7px;border:1px solid #c9ab68;border-radius:50%;background:radial-gradient(circle at 35% 25%,#f8edcf,#d1b67e);color:#705329;box-shadow:0 3px 4px #0a201966;transition:transform .15s;touch-action:manipulation}.ivory-token:hover{background:radial-gradient(circle at 35% 25%,#fff5d8,#dfc68c);transform:translateY(-2px)}.ivory-token svg{width:100%;height:100%;overflow:visible}.your-hand{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);width:max-content;max-width:calc(100vw - 550px);z-index:160;pointer-events:auto;filter:drop-shadow(0 10px 10px #031d1588)}.your-hand :global(.rack){max-width:100%;max-height:32dvh;overflow-y:auto;justify-content:center;border-radius:10px 10px 5px 5px;background:linear-gradient(100deg,#5a4c32,#9b865b 40%,#8c7950 70%,#54452c);box-shadow:inset 0 2px 3px #ebd39d55,inset 0 -5px 0 #3b3424;border:1px solid #a78d58;padding:15px 18px 19px}.your-hand.active :global(.rack){box-shadow:0 0 14px #edd17a22,inset 0 2px 3px #f8e4ab88,inset 0 -5px 0 #3b3424;border-color:#d6bb78}.tile-object{display:block;padding:0;border:0;min-height:0;background:none;line-height:0;touch-action:manipulation;filter:drop-shadow(0 4px 3px #061d1466);transition:transform .18s}.tile-object:hover{background:none;transform:translateY(-7px)}.inspection-rack,.communion-rack,.number-offering{position:absolute;display:flex;flex-wrap:wrap;justify-content:center;gap:8px;padding:12px;z-index:175;background:linear-gradient(#d6bb7d33,#a88d5355);border-radius:12px;backdrop-filter:blur(9px);box-shadow:0 9px 28px #061e1944}.inspection-rack{right:30px;bottom:205px;max-width:min(660px,80vw)}.communion-rack{top:210px;left:50%;transform:translateX(-50%);max-width:80vw;width:max-content}.communion-rack .taken{opacity:.25}.number-offering{left:50%;bottom:190px;transform:translateX(-50%);width:max-content;max-width:80vw}.number-token{display:block;position:relative;width:38px;height:38px;background:#f1e3bd;border:1px solid #bd9c55;border-radius:50%;color:#705128;box-shadow:inset 0 0 0 3px #dfcb97}.special-areas{position:absolute;left:24px;top:38%;display:flex;flex-direction:column;gap:12px;z-index:130;pointer-events:none}.purgatory-object{width:155px;pointer-events:auto;transform:rotate(-3deg)}.purgatory-object :global(.region-surface){border-radius:9px;box-shadow:0 8px 12px #061d1766}.purgatory-object :global(.region-souls){inset:18% 5% 8%}.table-cue{position:absolute;bottom:calc(32dvh + 30px);left:50%;transform:translateX(-50%);z-index:190;max-width:min(540px,80vw);margin:0;padding:9px 18px;border-radius:16px;background:#17352edb;color:#f8e8c2;font:500 17px/1.3 'Cormorant Garamond',Georgia;text-align:center;pointer-events:none;box-shadow:0 2px 10px #061d1555}.pass-offering{position:absolute;left:50%;bottom:175px;z-index:175;width:48px;height:48px}.end-turn-seal{position:absolute;left:111px;top:35px;z-index:170;width:40px;height:40px}.setup-table{position:absolute;inset:28% 20% 15%;display:flex;gap:40px;align-items:center;justify-content:center}.empty-seats{display:flex;gap:20px}.empty-seat{width:145px;opacity:.7;transform:rotate(-8deg)}.add-seat{position:absolute;inset:0;display:grid;place-items:center;color:#fff0b4;font:80px Georgia;text-shadow:0 0 12px #231b0e}.deal-pile{width:180px;transform:rotate(7deg);box-shadow:-3px 3px #c9b37c,-6px 6px #ead8ab,-9px 9px #9c8450}.angel-choice{position:absolute;inset:15% 12% 10%;display:flex;justify-content:center;align-items:center;gap:45px;z-index:160}.angel-choice>.paper-card{width:min(310px,32vw);transform:rotate(-5deg)}.angel-choice>.paper-card+button{transform:rotate(5deg)}.angel-choice>.paper-card:hover{transform:translateY(-15px) rotate(0)}.chosen-angel{width:230px;transform:rotate(-5deg)}.score-ledger{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-1deg);width:min(600px,80vw);max-height:85dvh;overflow:auto;padding:36px 38px;background:#f7edcf;box-shadow:0 15px 45px #071d1aaa,inset 0 0 0 8px #dec997,inset 0 0 0 9px #b4975a;border-radius:5px;z-index:180;color:#5e492a}.score-ledger h1{font-size:44px;text-align:center;margin:0}.ledger-subtitle{font:19px 'Cormorant Garamond';text-align:center;margin:6px 0 22px}.score-ledger table{width:100%;border-collapse:collapse;font:20px 'Cormorant Garamond'}.score-ledger th,.score-ledger td{padding:9px 5px;border-bottom:1px solid #c3ae77;text-align:center}.score-ledger th:first-child{text-align:left}.ledger-winner{text-align:center;font:30px 'Cormorant Garamond';margin-bottom:0}.ledger-winner small{font-size:18px}.next-deal{width:80px;margin:25px auto 0;transform:rotate(6deg)}.card-inspection{position:fixed;inset:0;display:grid;place-items:center;z-index:1000;background:#0b211bcc;backdrop-filter:blur(7px)}.inspected-card{width:min(390px,75vw,65dvh);transform:rotate(-2deg)}
 @media(max-width:1100px){.round-card{width:155px;right:16px;top:16px}.opponent-seats{left:100px;right:185px;gap:8px}.own-angel{width:115px;left:23px}.own-favor{right:135px;--favor-size:70px}.soul-bag-place :global(.soul-bag){width:116px}.your-hand{max-width:calc(100vw - 430px)}.own-angel.spent{left:35px;width:103px}.opponent-seats.four{left:70px;right:170px;gap:0}.opponent-seats.four :global(.player-seat){width:145px}}
 @media(max-width:850px){.round-card{width:138px}.opponent-seats{left:90px;right:170px;gap:0}.own-angel{width:93px;left:20px;bottom:calc(24dvh + 40px)}.own-angel.spent{width:90px;left:18px;bottom:calc(24dvh + 40px)}.own-favor{right:18px;bottom:calc(24dvh + 40px);--favor-size:62px}.soul-bag-place{bottom:calc(24dvh + 150px);right:12px}.soul-bag-place :global(.soul-bag){width:91px}.your-hand{max-width:calc(100vw - 32px);bottom:12px}.your-hand :global(.rack){max-height:24dvh;padding:12px 14px 17px}.purgatory-object{width:120px}.special-areas{left:12px;top:42%}.table-cue{bottom:29dvh;max-width:65vw}.number-offering{bottom:28dvh}.inspection-rack{bottom:230px;right:18px}.opponent-seats.four{left:80px;right:160px;flex-wrap:wrap;max-height:300px}}
 @media(max-width:550px){.game-table :global(.tidy-control){left:48px;right:auto;top:64px;width:24px;height:24px}.game-table :global(.legality){left:8px;top:6px;width:55px;height:48px}.game-table :global(.transpose-control){left:21px;top:64px;width:24px;height:24px}.table-tools{left:9px;top:100px;flex-direction:column;gap:7px}.ivory-token{width:29px;height:29px;padding:6px}.round-card{right:12px;top:12px;width:113px}.round-seals{margin-top:6px;gap:11px;font-size:19px}.opponent-seats{left:68px;right:134px;top:10px;gap:0;flex-wrap:wrap;justify-content:start}.opponent-seats.four{left:65px;right:130px;max-height:250px}.opponent-seats.four :global(.player-seat){width:94px}.own-angel{width:80px;left:12px;bottom:25dvh}.own-angel.spent{width:76px;left:18px;bottom:26dvh}.own-favor{right:12px;bottom:25dvh;--favor-size:56px}.own-score{width:47px;height:31px}.soul-bag-place{bottom:36dvh;right:4px}.soul-bag-place :global(.soul-bag){width:80px}.your-hand{bottom:8px;max-width:calc(100vw - 16px)}.your-hand :global(.rack){max-height:23dvh;padding:12px 10px 16px;gap:3px}.purgatory-object{width:100px}.special-areas{top:39%;left:9px}.inspection-rack{bottom:42dvh;right:5px;max-width:82vw}.inspection-rack :global(.digital-soul){--tile-size:45px!important}.communion-rack{top:31%;gap:4px;width:85vw;max-width:85vw}.number-offering{bottom:30dvh;max-width:85vw;gap:5px}.table-cue{bottom:calc(24dvh + 6px);max-width:65vw;font-size:15px;padding:6px 12px}.pass-offering{bottom:25dvh;left:calc(50% - 18px);width:36px;height:36px}.end-turn-seal{left:69px;top:133px}.angel-choice{inset:20% 5% 10%;gap:15px}.angel-choice>.paper-card{width:43vw}.score-ledger{padding:25px 20px;width:90vw}.score-ledger h1{font-size:35px}.score-ledger table{font-size:17px}.setup-table{inset:30% 7% 10%;gap:20px}.empty-seat{width:85px}.deal-pile{width:115px}.inspected-card{width:min(340px,85vw,65dvh)}}
 @media(max-width:360px){.opponent-seats,.opponent-seats.four{left:58px;right:120px}.opponent-seats :global(.player-seat){width:66px;height:80px;transform:scale(.65);transform-origin:top left}.round-card{width:100px;right:10px}.own-angel{width:70px}.own-favor{--favor-size:49px}}
 @media(max-height:600px) and (min-width:600px){.opponent-seats{transform:scale(.73);transform-origin:top center;top:6px}.round-card{width:118px;top:10px}.own-angel{width:80px;bottom:18px;left:20px}.own-angel.spent{width:80px;bottom:22px}.own-favor{--favor-size:58px;bottom:18px;right:119px}.soul-bag-place :global(.soul-bag){width:90px}.your-hand{max-width:calc(100vw - 300px)}.your-hand :global(.rack){max-height:28dvh}.table-cue{bottom:33dvh}}

 /* Separate physical regions: no status artifacts cover the tile plane. */
 .game-table{--rail-width:clamp(190px,20vw,240px);--top-rail:clamp(190px,23dvh,210px)}
 .game-table :global(.heaven-layout){left:var(--rail-width);top:0;right:0;bottom:var(--bottom-strip);inset-inline-start:var(--rail-width)}
 .game-table :global(.play-viewport){width:100%;height:100%;background:none}
 .status-rail{position:absolute;left:0;top:0;width:var(--rail-width);bottom:var(--bottom-strip);padding:10px;box-sizing:border-box;background:#102d232c;border-right:1px solid #d4bd7c22;z-index:145}
 .rail-content{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:start;zoom:var(--rail-scale)}
 .status-controls{display:flex;align-items:center;gap:6px;min-height:48px}
 .game-table .status-controls :global(.legality){position:relative;left:auto;right:auto;top:auto;width:46px;height:43px;flex:none;transform:none}
 .game-table .status-controls :global(.transpose-control),.game-table .status-controls :global(.tidy-control){position:relative;left:auto;right:auto;top:auto;width:25px;height:25px;flex:none;margin:0}
 .table-tools{position:static;display:flex;gap:6px;align-self:center;justify-self:end;flex-direction:row;z-index:auto}
 .table-tools .ivory-token{width:27px;height:27px;padding:5px}
 .round-card{position:relative;left:auto;right:auto;top:auto;width:min(100%,100px);transform:none;grid-column:1;grid-row:2}
 .round-seals{font-size:17px;margin-top:4px;gap:8px}
 .own-favor{position:relative;left:auto;right:auto;bottom:auto;--favor-size:58px;justify-self:center;align-self:center;grid-column:2;grid-row:2}
 .own-score{width:47px;height:31px}
 .opponent-seats,.opponent-seats.four{position:static;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-column:1 / -1;grid-row:3;gap:5px;max-height:none;transform:none;justify-content:normal;flex-wrap:nowrap;pointer-events:none}
 .opponent-seats :global(.player-seat),.opponent-seats.four :global(.player-seat){zoom:.88;transform:none;width:108px;height:105px}
 .special-areas{position:static;grid-column:1 / -1;display:flex;flex-direction:row;flex-wrap:wrap;gap:5px}
 .purgatory-object{width:80px}
 .end-turn-seal{position:static;grid-column:2;grid-row:4;width:32px;height:32px}
 .bottom-strip{position:absolute;left:0;bottom:0;right:0;height:var(--bottom-strip);display:grid;grid-template-columns:100px minmax(120px,180px) minmax(0,1fr) 100px;align-items:center;gap:16px;padding:16px 24px;box-sizing:border-box;background:linear-gradient(#173c2c33,#0e291f88);border-top:1px solid #d4bd7c22;z-index:155}
 .own-angel,.own-angel.spent,.own-angel.unopened:not(.spent){position:relative;grid-column:1;grid-row:1;left:auto;bottom:auto;width:85px;justify-self:center;transform:rotate(-5deg)}
 .own-angel.spent{transform:rotate(-90deg);width:80px}
 .own-angel.invoked{transform:translateY(-7px) rotate(-4deg)}
 .soul-bag-place{position:relative;grid-column:4;grid-row:1;left:auto;right:auto;bottom:auto;justify-self:center}
 .soul-bag-place :global(.soul-bag){width:90px}
 .bottom-strip :global(.game-log){position:relative;grid-column:2;grid-row:1;left:auto;bottom:auto;width:auto;height:calc(var(--bottom-strip) - 45px);max-height:140px;min-width:0;padding:8px;box-sizing:border-box}
 .your-hand{position:relative;grid-column:3;grid-row:1;left:auto;bottom:auto;transform:none;width:100%;max-width:100%;min-width:0}
 .your-hand :global(.rack){min-height:0;max-height:calc(var(--bottom-strip) - 45px);padding:12px 10px 16px;gap:3px}
 .table-cue{bottom:calc(var(--bottom-strip) + 10px);left:calc(var(--rail-width) + (100vw - var(--rail-width))/2)}
 .inspection-rack,.number-offering{bottom:calc(var(--bottom-strip) + 10px);max-width:calc(100vw - var(--rail-width) - 30px)}
 .communion-rack{top:20px;left:calc(var(--rail-width) + (100vw - var(--rail-width))/2);max-width:calc(100vw - var(--rail-width) - 30px)}
 .pass-offering{bottom:10px;left:auto;right:130px}
 .portrait :global(.heaven-layout){left:0;top:var(--top-rail);inset-inline-start:0}
 .portrait .status-rail{right:0;bottom:auto;width:100%;height:var(--top-rail);border-right:0;border-bottom:1px solid #d4bd7c22;padding:10px}
 .portrait .rail-content{height:100%;grid-template-columns:44px minmax(0,1fr) clamp(70px,11vw,110px) 48px;grid-template-rows:1fr;gap:8px;zoom:1}
 .portrait .status-controls{grid-column:1;grid-row:1;display:flex;flex-wrap:wrap;align-content:start;justify-content:center;gap:5px}
 .portrait .status-controls :global(.legality){width:44px;height:40px}
 .portrait .status-controls :global(.transpose-control),.portrait .status-controls :global(.tidy-control){width:21px;height:21px}
 .portrait .table-tools{position:absolute;left:12px;top:96px;display:flex;flex-direction:column;gap:5px}
 .portrait .opponent-seats,.portrait .opponent-seats.four{grid-column:2;grid-row:1;grid-template-columns:repeat(auto-fit,minmax(72px,1fr));gap:4px;align-content:start}
 .portrait .opponent-seats :global(.player-seat),.portrait .opponent-seats.four :global(.player-seat){zoom:.68;width:108px;height:105px}
 .portrait .round-card{grid-column:3;grid-row:1;width:100%;align-self:start}
 .portrait .own-favor{grid-column:4;grid-row:1;--favor-size:44px;align-self:start;margin-top:5px}
 .portrait .own-score{width:38px;height:25px}
 .portrait .special-areas{position:absolute;right:10px;bottom:5px;max-width:45%;flex-wrap:nowrap}
 .portrait .purgatory-object{width:55px}
 .portrait .end-turn-seal{position:absolute;right:17px;top:92px;width:29px;height:29px}
 .portrait .bottom-strip{grid-template-columns:65px minmax(0,1fr) 65px;grid-template-rows:85px minmax(0,1fr);gap:10px;padding:12px}
 .portrait .own-angel,.portrait .own-angel.spent,.portrait .own-angel.unopened:not(.spent){grid-column:1;grid-row:1;width:55px}
 .portrait .soul-bag-place{grid-column:3;grid-row:1}
 .portrait .soul-bag-place :global(.soul-bag){width:62px}
 .portrait .bottom-strip :global(.game-log){grid-column:2;grid-row:1;height:80px;max-height:80px}
 .portrait .your-hand{grid-column:1 / -1;grid-row:2;align-self:end}
 .portrait .your-hand :global(.rack){max-height:calc(var(--bottom-strip) - 125px)}
 .portrait .table-cue{left:50%;max-width:85vw}
 .portrait .inspection-rack,.portrait .number-offering{max-width:90vw;right:5%;left:auto}
 .portrait .communion-rack{top:calc(var(--top-rail) + 10px);left:50%;width:85vw;max-width:85vw}
 .portrait .pass-offering{bottom:calc(var(--bottom-strip) - 35px);right:12px}
 @media(orientation:landscape) and (max-height:600px){.bottom-strip{grid-template-columns:65px 130px minmax(0,1fr) 65px;gap:10px;padding:10px}.own-angel,.own-angel.spent,.own-angel.unopened:not(.spent){width:60px}.soul-bag-place :global(.soul-bag){width:62px}.bottom-strip :global(.game-log){height:calc(var(--bottom-strip) - 25px)}.your-hand :global(.rack){max-height:calc(var(--bottom-strip) - 30px)}}
 @media(orientation:portrait) and (max-width:550px){.portrait .rail-content{grid-template-columns:40px minmax(0,1fr) 64px 42px;gap:6px}.portrait .opponent-seats,.portrait .opponent-seats.four{grid-template-columns:repeat(2,minmax(0,1fr))}.portrait .opponent-seats :global(.player-seat),.portrait .opponent-seats.four :global(.player-seat){zoom:.58}.portrait .table-tools{left:10px}.portrait .own-favor{--favor-size:40px}}
 .table-utilities{position:absolute;left:12px;bottom:10px;z-index:800}.portrait .table-utilities{left:10px;bottom:5px}.game-table .status-controls :global(.legality){order:-1}
 .table-utilities :global(.table-menu>div){top:auto;bottom:35px}.portrait .table-utilities :global(.table-menu>div){top:35px;bottom:auto}
 .your-hand{padding-top:29px;box-sizing:border-box}.your-hand :global(.rack){max-height:calc(var(--bottom-strip) - 65px)}.portrait .your-hand :global(.rack){max-height:calc(var(--bottom-strip) - 150px);padding:6px 10px 8px}
 @media(orientation:landscape) and (max-height:600px){.your-hand :global(.rack){padding:6px 10px 8px}}

 .rail-content{zoom:1;padding-bottom:36px}
 .game-table:not(.portrait) .status-rail{overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#bda26366 transparent}
 .game-table:not(.portrait) .round-card{grid-column:1 / -1;width:100%;grid-row:2}
 .game-table:not(.portrait) .opponent-seats,.game-table:not(.portrait) .opponent-seats.four{display:flex;flex-direction:column;align-items:center;gap:12px}
 .game-table:not(.portrait) .opponent-seats :global(.player-seat),.game-table:not(.portrait) .opponent-seats.four :global(.player-seat){width:195px;height:190px;zoom:var(--opponent-scale);transform:none}
 .game-table:not(.portrait) .table-utilities{position:static;grid-column:1;grid-row:5}
 .bottom-strip{grid-template-columns:calc(var(--rail-width) - 48px) minmax(120px,180px) minmax(0,1fr) 100px}
 .own-station{grid-column:1;grid-row:1;display:flex;align-items:center;justify-content:center;gap:18px;min-width:0}
 .own-station .own-favor{position:relative;grid-column:auto;grid-row:auto;align-self:center;margin:0;--favor-size:58px;flex:none}
 .own-station .own-angel,.own-station .own-angel.spent,.own-station .own-angel.unopened:not(.spent){flex:none;grid-column:auto;grid-row:auto}
 .portrait .round-card{grid-column:3 / -1;max-width:110px;justify-self:center}
 .portrait .rail-content{padding-bottom:0}
 .portrait .bottom-strip{grid-template-columns:110px minmax(0,1fr) 65px}
 .portrait .own-station{gap:8px;justify-content:start}
 .portrait .own-station .own-favor{--favor-size:40px}
 .portrait .own-station .own-score{width:34px;height:23px}
 @media(orientation:landscape) and (max-height:600px){.bottom-strip{grid-template-columns:calc(var(--rail-width) - 20px) 110px minmax(0,1fr) 65px}.own-station{gap:12px}.own-station .own-favor{--favor-size:48px}}
 .setup-table{inset:20px 25px calc(var(--bottom-strip) + 10px) calc(var(--rail-width) + 25px);display:flex;flex-direction:column;justify-content:start;gap:16px;overflow:auto;padding:8px}.lobby-invitation{width:min(480px,100%)}.lobby-count{margin:8px 0 0;color:#f4e5bf;font:14px/1.3 sans-serif;text-align:center}.lobby-art-actions{display:flex;align-items:center;justify-content:center;gap:20px}.lobby-art-actions .deal-pile{width:110px}.lobby-art-actions .empty-seat{width:90px}.portrait .setup-table{inset:calc(var(--top-rail) + 8px) 10px 12px;z-index:170;background:#284a3c}.portrait .table-utilities{left:56px;bottom:8px}.portrait .table-utilities :global(.table-access){gap:4px}.portrait .table-utilities :global(.visible-table-code){font-size:11px;padding:4px}.portrait .table-utilities :global(.table-menu){width:23px;height:23px}
 .seat-caption{display:block;margin-top:8px;color:#f3e4bb;font:14px/1.3 'Atkinson Hyperlegible',sans-serif;white-space:nowrap}.lobby-art-actions .empty-seat{opacity:1}.lobby-art-actions .add-seat{bottom:26px}

 .play-area{display:contents}
 .tabletop-play-area{display:block;position:absolute;left:50%;top:50%;width:var(--heaven-width);height:var(--heaven-height);transform:translate(-50%,-50%) rotate(var(--table-angle));transform-origin:center;isolation:isolate}
 .tabletop :global(.heaven-layout),.tabletop.portrait :global(.heaven-layout){inset:0;left:0;top:0;border:1px solid #ccb47b33;border-radius:15px;overflow:clip}
 .tabletop :global(.play-viewport){width:100%;height:100%}
 .game-table.tabletop .status-rail,.game-table.tabletop.portrait .status-rail{inset:0;width:100%;height:100%;padding:0;border:0;background:none;overflow:visible;z-index:170;pointer-events:none}
 .game-table.tabletop .rail-content,.game-table.tabletop.portrait .rail-content{position:relative;display:block;height:100%;padding:0;zoom:1;pointer-events:none}
 .game-table.tabletop .rail-content>*,.game-table.tabletop .status-controls :global(button){pointer-events:auto}
 .game-table.tabletop .table-utilities,.game-table.tabletop.portrait .table-utilities{position:absolute;left:14px;top:12px;right:auto;bottom:auto}
 .game-table.tabletop .status-controls,.game-table.tabletop.portrait .status-controls{position:absolute;right:94px;bottom:56px;width:78px;display:grid;grid-template-columns:1fr 1fr;justify-items:center;gap:5px}
 .game-table.tabletop .status-controls :global(.legality),.game-table.tabletop.portrait .status-controls :global(.legality){grid-column:1 / -1;width:64px;height:56px}
 .game-table.tabletop .status-controls :global(.transpose-control),.game-table.tabletop .status-controls :global(.tidy-control){width:32px;height:32px}
 .game-table.tabletop .table-tools,.game-table.tabletop.portrait .table-tools{position:absolute;right:94px;bottom:14px;left:auto;top:auto;width:78px;display:flex;flex-direction:row;justify-content:space-between;gap:5px}
 .game-table.tabletop .table-tools .ivory-token{width:32px;height:32px}
 .game-table.tabletop .round-card,.game-table.tabletop.portrait .round-card{position:absolute;left:14px;bottom:14px;right:auto;top:auto;width:104px;transform:none}
 .game-table.tabletop .special-areas,.game-table.tabletop.portrait .special-areas{position:absolute;left:135px;bottom:14px;right:auto;top:auto;max-width:none;display:flex;flex-direction:row;gap:8px}
 .game-table.tabletop .purgatory-object{width:80px}
 .game-table.tabletop .end-turn-seal,.game-table.tabletop.portrait .end-turn-seal{position:absolute;left:auto;top:auto;right:32px;bottom:110px;width:34px;height:34px}
 .game-table:not(.tabletop) .special-areas{position:absolute;left:calc(var(--rail-width) + 12px);bottom:calc(var(--bottom-strip) + 12px);top:auto;right:auto;max-width:calc(100vw - var(--rail-width) - 24px);z-index:160;gap:12px}
 .game-table.portrait:not(.tabletop) .special-areas{left:12px;top:calc(var(--top-rail) + 12px);bottom:auto;max-width:calc(100vw - 24px)}
 .game-table .purgatory-object{width:110px;flex:none;transform:none}
 .purgatory-caption,.purgatory-hint{display:block;color:#f8e8c2;text-align:center;font:12px/1.3 'Atkinson Hyperlegible',sans-serif;text-shadow:0 1px 3px #102b20;margin:4px 0}
 .purgatory-hint{color:#ffe3a0}
 .tabletop .setup-table{inset:var(--table-depth);pointer-events:none;flex-direction:column;gap:20px}
 .tabletop .setup-table button{pointer-events:auto}
 .tabletop .setup-table .lobby-invitation{display:none}
 .tabletop .deal-pile{width:100px;transform:rotate(calc(var(--seat-angle) + 7deg))}
 .tabletop-bag{position:absolute;right:14px;bottom:14px;z-index:170}
 .tabletop-bag :global(.soul-bag){width:70px}
 .tabletop-log{position:absolute;right:14px;top:14px;width:156px;height:clamp(70px,calc(100% - 190px),240px);z-index:165;opacity:.8}
 .tabletop-log :global(.game-log){position:static;width:100%;height:100%;max-height:none;font-size:11px}
 .tabletop .number-offering{bottom:calc(var(--table-depth) + 12px);left:50%;max-width:50vw;transform:translateX(-50%) rotate(var(--seat-angle))}
 .tabletop .score-ledger{transform:translate(-50%,-50%) rotate(var(--seat-angle));max-width:calc(100vmin - 30px)}
 .tabletop .table-cue{bottom:calc(var(--table-depth) + 8px);left:50%;max-width:40vw;font-size:14px}
 .tabletop-inspection{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;padding:8px;background:#aa8b4e88;border:1px solid #d8bc7e;border-radius:7px;max-height:100px;overflow:auto}
 .tabletop-inspection:not(.communion-private){flex-wrap:nowrap;gap:3px;padding:4px 3px;max-height:none;overflow:visible}
 .communion-private{max-height:70px;margin-top:5px}.communion-private .taken{opacity:.25}
 .station-choice{position:absolute;left:0;right:auto;top:auto;bottom:1px;min-height:24px;padding:3px 9px;background:#efe0b5;color:#644d28;border:1px solid #c4a463;border-radius:12px;font-size:11px}
</style>
