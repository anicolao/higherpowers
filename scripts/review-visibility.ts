import {expect} from '@playwright/test';
import {launchBrowser} from './browser';
import {applyEvent,commandEvent,type State,type Command,type GameEvent} from '../src/lib/engine/engine';
import {mkdir} from 'node:fs/promises';
const origin=process.env.REVIEW_URL??'http://127.0.0.1:5198';
function fixture(tabletop=false,waiting=false){
 for(let seed=0;seed<100;seed++){
  let s:State|null=null;const events:GameEvent[]=[];const owner=tabletop?'tabletop-owner':'practice-player';
  const act=(actor:string,c:Command)=>{const e=commandEvent(s,actor,c,String(events.length));s=applyEvent(s,e);events.push(e);};
  act(owner,{type:'create',name:'You',seed:`visibility-${seed}`,...(tabletop?{seat:'south' as const}:{})});
  const seats=['north','east','west','north-east'] as const;
  for(let i=0;i<(tabletop?4:2);i++)act(owner,{type:'bot',id:`computer-${i}`,name:`Computer ${i+1}`,...(tabletop?{seat:seats[i]}:{})});
  act(owner,{type:'start'});if(s!.starter!==0)continue;
  for(const p of s!.players)if(!waiting||p.id!==owner)act(p.id,{type:'angel',angel:p.options[0]});
  return {events,owner};
 }
 throw Error('No visibility fixture');
}
const b=await launchBrowser();await mkdir('tmp/qa/visibility',{recursive:true});
try{
 for(const interrupt of ['none','cancel','hide'] as const){
  const f=fixture(false,true),ctx=await b.newContext({viewport:{width:1440,height:1000}});await ctx.addInitScript(events=>localStorage.setItem('hp-practice',JSON.stringify(events)),f.events);const p=await ctx.newPage();await p.goto(`${origin}/play?practice=1`);await p.locator('.angel-choice>button').first().click();await expect(p.locator('.computer-flight')).toHaveCount(42);
  if(interrupt==='cancel')await p.locator('.computer-flight').evaluateAll(es=>es.forEach(e=>e.getAnimations().forEach(a=>a.cancel())));
  else if(interrupt==='hide')await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));delete (document as any).hidden;});
  else{
   const first=await p.locator('.computer-flight').first().getAttribute('data-flight-id');await p.locator('.computer-flight').evaluateAll(es=>{es.slice(1).forEach(e=>e.getAnimations().forEach(a=>a.pause()));es[0].getAnimations().forEach(a=>a.finish());});await expect(p.locator(`[data-flight-id="${first}"]`)).toHaveCount(0);await expect(p.locator(`[data-rack-tile="${first}"]`)).toBeVisible();expect(await p.locator('.computer-flight').count()).toBeGreaterThan(0);await p.locator('.computer-flight').evaluateAll(es=>es.forEach(e=>e.getAnimations().forEach(a=>a.play())));
  }
  await expect(p.locator('.computer-flight')).toHaveCount(0);await expect(p.locator('.your-hand [data-rack-tile]')).toHaveCount(14);expect(await p.locator('[data-rack-tile],[data-tile-back]').evaluateAll(es=>es.every(e=>getComputedStyle(e).visibility==='visible'))).toBe(true);
  if(interrupt==='hide'){
   for(const tile of await p.locator('.your-hand [data-rack-tile]').all())await tile.click();
   const source=(await p.locator('.your-hand [data-rack-tile]').first().boundingBox())!;await p.mouse.move(source.x+source.width/2,source.y+source.height/2);await p.mouse.down();await p.mouse.move(source.x+source.width/2,source.y-100,{steps:8});await expect(p.locator('.rack-ghost')).toBeVisible();
   await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));delete (document as any).hidden;});await expect(p.locator('.rack-ghost')).toHaveCount(0);await expect(p.locator('.rack button.lifted')).toHaveCount(0);await p.mouse.up();
  }
  // Card titles are artwork labels, independent of fullscreen page-header rules.
  await p.addStyleTag({content:'header{display:none!important}'});
  await expect(p.locator('.player-seat .card-heading')).toHaveCount(2);
  for(const heading of await p.locator('.player-seat .card-heading').all()){await expect(heading).toBeVisible();await expect(heading.locator('span')).toHaveText('ANGEL');}
  // Readable Angel titles must remain unobscured even when a power is spent.
  await p.locator('.player-seat .angel-object').evaluateAll(async es=>{es.forEach(e=>e.classList.add('spent'));await new Promise(requestAnimationFrame);await Promise.all(es.flatMap(e=>e.getAnimations().map(a=>a.finished.catch(()=>{}))));});
  const names=await p.locator('.player-seat .angel-object h3').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {text:e.textContent,font:parseFloat(getComputedStyle(e).fontSize),clear:!!hit?.closest('.angel-object')};}));for(const n of names){expect(n.text).toBeTruthy();expect(n.font).toBeGreaterThan(9);expect(n.clear,`${n.text} is obscured by another status artifact`).toBe(true);}
  if(interrupt==='none'){
   await p.screenshot({path:'tmp/qa/visibility/web-after.png'});
   for(const viewport of [{width:640,height:360},{width:390,height:844}]){
    await p.setViewportSize(viewport);await expect.poll(()=>p.locator('.your-hand .rack').evaluate(root=>{const box=root.getBoundingClientRect();return [...root.querySelectorAll('[data-rack-tile]')].every(el=>{const r=el.getBoundingClientRect();return r.top>=box.top-1&&r.bottom<=box.bottom+1&&r.left>=box.left-1&&r.right<=box.right+1;});})).toBe(true);
   }
  }console.log(`PASS web ${interrupt}: each landed/cancelled tile reappears; spent Angel names stay readable and uncovered.`);await ctx.close();
 }
 const f=fixture(true),ctx=await b.newContext({viewport:{width:1440,height:1000}});await ctx.addInitScript(events=>localStorage.setItem('hp-tabletop-local',JSON.stringify(events)),f.events);const p=await ctx.newPage();await p.goto(`${origin}/tabletop?local=1`);
 for(const viewport of [{width:1440,height:1000},{width:1000,height:1440}]){
  await p.setViewportSize(viewport);await expect(p.locator('.covered-tiles')).toHaveCount(5);
  for(const seat of ['north','east','west','north-east']){
   const rack=p.locator(`[data-tabletop-seat="${seat}"] .covered-tiles`);await expect(rack.locator('[data-tile-back]')).toHaveCount(14);const box=(await rack.boundingBox())!;expect(box.width).toBeGreaterThan(15);expect(box.height).toBeGreaterThan(15);expect(await rack.evaluate(el=>el.clientWidth)).toBeGreaterThan(200);await expect(rack.locator('[data-tile-back]').first()).toBeVisible();
  }
  await p.getByRole('button',{name:'Reveal You’s rack',exact:true}).click();await expect(p.locator('[data-private-seat] [data-rack-tile]')).toHaveCount(14);await p.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(p.locator('[data-private-seat]')).toHaveCount(0);for(const seat of ['north','east','west','north-east'])expect((await p.locator(`[data-tabletop-seat="${seat}"] .covered-tiles`).boundingBox())!.width).toBeGreaterThan(15);
  await p.screenshot({path:`tmp/qa/visibility/tabletop-${viewport.width}-after.png`});console.log(`PASS tabletop ${viewport.width}×${viewport.height}: all computer racks have visible tile backs at every edge, including after privacy covering.`);
 }
 await ctx.close();
 const gallery=await b.newPage({viewport:{width:1440,height:1100}});await gallery.goto(`${origin}/gallery`);await gallery.evaluate(()=>document.fonts.ready);await expect(gallery.locator('.gallery-item .card-heading')).toHaveCount(27);
 const titles=await gallery.locator('.gallery-item .game-card').evaluateAll(cards=>cards.map(card=>{const heading=card.querySelector('.card-heading')!,frame=card.querySelector('.frame-layer')!;return {name:heading.querySelector('h3')?.textContent,front:Number(getComputedStyle(heading).zIndex)>Number(getComputedStyle(frame).zIndex),fits:heading.scrollHeight<=heading.clientHeight+2};}));for(const title of titles){expect(title.name).toBeTruthy();expect(title.front).toBe(true);expect(title.fits,`${title.name} heading overflows`).toBe(true);}await gallery.close();console.log('PASS gallery: all 27 card headings remain above their frames and fit their title areas.');
}finally{await b.close();}
