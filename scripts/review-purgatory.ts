import {expect} from '@playwright/test';
import {launchBrowser} from './browser';
import {applyEvent,commandEvent,replay,type State,type Command,type GameEvent} from '../src/lib/engine/engine';
const uid='practice-player';
function fixture(){
 for(let seed=0;seed<10000;seed++){
  let s:State|null=null;const events:GameEvent[]=[];
  const act=(actor:string,c:Command)=>{const e=commandEvent(s,actor,c,String(events.length));s=applyEvent(s,e);events.push(e);};
  act(uid,{type:'create',name:'You',seed:`purgatory-ui-${seed}`});for(let i=1;i<5;i++)act(uid,{type:'bot',id:`computer-${i}`,name:`Computer ${i}`});act(uid,{type:'start'});
  if(s!.decrees[0]!==3||!s!.players[0].options.includes('raphael'))continue;
  for(const p of s!.players)act(p.id,{type:'angel',angel:p.id===uid?'raphael':p.options[0]});if(s!.turn!==0)continue;
  const hand=s!.players[0].hand;
  for(let rank=1;rank<=10;rank++){
   const run=Array.from({length:4},(_,i)=>hand.find(id=>s!.tiles[id].rank===rank+i));if(run.some(id=>!id))continue;
   const tiles=run as string[],group={id:'procession',x:420,y:100,tiles:tiles.slice(0,3),zone:null};
   act(uid,{type:'organize',opening:tiles,stage:[{...group,tiles}],groups:[group],power:{kind:'penance',tile:tiles[3]},turn:s!.turnNumber});
   while(s!.players[s!.turn].id!==uid){const actor=s!.players[s!.turn].id,turn=s!.turnNumber;if(s!.phase==='after-turn')act(actor,{type:'continue',turn});else if(s!.phase==='inspect')act(actor,{type:'keep',tile:s!.inspection!.tiles[0],turn});else act(actor,{type:'draw',turn});}
   return {events,tiles};
  }
 }throw Error('No Purgatory fixture');
}
const f=fixture(),browser=await launchBrowser(),origin=process.env.REVIEW_URL??'http://127.0.0.1:5198';
try{
 for(const viewport of [{width:1440,height:1000},{width:1100,height:600},{width:430,height:932}]){
  const context=await browser.newContext({viewport});await context.addInitScript(events=>localStorage.setItem('hp-practice',JSON.stringify(events)),f.events);
  const page=await context.newPage();await page.goto(`${origin}/play?practice=1`);
  const tile=page.locator(`[data-purgatory-tile="${f.tiles[3]}"]`),region=page.locator('.purgatory-object');await expect(tile).toBeEnabled();await expect(page.getByText('Tap tile to rescue',{exact:true})).toBeVisible();
  const b=(await region.boundingBox())!;expect(b.x).toBeGreaterThanOrEqual(0);expect(b.y).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(viewport.width);expect(b.y+b.height).toBeLessThan(viewport.height);
  expect(await tile.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);
  await page.screenshot({path:`/tmp/hp-purgatory-${viewport.width}.png`});
  await tile.click();await expect(page.locator(`[data-purgatory-tile]`)).toHaveCount(0);await expect(page.locator(`.heaven-board [data-tile-id="${f.tiles[3]}"]`)).toHaveCount(1);
  await page.getByRole('button',{name:'Restore Heaven',exact:true}).click();await expect(tile).toBeEnabled();await tile.click();
  const source=page.locator(`.heaven-board [data-tile-id="${f.tiles[3]}"]`),end=page.locator(`.heaven-board [data-tile-id="${f.tiles[2]}"]`);await page.waitForTimeout(500);
  const from=(await source.boundingBox())!,to=(await end.boundingBox())!;await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();await page.mouse.move(to.x+to.width+12,to.y+to.height/2,{steps:20});await page.mouse.up();
  const finish=page.getByRole('button',{name:'Finish organizing',exact:true});await expect(finish).toBeEnabled();await finish.click();
  const events:GameEvent[]=await page.evaluate(()=>JSON.parse(localStorage.getItem('hp-practice')!));expect(replay(events).players[0].purgatory).toBeNull();
  console.log(`PASS ${viewport.width}×${viewport.height}: Purgatory visible with five players; tap, restore, rescue into Procession, and commit.`);await context.close();
 }
}finally{await browser.close();}
