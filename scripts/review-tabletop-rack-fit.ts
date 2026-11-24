import {expect} from '@playwright/test';
import {launchBrowser} from './browser';
import {applyEvent,commandEvent,replay,type State,type Command,type GameEvent} from '../src/lib/engine/engine';
import {mkdir} from 'node:fs/promises';
const origin=process.env.REVIEW_URL||'http://127.0.0.1:5198';let events:GameEvent[]=[],large:State|null=null;
for(let seed=0;seed<500;seed++){
 let s:State|null=null;const log:GameEvent[]=[];const act=(actor:string,c:Command)=>{const e=commandEvent(s,actor,c,crypto.randomUUID());s=applyEvent(s,e);log.push(e);};
 act('tabletop-owner',{type:'create',name:'Uriel',seed:`rack-fit-${seed}`,seat:'south'});act('tabletop-owner',{type:'seat',id:'north',name:'North',seat:'north'});act('tabletop-owner',{type:'start'});
 if(s!.turn!==0||!s!.players[0].options.includes('uriel')||s!.players[1].options.every(a=>a==='jegudiel'))continue;
 act('tabletop-owner',{type:'angel',angel:'uriel'});act('north',{type:'angel',angel:s!.players[1].options.find(a=>a!=='jegudiel')!});
 while(s!.players[0].hand.length<40||s!.players[s!.turn].id!=='tabletop-owner'){const state=s! as State,actor=state.players[state.turn].id;act(actor,{type:'draw',turn:state.turnNumber});act(actor,{type:'keep',tile:s!.inspection!.tiles[0],turn:s!.turnNumber});}
 events=log;large=s!;break;
}if(!large)throw Error('No large-rack fixture');
const browser=await launchBrowser(),page=await browser.newPage({viewport:{width:1800,height:1100}}),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await mkdir('tmp/qa/tabletop',{recursive:true});
try{
 await page.goto(`${origin}/tabletop?local=1`);await page.evaluate(events=>localStorage.setItem('hp-tabletop-local',JSON.stringify(events)),events);await page.reload();await expect(page.locator('.play-area')).toHaveAttribute('data-turning','false');await page.getByRole('button',{name:'Reveal Uriel’s rack',exact:true}).click();
 const privateSeat=page.locator('[data-private-seat="tabletop-owner"]'),rack=privateSeat.locator('.rack');await expect(rack.locator('[data-rack-tile]')).toHaveCount(40);
 async function fitted(){await expect.poll(()=>rack.evaluate(el=>{const b=el.getBoundingClientRect();return el.scrollHeight<=el.clientHeight+1&&el.scrollWidth<=el.clientWidth+1&&[...el.querySelectorAll('[data-rack-tile]')].every(tile=>{const t=tile.getBoundingClientRect();return t.left>=b.left-1&&t.top>=b.top-1&&t.right<=b.right+1&&t.bottom<=b.bottom+1;});})).toBe(true);}
 await fitted();expect((await rack.locator('[data-rack-tile]').first().boundingBox())!.width).toBeLessThan(25);await page.screenshot({path:'tmp/qa/tabletop/11-large-rack.png'});
 await privateSeat.getByRole('button',{name:'Sort rack by number',exact:true}).click();await fitted();
 await page.getByRole('button',{name:'Uriel’s Angel',exact:true}).click();const choices=privateSeat.locator('.tabletop-inspection');await expect(choices.locator('button')).toHaveCount(8);await expect(rack.locator('[data-rack-tile]')).toHaveCount(40);await fitted();
 const handBox=await rack.boundingBox(),choiceBox=await choices.boundingBox(),portBox=await privateSeat.locator('xpath=ancestor::section[1]').boundingBox();expect(choiceBox!.y).toBeGreaterThanOrEqual(handBox!.y+handBox!.height-1);expect(choiceBox!.y+choiceBox!.height).toBeLessThanOrEqual(portBox!.y+portBox!.height+1);
 for(const choice of await choices.locator('button').all())await expect(choice).toBeVisible();await page.screenshot({path:'tmp/qa/tabletop/12-choice-below-visible-rack.png'});
 const before=JSON.parse(await page.evaluate(()=>localStorage.getItem('hp-tabletop-local')!)),inspection=replay(before),kept=inspection.inspection!.tiles[0];await choices.locator('button').first().click();await expect(page.locator(`[data-flight-id="${kept}"]`)).toBeVisible();await expect(page.locator(`[data-flight-id="${kept}"]`)).toHaveCount(0);await expect(rack.locator('[data-rack-tile]')).toHaveCount(41);await fitted();
 const after=replay(await page.evaluate(()=>JSON.parse(localStorage.getItem('hp-tabletop-local')!)));expect(after.players.find(p=>p.id==='tabletop-owner')!.hand).toContain(kept);expect(errors).toEqual([]);console.log('PASS: 40- and 41-tile hands fit without scrolling; eight bag choices below the fully visible rack stay inside the shield; sorting and keep flight work.');
}finally{await browser.close();}
