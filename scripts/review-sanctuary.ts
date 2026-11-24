import {expect} from '@playwright/test';
import {launchBrowser} from './browser';
import type {GameEvent} from '../src/lib/engine/engine';

import {sanctuaryFixture} from './fixtures/sanctuary-review';
const uid='practice-player';
const f=sanctuaryFixture(),browser=await launchBrowser(),origin=process.env.REVIEW_URL??'http://127.0.0.1:5198';
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
