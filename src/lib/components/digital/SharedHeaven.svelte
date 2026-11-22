<script lang="ts">
 import {onMount,tick,untrack} from 'svelte';
 import {base} from '$app/paths';
 import SoulTile from './SoulTile.svelte';
 import SuitSymbol from './SuitSymbol.svelte';
 import {tileColumn,groupRect,geometry,findVerticalSnap,alignedStack,transposeStack} from '$lib/tabletop/magnetism';
 import {analyzeFormation,fitInitialGroups,insertTiles,splitTiles,overlaps,type TileGroup,type Soul,type Rect,type Formation,type SoulSpec,type Repair} from '$lib/tabletop/rearrangement';
 let {moved=false,rescued=false,resetKey=0,game=false,initialGroups=[],boardKey='',readOnly=false,canTouch=()=>true,onChange,onSuggestion,hand=[],inspect=analyzeFormation,zoneLabel=()=>''}:{moved?:boolean;rescued?:boolean;resetKey?:number;game?:boolean;initialGroups?:TileGroup[];boardKey?:string;readOnly?:boolean;canTouch?:(g:TileGroup)=>boolean;onChange?:(g:TileGroup[],dragging:boolean)=>void;onSuggestion?:(s:SoulSpec,g:string,r:Repair)=>void;hand?:Soul[];inspect?:(tiles:Soul[])=>Formation;zoneLabel?:(zone:string)=>string}=$props();
 let appliedKey:string|null=null;
 $effect(()=>{const key=boardKey;if(game&&key!==appliedKey){const incoming=initialGroups;untrack(()=>{clearTap();groups=JSON.parse(JSON.stringify(incoming));history=[];selected=null;wholeGroup=null;dragging=null;appliedKey=key;worldWidth=Math.max(viewportWidth,...groups.map(g=>g.x+(g.tiles.length+1)*47+20));worldHeight=Math.max(viewportHeight,...groups.map(g=>g.y+100));});}});
 $effect(()=>{const snapshot=JSON.stringify(groups),moving=!!dragging?.moved;if(game&&initialized)untrack(()=>onChange?.(JSON.parse(snapshot),moving));});
 function editable(group?:TileGroup){return !readOnly&&(!group||canTouch(group));}
 export function placeTile(tile:Soul,clientX:number,clientY:number){if(!editable()||groups.some(g=>g.tiles.some(t=>t.id===tile.id)))return false;const box=surface.getBoundingClientRect();if(clientX<box.left||clientX>box.right||clientY<box.top||clientY>box.bottom)return false;save();const x=Math.max(8,clientX-box.left-tileSize/2),y=Math.max(8,clientY-box.top-tileHeight/2);const id=`placed-${tile.id}-${crypto.randomUUID()}`;groups.push({id,x,y,tiles:[tile],zone:null});const target=findJoin(id);if(target&&editable(groups.find(g=>g.id===target.id)))merge(id,target.id,target.index);return true;}
 export function addToGroup(tile:Soul,id:string,index:number){const group=groups.find(g=>g.id===id);if(!group||!editable(group))return false;save();group.tiles=insertTiles(group.tiles,[tile],index);group.slots=undefined;group.jokerFaces=undefined;return true;}
 export function removeTile(id:string){const group=groups.find(g=>g.tiles.some(t=>t.id===id));if(!group||!editable(group))return false;save();groups=groups.map(g=>({...g,tiles:g.tiles.filter(t=>t.id!==id),slots:undefined})).filter(g=>g.tiles.length);return true;}
 export function shelter(id:string,owner:string|null){const group=groups.find(g=>g.id===id);if(!group||!editable(group))return false;save();group.zone=owner;return true;}
 export function snapshot(){return structuredClone($state.snapshot(groups));}

 let viewport:HTMLDivElement,surface:HTMLDivElement;
 let viewportWidth=$state(0),viewportHeight=$state(0),worldWidth=$state(1000),worldHeight=$state(650),tileSize=$state(44),initialized=$state(false);
 let groups=$state<TileGroup[]>([]),selected=$state<string|null>(null),wholeGroup=$state<string|null>(null),announcement=$state('');
 interface Drag {id:string;tileId:string;startX:number;startY:number;x:number;y:number;moved:boolean;pointer:number;whole:boolean;originalId:string;secondTap:boolean}
 let dragging=$state<Drag|null>(null);let pendingTap:{tileId:string;time:number;timer:ReturnType<typeof setTimeout>}|null=null,lastReset=-1,serial=1000;
 let history:{groups:TileGroup[];left:number;top:number}[]=[];let externalMoved=false,externalRescued=false;
 const step=$derived(tileSize+3),tileHeight=$derived(tileSize*1.43);
 const metrics=$derived({step,tileHeight,rowPitch:tileHeight+14});
 const formations=$derived(groups.map(group=>({id:group.id,...inspect(group.tiles)})));
 const allLegal=$derived(formations.every(f=>f.legal));
 const joining=$derived(dragging?.moved?findJoin(dragging.id):null);
 const stack=$derived(selected&&!dragging?alignedStack(groups,selected,metrics):[]);
 function rect(group:TileGroup):Rect{return groupRect(group,step,tileHeight);}
 function save(){history.push({groups:groups.map(g=>({...g,tiles:g.tiles.map(t=>({...t})),slots:g.slots?.slice(),jokerFaces:g.jokerFaces?Object.fromEntries(Object.entries(g.jokerFaces).map(([id,face])=>[id,{...face}])):undefined})),left:viewport.scrollLeft,top:viewport.scrollTop});if(history.length>40)history.shift();}
 function clearTap(){if(pendingTap){clearTimeout(pendingTap.timer);pendingTap=null;}}
 function undo(){if(readOnly)return;if(pendingTap){clearTap();selected=null;wholeGroup=null;return;}const prior=history.pop();if(prior){groups=prior.groups;selected=null;wholeGroup=null;dragging=null;announcement='Rearrangement undone.';void tick().then(()=>viewport.scrollTo({left:prior.left,top:prior.top,behavior:'instant'}));}}
 function refill(){clearTap();wholeGroup=null;tileSize=game?44:viewportWidth<400?38:viewportWidth<700?40:44;worldWidth=viewportWidth;worldHeight=viewportHeight;groups=game?JSON.parse(JSON.stringify(initialGroups)):fitInitialGroups(worldWidth,worldHeight,tileSize);selected=null;dragging=null;history=[];externalMoved=false;externalRescued=false;initialized=true;}
 $effect(()=>{const key=resetKey,w=viewportWidth,h=viewportHeight;if(w>0&&h>0&&lastReset!==key){untrack(refill);lastReset=key;}});
 $effect(()=>{const wantedMoved=moved,wantedRescued=rescued,key=resetKey;if(initialized&&!game)untrack(()=>{
  if(wantedMoved!==externalMoved){inject('green-a-7',{id:'green-a-7',rank:7,color:'green'},'green-a-6',true,wantedMoved);externalMoved=wantedMoved;}
  if(wantedRescued!==externalRescued){inject('blue-a-9',{id:'blue-a-9',rank:9,color:'blue'},'blue-a-10',false,wantedRescued);externalRescued=wantedRescued;}
 });});
 onMount(()=>{const observer=new ResizeObserver(entries=>{const box=entries[0].contentRect;viewportWidth=Math.floor(box.width);viewportHeight=Math.floor(box.height);if(initialized){worldWidth=Math.max(worldWidth,viewportWidth);worldHeight=Math.max(worldHeight,viewportHeight);}});observer.observe(viewport);return()=>{observer.disconnect();clearTap();};});
 function inject(id:string,tile:Soul,anchor:string,after:boolean,add:boolean){
  clearTap();wholeGroup=null;history=[];if(!add){groups=groups.map(g=>({...g,tiles:g.tiles.filter(t=>t.id!==id)})).filter(g=>g.tiles.length);return;}
  if(groups.some(g=>g.tiles.some(t=>t.id===id)))return;
  const group=groups.find(g=>g.tiles.some(t=>t.id===anchor));
  if(group){const index=group.tiles.findIndex(t=>t.id===anchor)+(after?1:0);group.tiles=insertTiles(group.tiles,[tile],index);group.slots=undefined;group.layoutKind=undefined;group.jokerFaces=undefined;worldWidth=Math.max(worldWidth,group.x+rect(group).width+18);}
  else{const bottom=Math.max(20,...groups.map(g=>g.y+tileHeight+30));groups.push({id:`group-${crypto.randomUUID()}`,x:18,y:bottom,tiles:[tile]});worldHeight=Math.max(worldHeight,bottom+tileHeight+45);}
 }
 function findJoin(id:string){
  const moving=groups.find(g=>g.id===id);if(!moving)return null;const movingRect=rect(moving),threshold=Math.max(14,tileSize*.4);let best:{id:string;index:number;score:number;x:number;y:number}|null=null;
  for(const target of groups){if(target.id===id||!editable(target))continue;const box=rect(target),dy=Math.abs(box.y-moving.y);if(dy>tileHeight*.45)continue;
   const gap=Math.max(box.x-(movingRect.x+movingRect.width),movingRect.x-(box.x+box.width),0);if(gap>threshold)continue;
   const positions=target.tiles.map((_,i)=>target.x+tileColumn(target,i)*step),found=positions.findIndex(x=>moving.x<x+step/2),index=found<0?target.tiles.length:found,x=target.x+Math.max(0,Math.min(tileColumn(target,target.tiles.length-1)+1,Math.round((moving.x-target.x)/step)))*step-3,score=dy*2+gap+Math.abs(moving.x-x)*.05;
   if(!best||score<best.score)best={id:target.id,index,score,x,y:target.y};
  }return best;
 }
 function merge(id:string,targetId:string,index:number,selectWhole=false){
  const moving=groups.find(g=>g.id===id),target=groups.find(g=>g.id===targetId);if(!moving||!target)return;
  if(index===0)target.x=Math.min(moving.x,target.x);target.tiles=insertTiles(target.tiles,moving.tiles,index);target.slots=undefined;target.layoutKind=undefined;target.jokerFaces=undefined;groups=groups.filter(g=>g.id!==id);selected=targetId;wholeGroup=selectWhole?targetId:null;
  worldWidth=Math.max(worldWidth,target.x+rect(target).width+18);announcement=`Joined ${target.tiles.length} souls.`;
 }
 function cut(tileId:string,record=true,focus=true):TileGroup|null{
  const group=groups.find(g=>g.tiles.some(t=>t.id===tileId));if(!group)return null;
  if(!editable(group))return null;const index=group.tiles.findIndex(t=>t.id===tileId),parts=splitTiles(group.tiles,index);wholeGroup=null;
  if(!parts){selected=group.id;return group;}
  if(record)save();const columns=group.tiles.map((_,i)=>tileColumn(group,i)),start=columns[index],info=geometry(group),faces=info?Object.fromEntries(info.cells.filter(c=>c.tile.rank==='joker').map(c=>[c.tile.id,{rank:c.rank,color:c.color}])):group.jokerFaces;const right:TileGroup={id:`group-${crypto.randomUUID()}`,zone:group.zone,x:group.x+start*step,y:group.y,tiles:parts[1],slots:columns.slice(index).map(c=>c-start),layoutKind:info?.kind??group.layoutKind,jokerFaces:faces};group.tiles=parts[0];group.slots=columns.slice(0,index);group.layoutKind=info?.kind??group.layoutKind;group.jokerFaces=faces;groups.push(right);selected=right.id;announcement=`Split before ${right.tiles[0].rank}. The selected soul starts the new group.`;
  if(focus)void tick().then(()=>surface.querySelector<HTMLButtonElement>(`[data-tile-id="${tileId}"]`)?.focus({preventScroll:true}));
  return right;
 }
 function commitTap(){const tileId=pendingTap?.tileId;clearTap();if(tileId)cut(tileId);}
 function down(event:PointerEvent,id:string,tileId:string){
  if(event.button!==0||dragging||readOnly)return;event.preventDefault();
  const secondTap=pendingTap?.tileId===tileId&&performance.now()-pendingTap.time<380;
  if(pendingTap){if(secondTap)clearTap();else commitTap();}
  const group=groups.find(g=>g.tiles.some(t=>t.id===tileId));if(!group)return;
  if(!editable(group))return;const whole=wholeGroup===group.id||secondTap;selected=group.id;wholeGroup=whole?group.id:null;
  dragging={id:group.id,originalId:group.id,tileId,startX:event.clientX,startY:event.clientY,x:group.x,y:group.y,moved:false,pointer:event.pointerId,whole,secondTap};surface.setPointerCapture(event.pointerId);
  (event.currentTarget as HTMLButtonElement).focus({preventScroll:true});
 }
 function move(event:PointerEvent){
  if(!dragging||event.pointerId!==dragging.pointer)return;const dx=event.clientX-dragging.startX,dy=event.clientY-dragging.startY;
  if(!dragging.moved&&Math.hypot(dx,dy)<5)return;
  if(!dragging.moved){
   clearTap();save();dragging.moved=true;
   if(!dragging.whole){const right=cut(dragging.tileId,false,false);if(!right)return;dragging.id=right.id;dragging.x=right.x;dragging.y=right.y;}
  }
  const group=groups.find(g=>g.id===dragging!.id);if(!group)return;
  group.x=Math.max(8,Math.min(worldWidth-rect(group).width-8,dragging.x+dx));group.y=Math.max(8,Math.min(surfaceHeight-tileHeight-8,dragging.y+dy));
 }
 function up(event:PointerEvent){
  if(!dragging||event.pointerId!==dragging.pointer)return;const session=dragging;
  if(session.moved){const target=findJoin(session.id);if(target)merge(session.id,target.id,target.index,session.whole);else{const candidate=findVerticalSnap(groups,session.id,metrics,worldWidth,surfaceHeight),snap=candidate&&editable(groups.find(g=>g.id===candidate.targetId))?candidate:null;if(snap){groups=groups.map(g=>g.id===session.id?snap.moving:g.id===snap.targetId?snap.target:g);selected=session.id;wholeGroup=session.id;announcement=`Aligned ${snap.kind==='procession'?'matching ranks':'matching suits'}. Transpose is available for this stack.`;}else announcement=session.whole?'Whole group moved.':'Split group moved.';}}
  else if(session.secondTap){clearTap();wholeGroup=session.id;selected=session.id;announcement='Whole group selected. Drag any of its souls to move it together.';}
  else{clearTap();pendingTap={tileId:session.tileId,time:performance.now(),timer:setTimeout(commitTap,380)};}
  dragging=null;if(surface.hasPointerCapture(event.pointerId))surface.releasePointerCapture(event.pointerId);
 }
 function cancel(){if(dragging?.moved){const prior=history.pop();if(prior){groups=prior.groups;viewport.scrollTo({left:prior.left,top:prior.top,behavior:'instant'});}selected=dragging.originalId;wholeGroup=dragging.whole?dragging.originalId:null;}dragging=null;clearTap();}
 function blank(event:PointerEvent){if(event.target!==surface||dragging)return;commitTap();selected=null;wholeGroup=null;}
 function key(event:KeyboardEvent,id:string,tileId:string){if(!editable(groups.find(g=>g.id===id)))return;
  if((event.key==='Enter'||event.key===' ')&&event.shiftKey){event.preventDefault();clearTap();cut(tileId);return;}
  if(event.key==='Enter'||event.key===' '){event.preventDefault();clearTap();const target=wholeGroup===id?findJoin(id):null;if(target){save();merge(id,target.id,target.index,true);}else{selected=id;wholeGroup=id;announcement='Whole group selected.';}return;}
  const directions:Record<string,[number,number]>={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};const direction=directions[event.key];if(!direction)return;
  event.preventDefault();clearTap();save();const group=wholeGroup===id?groups.find(g=>g.id===id):cut(tileId,false);if(!group)return;selected=group.id;const distance=event.shiftKey?2:12;
  group.x=Math.max(8,Math.min(worldWidth-rect(group).width-8,group.x+direction[0]*distance));group.y=Math.max(8,Math.min(surfaceHeight-tileHeight-8,group.y+direction[1]*distance));
 }
 function transpose(){
  if(readOnly||dragging||stack.length<2||stack.some(g=>!editable(g))||new Set(stack.map(g=>g.zone??null)).size>1)return;clearTap();const source=[...stack],ids=new Set(source.map(g=>g.id)),others=groups.filter(g=>!ids.has(g.id)),output=transposeStack(source,metrics,worldWidth,others,()=>`group-${crypto.randomUUID()}`);if(!output.length)return;
  save();for(const g of output)g.zone=source[0].zone;groups=[...others,...output];selected=output[0].id;wholeGroup=output[0].id;worldWidth=Math.max(worldWidth,...output.map(g=>g.x+rect(g).width+18));worldHeight=Math.max(worldHeight,...output.map(g=>g.y+tileHeight+30));announcement=`Transposed ${source.length} groups into ${output.length} groups. Incomplete pieces remain separate.`;
  void tick().then(()=>viewport.scrollTo({left:Math.max(0,output[0].x-18),top:Math.max(0,output[0].y-18),behavior:'instant'}));
 }
 function globalKey(event:KeyboardEvent){if(readOnly)return;if(event.key.toLowerCase()==='t'&&!event.metaKey&&!event.ctrlKey&&!event.altKey&&!(event.target instanceof HTMLInputElement)&&!(event.target instanceof HTMLTextAreaElement)&&!(event.target instanceof HTMLSelectElement)){event.preventDefault();transpose();}if(event.key==='Escape'){event.preventDefault();if(dragging)cancel();else{clearTap();selected=null;wholeGroup=null;}}if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='z'&&!(event.target instanceof HTMLInputElement)&&!(event.target instanceof HTMLTextAreaElement)){event.preventDefault();undo();}}
 const hints=$derived.by(()=>{
  const placed:{id:string;x:number;y:number;width:number;height:number;formation:Formation;distant:boolean}[]=[];
  const occupied=groups.map(rect),badge={x:worldWidth-90,y:0,width:90,height:110};
  for(const state of formations){if(state.legal||dragging?.id===state.id)continue;const group=groups.find(g=>g.id===state.id)!;const box=rect(group),chips=state.repairs.reduce((n,r)=>n+r.additions.length,0),naturalWidth=state.repairs.length?chips*24+(state.repairs.length-1)*14+12:34,width=Math.min(naturalWidth,Math.max(34,worldWidth-24)),height=naturalWidth>width?50:28;
   const candidates=[{x:box.x+box.width+9,y:box.y+(tileHeight-height)/2},{x:box.x,y:box.y+tileHeight+7},{x:box.x,y:box.y-height-7},{x:box.x-width-9,y:box.y+(tileHeight-height)/2}];
   for(const radius of [40,80,120])for(const dx of [-radius,0,radius])candidates.push({x:box.x+dx,y:box.y+tileHeight+radius});
   let candidate=candidates.find(p=>p.x>=8&&p.x+width<=worldWidth-8&&p.y>=8&&p.y+height<=worldHeight-8&&!occupied.some(r=>overlaps({...p,width,height},r,3))&&!overlaps({...p,width,height},badge,3)&&!placed.some(r=>overlaps({...p,width,height},r,3)));
   const distant=!candidate;if(!candidate)candidate={x:Math.max(8,Math.min(worldWidth-width-8,box.x)),y:Math.max(worldHeight-35,...occupied.map(r=>r.y+r.height+10),...placed.map(r=>r.y+r.height+7))};
   placed.push({id:state.id,...candidate,width,height,formation:state,distant});
  }return placed;
 });
 const surfaceHeight=$derived(Math.max(worldHeight,...hints.map(h=>h.y+h.height+14)));
 const magnetic=$derived.by(()=>{if(!dragging?.moved||joining)return null;const snap=findVerticalSnap(groups,dragging.id,metrics,worldWidth,surfaceHeight);return snap&&editable(groups.find(g=>g.id===snap.targetId))?snap:null;});
