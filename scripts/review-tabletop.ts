import {expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {launchBrowser} from './browser';
import {applyEvent,commandEvent,replay,type State,type Command,type GameEvent} from '../src/lib/engine/engine';
import {formation} from '../src/lib/engine/formations';
import type {TableSeat} from '../src/lib/tabletop/seats';
const origin=process.env.REVIEW_URL||'http://127.0.0.1:5198';
await mkdir('tmp/qa/tabletop',{recursive:true});
const browser=await launchBrowser(),page=await browser.newPage({viewport:{width:1800,height:1100}}),errors:string[]=[];
page.setDefaultTimeout(15000);
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(`${origin}/tabletop?local=1`);
 await expect(page.locator('[data-tabletop-seat]')).toHaveCount(8);
 await page.screenshot({path:'tmp/qa/tabletop/01-walkup.png'});
 async function join(seat:string,name:string){const port=page.locator(`[data-tabletop-seat="${seat}"]`);await port.getByRole('button',{name:`Join ${seat}`,exact:true}).click();await port.getByRole('textbox').fill(name);await port.getByRole('button',{name:'Sit here',exact:true}).click();await expect(port).toHaveClass(/occupied/);}
 await join('north-west','North');await join('south-east','South');await join('east','East');await join('west','West');await join('south','Middle');
 await expect(page.getByRole('button',{name:'Join north',exact:true})).toBeDisabled();
 await page.screenshot({path:'tmp/qa/tabletop/02-five-seats.png'});
 await page.getByRole('button',{name:'Deal Angels',exact:true}).click();
 await expect(page.locator('[data-private-seat]')).toHaveCount(0);
 for(const name of ['North','South','East','West','Middle']){
  await page.getByRole('button',{name:`Reveal ${name}’s rack`,exact:true}).click();
  const port=page.locator('.tabletop-port').filter({has:page.locator(`[aria-label="Choose ${name}’s Angel"]`)});
  await port.locator('.seat-choices button').first().click();
 }
 await expect(page.locator('.heaven-board')).toBeVisible();await expect(page.locator('.play-area')).toHaveAttribute('data-turning','false');await expect(page.locator('.computer-flight')).toHaveCount(0,{timeout:10000});
 // New rounds fold every private rack before any tile faces are rendered.
 await expect(page.locator('[data-private-seat]')).toHaveCount(0);
 await expect(page.locator('[data-rack-tile]')).toHaveCount(0);
 await page.screenshot({path:'tmp/qa/tabletop/03-covered-deal.png'});
 const log=await page.evaluate(()=>JSON.parse(localStorage.getItem('hp-tabletop-local')!));
 let state=replay(log),active=state.players[state.turn];
 await page.getByRole('button',{name:`Reveal ${active.name}’s rack`,exact:true}).click();
 await expect(page.locator(`[data-private-seat="${active.id}"] [data-rack-tile]`)).toHaveCount(14);
 const rack=page.locator(`[data-private-seat="${active.id}"]`);
 await rack.getByRole('button',{name:'Sort rack by number',exact:true}).click();await page.waitForTimeout(550);
 await page.screenshot({path:'tmp/qa/tabletop/04-screened-rack.png'});
 const tile=rack.locator('[data-rack-tile]').first(),id=await tile.getAttribute('data-rack-tile'),from=await tile.boundingBox(),board=await page.locator('.play-viewport').boundingBox();
 await page.mouse.move(from!.x+from!.width/2,from!.y+from!.height/2);await page.mouse.down();await page.mouse.move(board!.x+board!.width*.58,board!.y+board!.height*.55,{steps:15});await page.mouse.up();
 await expect(page.locator(`[data-tile-id="${id}"]`)).toBeVisible();
 await expect(page.locator(`[data-rack-tile="${id}"]`)).toHaveCount(0);
 await page.getByRole('button',{name:`Cover ${active.name}’s rack`,exact:true}).click();
 await expect(page.locator('[data-rack-tile]')).toHaveCount(0);
 await page.reload();await expect(page.locator('[data-private-seat]')).toHaveCount(0);
 await page.setViewportSize({width:1100,height:1800});await expect(page.locator('.play-area')).toHaveAttribute('data-turning','false');await page.screenshot({path:'tmp/qa/tabletop/05-portrait.png'});
 for(const port of await page.locator('[data-tabletop-seat]').all()){const box=await port.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(-1);expect(box!.y).toBeGreaterThanOrEqual(-1);expect(box!.x+box!.width).toBeLessThanOrEqual(1101);expect(box!.y+box!.height).toBeLessThanOrEqual(1801);}
 expect(await page.evaluate(()=>({x:document.documentElement.scrollWidth<=innerWidth,y:document.documentElement.scrollHeight<=innerHeight}))).toEqual({x:true,y:true});

 await page.setViewportSize({width:1800,height:1100});
 for(const seat of ['south','north','east','west'] as TableSeat[]){
  let saved:GameEvent[]=[],opening:string[]=[];
  for(let seed=0;seed<100;seed++){
   let s:State|null=null;const transcript:GameEvent[]=[];const act=(actor:string,c:Command)=>{const event=commandEvent(s,actor,c,crypto.randomUUID());s=applyEvent(s,event);transcript.push(event);};
   act('tabletop-owner',{type:'create',name:'Mover',seed:`rotated-${seat}-${seed}`,seat});act('tabletop-owner',{type:'seat',id:'other-player',name:'Other',seat:seat==='north'?'south':'north'});act('tabletop-owner',{type:'start'});
   for(const p of s!.players)act(p.id,{type:'angel',angel:p.options.find(a=>a!=='jegudiel')!});
   const candidate=s! as State;if(candidate.players[candidate.turn].id!=='tabletop-owner')continue;
   const hand=candidate.players.find(p=>p.id==='tabletop-owner')!.hand;
   outer:for(let a=0;a<hand.length;a++)for(let b=a+1;b<hand.length;b++)for(let c=b+1;c<hand.length;c++){
    const ids=[hand[a],hand[b],hand[c]];
    for(const order of [ids,[ids[1],ids[0],ids[2]],[ids[2],ids[0],ids[1]],[ids[0],ids[2],ids[1]],[ids[1],ids[2],ids[0]],[ids[2],ids[1],ids[0]]])if(formation(order.map(id=>candidate.tiles[id]),candidate.decrees[0])){opening=order;break outer;}
   }
   if(opening.length){saved=transcript;break;}
  }
  expect(saved.length).toBeGreaterThan(0);
  await page.evaluate(events=>localStorage.setItem('hp-tabletop-local',JSON.stringify(events)),saved);await page.reload();await expect(page.locator('.play-area')).toHaveAttribute('data-turning','false');
  await page.getByRole('button',{name:'Reveal Mover’s rack',exact:true}).click();
  const privateRack=page.locator('[data-private-seat="tabletop-owner"]');
  for(const id of opening)await privateRack.locator(`[data-rack-tile="${id}"]`).click();
  const first=await privateRack.locator(`[data-rack-tile="${opening[0]}"]`).boundingBox(),area=await page.locator('.play-viewport').boundingBox();
  if(seat==='east'){
   const cdp=await page.context().newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:first!.x+first!.width/2,y:first!.y+first!.height/2}]});
   for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:first!.x+first!.width/2+(area!.x+area!.width*.55-first!.x-first!.width/2)*i/12,y:first!.y+first!.height/2+(area!.y+area!.height*.45-first!.y-first!.height/2)*i/12}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
  }else{await page.mouse.move(first!.x+first!.width/2,first!.y+first!.height/2);await page.mouse.down();await page.mouse.move(area!.x+area!.width*.55,area!.y+area!.height*.45,{steps:15});await page.mouse.up();}
  for(const id of opening)await expect(page.locator(`[data-tile-id="${id}"]`)).toBeVisible();
  const view=await page.locator('.play-viewport').boundingBox();
  await expect(page.locator('.play-area')).toHaveAttribute('data-square',String(seat==='east'||seat==='west'));
  if(seat==='east'||seat==='west')expect(Math.abs(view!.width-view!.height)).toBeLessThan(2);else expect(view!.width/view!.height).toBeGreaterThan(2);
  const movingTile=page.locator(`[data-tile-id="${opening[0]}"]`);await movingTile.dblclick();
  const old=await movingTile.boundingBox();await page.mouse.move(old!.x+old!.width/2,old!.y+old!.height/2);await page.mouse.down();await page.mouse.move(old!.x+old!.width/2+50,old!.y+old!.height/2+35,{steps:12});await page.mouse.up();
  await expect.poll(async()=>{const b=await movingTile.boundingBox();return Math.abs(b!.x-old!.x-50)+Math.abs(b!.y-old!.y-35);}).toBeLessThan(4);
  await page.screenshot({path:`tmp/qa/tabletop/08-${seat}-facing.png`});

  await expect(page.getByRole('button',{name:'Finish organizing',exact:true})).toHaveAttribute('aria-disabled','false');
  await page.getByRole('button',{name:'Finish organizing',exact:true}).click();
  await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hp-tabletop-local')!).at(-1).command.type)).toBe('organize');
  await expect(page.locator('.play-area')).toHaveAttribute('data-turning','false');await page.getByRole('button',{name:'Reveal Other’s rack',exact:true}).click();
  await expect(page.locator('.play-area')).toHaveAttribute('data-turning','false');await page.getByRole('button',{name:'Draw a soul',exact:true}).click();
  await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hp-tabletop-local')!).at(-1).command.type)).toBe('keep');
  const after=replay(await page.evaluate(()=>JSON.parse(localStorage.getItem('hp-tabletop-local')!)));
  expect(after.players.find(p=>p.id==='tabletop-owner')!.opened).toBe(true);expect(after.players.find(p=>p.id==='other-player')!.hand).toHaveLength(15);
  await expect(page.locator('.play-area')).toHaveAttribute('data-turning','false');await expect(page.locator('.computer-flight')).toHaveCount(0);await page.screenshot({path:`tmp/qa/tabletop/06-${seat}-played.png`});
 }
 // The leading player inspects two; those faces must stay behind their screen.
 await expect(page.locator('.computer-flight')).toHaveCount(0,{timeout:10000});
 await expect(page.locator('.play-area')).toHaveAttribute('data-turning','false');await page.getByRole('button',{name:'Draw a soul',exact:true}).click();
 await expect(page.locator('[data-private-seat="tabletop-owner"] .tabletop-inspection button')).toHaveCount(2);
 await expect(page.locator('.inspection-rack')).toHaveCount(0);
 await page.getByRole('button',{name:'Cover Mover’s rack',exact:true}).click();
 await expect(page.locator('.tabletop-inspection')).toHaveCount(0);
 await page.reload();await expect(page.locator('.tabletop-inspection')).toHaveCount(0);
 await page.getByRole('button',{name:'Reveal Mover’s rack',exact:true}).click();
 await page.locator('[data-private-seat="tabletop-owner"] .tabletop-inspection button').first().click();
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(page.locator('[data-private-seat]')).toHaveCount(0);
 expect(errors).toEqual([]);console.log('PASS: eight walk-up seats, five-player cap, clockwise setup, screened Angel choices/racks, rotating full-width/square Heaven, openings and pointer-correct table drags from all four edges (including touch), automatic single draws, private two-choice inspection across reload, blur cover, portrait fit.');
}finally{await writeFile('tmp/qa/tabletop/errors.json',JSON.stringify(errors));await browser.close();}
