import {expect} from '@playwright/test';
import {launchBrowser} from './browser';
import {applyEvent,commandEvent,type State,type Command,type GameEvent} from '../src/lib/engine/engine';

const uid='practice-player';
function fixture(){
 for(let seed=0;seed<10000;seed++){
  let s:State|null=null;const events:GameEvent[]=[];
  const act=(actor:string,c:Command)=>{const e=commandEvent(s,actor,c,String(events.length));s=applyEvent(s,e);events.push(e);};
  act(uid,{type:'create',name:'You',seed:`sanctuary-ui-${seed}`});act(uid,{type:'bot',id:'computer',name:'Computer'});act(uid,{type:'start'});
  if(s!.decrees[0]!==3||!s!.players[0].options.includes('barachiel'))continue;
  for(const p of s!.players)act(p.id,{type:'angel',angel:p.id===uid?'barachiel':p.options[0]});
  if(s!.turn!==0)continue;
  const hand=s!.players[0].hand;
  for(let rank=1;rank<=8;rank++){
   const run=Array.from({length:6},(_,i)=>hand.find(id=>s!.tiles[id].rank===rank+i));if(run.some(id=>!id))continue;
   const tiles=run as string[],group={id:'safe',x:180,y:120,tiles:tiles.slice(0,3),zone:uid};
   act(uid,{type:'organize',opening:group.tiles,groups:[group],power:{kind:'sanctuary',group:'safe'},turn:s!.turnNumber});
   while(s!.players[s!.turn].id!==uid){const turn=s!.turnNumber;if(s!.phase==='after-turn')act('computer',{type:'continue',turn});else if(s!.phase==='inspect')act('computer',{type:'keep',tile:s!.inspection!.tiles[0],turn});else act('computer',{type:'draw',turn});}
   return {events,tiles};
  }
 }
 throw Error('No legal Sanctuary extension fixture');
}
const f=fixture(),browser=await launchBrowser(),origin=process.env.REVIEW_URL??'http://127.0.0.1:5198';
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});await context.addInitScript(events=>{if(!localStorage.getItem('hp-practice'))localStorage.setItem('hp-practice',JSON.stringify(events));},f.events);
 const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`${origin}/play?practice=1`);
 await page.getByRole('button',{name:'Sort rack by number',exact:true}).click();await page.locator('.rack').evaluate(async el=>{await new Promise(requestAnimationFrame);await Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})));});
 for(const id of f.tiles.slice(3))await page.locator(`[data-rack-tile="${id}"]`).click();await expect(page.locator('.rack button.selected')).toHaveCount(3);
 const source=(await page.locator(`[data-rack-tile="${f.tiles[3]}"]`).boundingBox())!,end=(await page.locator(`.heaven-board [data-tile-id="${f.tiles[2]}"]`).boundingBox())!;
 await page.mouse.move(source.x+source.width/2,source.y+source.height/2);await page.mouse.down();await page.mouse.move(end.x+end.width+24,end.y+end.height/2,{steps:18});await page.mouse.up();
 await expect(page.locator(`.soul-group[data-zone="${uid}"] [data-tile-id]`)).toHaveCount(6);
 // The new end is entirely new tiles, but is split from a legal extension.
 await page.locator(`.heaven-board [data-tile-id="${f.tiles[3]}"]`).click();
 await expect(page.locator(`.soul-group[data-zone="${uid}"]`)).toHaveCount(2);
 // Emptying the region provisionally must still permit undoing those releases.
 for(const [id,count] of [[f.tiles[0],1],[f.tiles[3],0],[f.tiles[3],1],[f.tiles[0],2]] as const){
  await page.locator('.own-angel .paper-card').click();await page.locator(`.heaven-board [data-tile-id="${id}"]`).click();await expect(page.locator(`.soul-group[data-zone="${uid}"]`)).toHaveCount(count);
 }
 const finish=page.getByRole('button',{name:'Finish organizing',exact:true});await expect(finish).toBeEnabled();await finish.click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hp-practice')!).filter((e:GameEvent)=>e.actor==='practice-player'&&e.command.type==='organize').length)).toBe(2);
 const events:GameEvent[]=await page.evaluate(()=>JSON.parse(localStorage.getItem('hp-practice')!)),event=events.findLast(e=>e.actor===uid&&e.command.type==='organize')!;
 expect(event.version).toBe(2);if(event.command.type!=='organize')throw Error('Missing Organize');expect(event.command.sanctuary?.some(frame=>frame.some(ids=>ids.length===6))).toBe(true);expect(event.command.groups.filter(g=>g.zone===uid)).toHaveLength(2);
 await page.reload();await expect(page.locator(`.soul-group[data-zone="${uid}"]`)).toHaveCount(2);expect(errors).toEqual([]);
 console.log('PASS: rack extension → split entirely new end → commit turn-local Sanctuary witness → reload protected formations.');
}finally{await browser.close();}