</script>
<svelte:window onkeydown={globalKey}/>
<section class="heaven-layout" aria-label="Freeform Heaven play area">
 <p class="sr-only" id="heaven-instructions">Click or drag a soul to split before it. Double-click or double-tap to select the whole group, then drag to move it together. Click blank Heaven or press Escape to clear group selection. Drop beside or between another group’s souls to join. Shift Enter splits with a keyboard; arrow keys move the group; Enter joins nearby groups. Groups snap north or south when matching ranks or suits align. Select an aligned stack and press T to transpose it. Command or Control Z undoes a rearrangement.</p>
   {#if initialized}<div class="legality" role="img" aria-label={allLegal?'Heaven is legal':'Heaven needs rearranging'} title={allLegal?'Heaven is legal':'Heaven needs rearranging'} data-status={allLegal?'halo':'horns'}><img src={`${base}/art/digital/${allLegal?'heaven-legal-halo':'heaven-invalid-horns'}.webp`} alt="" draggable="false"/></div>{/if}
 <button class="transpose-control" aria-label="Transpose aligned groups" title="Transpose aligned groups (T)" disabled={readOnly||stack.length<2||!!dragging} onclick={transpose}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 5h10a5 5 0 0 1 5 5v4m-4-4 4 4 4-4M20 19H10a5 5 0 0 1-5-5v-4m4 4-4-4-4 4"/></svg></button>
 <div class="play-viewport" bind:this={viewport}>
  <div class="heaven-board" role="group" aria-label="Movable souls in Heaven" bind:this={surface} style={`width:${worldWidth}px;height:${surfaceHeight}px;--table-tile:${tileSize}px`} data-legal={allLegal} onpointerdown={blank} onpointermove={move} onpointerup={up} onpointercancel={cancel}>

   {#each groups as group (group.id)}{@const formation=formations.find(f=>f.id===group.id)!}
    <div class="soul-group" class:invalid={!formation.legal} class:selected={selected===group.id} class:whole-selected={wholeGroup===group.id} class:dragging={dragging?.id===group.id&&dragging.moved} class:join-target={joining?.id===group.id} class:magnet-target={magnetic?.targetId===group.id} class:in-stack={stack.some(g=>g.id===group.id)} style={`transform:translate(${group.x}px,${group.y}px);width:${rect(group).width}px;height:${tileHeight}px;z-index:${dragging?.id===group.id?100:selected===group.id?30:1}`} data-zone={group.zone??'heaven'} data-group-id={group.id} data-whole-selected={wholeGroup===group.id} data-kind={formation.kind} data-valid={formation.legal}>
     {#if group.zone}<span class="zone-owner">{zoneLabel(group.zone)||'Sanctuary'}</span>{/if}
     {#each group.tiles as tile,i (tile.id)}<button class="tile-control" style={`left:${tileColumn(group,i)*step}px`} aria-label={`${tile.rank==='joker'?'Joker':`${tile.color} ${tile.rank}`}, ${group.tiles.length} souls in group`} aria-describedby="heaven-instructions" data-tile-id={tile.id} onpointerdown={event=>down(event,group.id,tile.id)} ondblclick={event=>event.preventDefault()} onkeydown={event=>key(event,group.id,tile.id)}><SoulTile rank={tile.rank} color={tile.color} size={tileSize}/>{#if game&&tile.rank==='joker'&&group.jokerFaces?.[tile.id]}<span class="joker-identity" title="This joker represents this soul">{group.jokerFaces[tile.id].rank}<SuitSymbol color={group.jokerFaces[tile.id].color}/></span>{/if}</button>{/each}
    </div>
   {/each}
   {#if magnetic}<div class="magnetic-preview" style={`left:${magnetic.moving.x-4}px;top:${magnetic.moving.y-4}px;width:${rect(magnetic.moving).width+8}px;height:${tileHeight+8}px`} data-magnet-target={magnetic.targetId} data-magnet-kind={magnetic.kind} aria-hidden="true">{#each magnetic.moving.tiles as _,i}<span style={`left:${tileColumn(magnetic.moving,i)*step+3}px;width:${tileSize}px;height:${tileHeight}px`}></span>{/each}</div>{/if}
   {#if joining}<span class="join-caret" style={`transform:translate(${joining.x}px,${joining.y-4}px);height:${tileHeight+8}px`} aria-hidden="true"></span>{/if}
   {#each hints as hint (hint.id)}<div class="repair-hint" style={`left:${hint.x}px;top:${hint.y}px;width:${hint.width}px;min-height:${hint.height}px`} data-repair-for={hint.id} role="group" aria-label={hint.formation.repairs.length?hint.formation.repairs.map(r=>`Add ${r.additions.map(t=>`${t.color} ${t.rank}`).join(' and ')} for a ${r.kind}`).join('; or '):'Split or rearrange this group; adding souls alone cannot make it legal'}>
    {#each hint.formation.repairs as repair,i}{#if i}<span class="alternative" aria-hidden="true">/</span>{/if}<span class="repair-option">{#each repair.additions as tile}{@const playable=game&&!readOnly&&hand.some(t=>t.rank==='joker'||t.rank===tile.rank&&t.color===tile.color)}<button class="repair-chip" class:playable data-color={tile.color} disabled={!playable} aria-label={`Play ${tile.color} ${tile.rank} from your rack`} onclick={()=>onSuggestion?.(tile,hint.id,repair)}>{#if repair.kind==='choir'}<SuitSymbol color={tile.color}/>{:else}{tile.rank}{/if}</button>{/each}</span>{:else}<span class="split-suggestion" aria-hidden="true">↔</span>{/each}
   </div>{/each}
  </div>
 </div>
 <span class="sr-only" role="status" aria-live="polite">{announcement} {initialized?(allLegal?'Heaven is legal.':'Heaven needs rearranging.'):''}</span>
</section>
<style>
 .joker-identity{position:absolute;bottom:-2px;right:-2px;display:flex;align-items:center;gap:1px;background:#fff0c9;padding:3px 4px;border:1px solid #c8a45f;border-radius:4px;font:700 11px/1 sans-serif;pointer-events:none}.joker-identity :global(svg){width:9px;height:9px}.heaven-layout{margin:0;position:relative}.play-viewport{width:100%;height:clamp(480px,76dvh,880px);overflow:auto;border:1px solid #a78c55;border-radius:14px;scrollbar-width:thin;scrollbar-color:#a98d50 #283f35;background:#283f35;overscroll-behavior:contain}.heaven-board{position:relative;isolation:isolate;min-width:100%;min-height:100%;background:radial-gradient(ellipse at 25% 30%,#3e5850,#223b33 80%);box-shadow:inset 0 0 0 6px #d4bc7c0a;overflow:hidden}.soul-group{position:absolute;left:0;top:0;display:block;touch-action:none;border-radius:6px;user-select:none;-webkit-user-select:none}.soul-group::after{content:'';position:absolute;inset:-4px;border:1px solid transparent;border-radius:8px;pointer-events:none}.soul-group.invalid::after{border-color:#e0ad6b88}.soul-group.selected::after{border-color:#dfc77e;box-shadow:0 0 7px #f4d88125}.soul-group.whole-selected::after{border:2px solid #ffe9b0;box-shadow:0 0 9px #f4d88155}.soul-group.join-target::after{border-color:#fff0be;box-shadow:0 0 9px #f4d88180}.soul-group.in-stack::after{border-color:#ddc68b77;border-style:dashed}.soul-group.magnet-target::after{border-color:#ffe8a7;box-shadow:0 0 9px #f4d88155}.soul-group.dragging{opacity:.88;filter:drop-shadow(0 9px 5px #07140f77);cursor:grabbing}.tile-control{position:absolute;top:0;width:var(--table-tile);height:calc(var(--table-tile)*1.43);min-height:0;flex:none;border:0;padding:0;margin:0;background:none;border-radius:6px;cursor:grab;touch-action:none;line-height:0;-webkit-touch-callout:none}.tile-control:hover{background:transparent}.tile-control:active{cursor:grabbing}.tile-control:focus-visible{outline:2px solid #ffedb4;outline-offset:2px}.tile-control :global(.digital-soul){pointer-events:none}.legality{position:absolute;top:9px;right:10px;width:76px;height:66px;z-index:110;pointer-events:none;filter:drop-shadow(0 2px 3px #10271b55)}.legality img{width:100%;height:100%;object-fit:contain}.legality[data-status=halo]{filter:drop-shadow(0 0 7px #f7d36c55)}.join-caret{position:absolute;left:0;top:0;width:3px;border-radius:3px;background:#ffe6a2;box-shadow:0 0 8px #ffe6a2;z-index:101;pointer-events:none}.repair-hint{position:absolute;display:flex;flex-wrap:wrap;gap:3px;align-items:center;justify-content:center;padding:3px 5px;border:1px solid #d4b87555;border-radius:7px;background:#17382edd;z-index:20;pointer-events:auto;box-sizing:border-box}.repair-option{display:flex;gap:2px;flex-wrap:wrap;justify-content:center}.repair-chip{border:0;min-height:0;margin:0;display:grid;place-items:center;min-width:21px;height:21px;padding:0 2px;color:#2463a6;background:#f8efd9cc;border-radius:3px;font:700 15px/1 'Atkinson Hyperlegible',sans-serif}.repair-chip:disabled{opacity:.7;cursor:default}.repair-chip.playable{outline:2px solid #ffe2a0;cursor:pointer;box-shadow:0 0 8px #ffd78088}.zone-owner{position:absolute;bottom:100%;left:0;color:#f3d893;font:12px/1.2 Georgia;white-space:nowrap}.soul-group[data-zone]:not([data-zone=heaven])::after{border:2px solid #d7bc75;background:#f3d48908}.repair-chip[data-color=black]{color:#252c2c}.repair-chip[data-color=red]{color:#b5333e}.repair-chip[data-color=green]{color:#267044}.repair-chip :global(svg){width:15px;height:16px}.alternative{font:400 13px/1 sans-serif;color:#d5bd85;margin:0 1px}.split-suggestion{font:400 23px/1 Georgia,serif;color:#f0ce8a}.transpose-control{position:absolute;right:14px;top:78px;z-index:120;width:27px;height:27px;min-height:0;display:grid;place-items:center;padding:5px;border:1px solid #c9b16a80;border-radius:50%;color:#ffe6a2;background:#284334;box-shadow:0 2px 4px #081a1266}.transpose-control svg{width:100%;height:100%;overflow:visible}.transpose-control:disabled{opacity:.3;cursor:default}.transpose-control:hover:not(:disabled){background:#516447}.magnetic-preview{position:absolute;z-index:99;pointer-events:none;border:1px dashed #ffe9ac;border-radius:8px;background:#e2cc8612;box-shadow:0 0 10px #f2d28522}.magnetic-preview span{position:absolute;top:3px;border:1px solid #ffe9ac55;border-radius:5px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
</style>
