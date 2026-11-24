import {expect} from '@playwright/test';
import {launchBrowser} from './browser';
import {applyEvent,commandEvent,type State,type Command,type GameEvent} from '../src/lib/engine/engine';
const origin=process.env.REVIEW_URL||'http://127.0.0.1:5198';
const browser=await launchBrowser(),page=await browser.newPage({viewport:{width:1440,height:900}}),errors:string[]=[];page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(e.message));
let saved:GameEvent[]=[];
for(let seed=0;seed<30;seed++){let s:State|null=null;const events:GameEvent[]=[];const act=(actor:string,c:Command)=>{const e=commandEvent(s,actor,c,crypto.randomUUID());s=applyEvent(s,e);events.push(e);};act('tabletop-owner',{type:'create',name:'South',seed:`actions-${seed}`,seat:'south'});act('tabletop-owner',{type:'seat',id:'north-player',name:'North',seat:'north'});act('tabletop-owner',{type:'start'});for(const p of s!.players)act(p.id,{type:'angel',angel:p.options.find(a=>a!=='jegudiel')!});if(s!.players[s!.turn].id==='tabletop-owner'){saved=events;break;}}
try{
 await page.goto(`${origin}/tabletop?local=1`);await page.evaluate(events=>localStorage.setItem('hp-tabletop-local',JSON.stringify(events)),saved);await page.reload();await expect(page.locator('.play-area')).toHaveAttribute('data-turning','false');await page.getByRole('button',{name:'Reveal South’s rack',exact:true}).click();
 const rack=page.locator('[data-private-seat="tabletop-owner"]'),tile=rack.locator('[data-rack-tile]').first(),id=await tile.getAttribute('data-rack-tile');
 async function drag(){const from=await rack.locator(`[data-rack-tile="${id}"]`).boundingBox(),to=await page.locator('.play-viewport').boundingBox();await page.mouse.move(from!.x+from!.width/2,from!.y+from!.height/2);await page.mouse.down();await page.mouse.move(to!.x+to!.width*.5,to!.y+to!.height*.5,{steps:12});await page.mouse.up();await expect(page.locator(`[data-tile-id="${id}"]`)).toBeVisible();}
 await drag();
 await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.locator('[data-tile-id]')).toHaveCount(0);await expect(rack.locator(`[data-rack-tile="${id}"]`)).toBeVisible();
 await drag();await page.getByRole('button',{name:'Restore Heaven',exact:true}).click();await expect(page.locator('[data-tile-id]')).toHaveCount(0);await expect(rack.locator('[data-rack-tile]')).toHaveCount(14);
 // Separate tap placements each retain their own undo entry.
 const ids=await rack.locator('[data-rack-tile]').evaluateAll(nodes=>nodes.slice(0,2).map(n=>n.getAttribute('data-rack-tile')!));const area=await page.locator('.play-viewport').boundingBox();
 for(let i=0;i<ids.length;i++){await rack.locator(`[data-rack-tile="${ids[i]}"]`).click();await page.mouse.click(area!.x+area!.width*.45+i*150,area!.y+area!.height*.5);await expect(page.locator(`[data-tile-id="${ids[i]}"]`)).toBeVisible();}
 await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.locator('[data-tile-id]')).toHaveCount(1);await expect(page.locator(`[data-tile-id="${ids[0]}"]`)).toBeVisible();
 await page.getByRole('button',{name:'Restore Heaven',exact:true}).click();await expect(page.locator('[data-tile-id]')).toHaveCount(0);await expect(rack.locator('[data-rack-tile]')).toHaveCount(14);
 expect(errors).toEqual([]);console.log('PASS: invalid drag and tap deliveries support single-step Undo and full Restore at a viewport where vacant seats previously intercepted controls.');
}catch(e){await page.screenshot({path:'tmp/qa/tabletop/actions-failure.png'});throw e;}finally{await browser.close();}
