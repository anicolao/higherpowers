import {expect} from '@playwright/test';
import {launchBrowser} from './browser';
import {applyEvent,commandEvent,replay,type State,type Command,type GameEvent} from '../src/lib/engine/engine';
import {findMeld} from '../src/lib/engine/bot';
const origin=process.env.REVIEW_URL||'http://127.0.0.1:5198';
function fixture(bot=false,multiple=false){
 for(let seed=0;seed<500;seed++){
  let state:State|null=null;const events:GameEvent[]=[];const act=(actor:string,c:Command)=>{const e=commandEvent(state,actor,c,crypto.randomUUID());state=applyEvent(state,e);events.push(e);};
  act('tabletop-owner',{type:'create',name:'South',seed:`draw-order-${seed}`,seat:'south'});act('tabletop-owner',bot?{type:'bot',id:'north',name:'North',seat:'north'}:{type:'seat',id:'north',name:'North',seat:'north'});act('tabletop-owner',{type:'start'});
  if(state!.players.some(p=>p.options.every(a=>a==='uriel'||a==='jegudiel')))continue;
  for(const p of state!.players)act(p.id,{type:'angel',angel:p.options.find(a=>a!=='uriel'&&a!=='jegudiel')!});
  let s=state! as State;if(s.players[s.turn].id!==(bot?'north':'tabletop-owner'))continue;
  if(bot&&findMeld(s,s.players[s.turn]))continue;
  if(multiple){const meld=findMeld(s,s.players[0]);if(!meld)continue;act('tabletop-owner',{type:'organize',groups:[{id:'opening',tiles:meld,x:250,y:200,zone:null}],opening:meld,turn:s.turnNumber});s=state!;act('north',{type:'draw',turn:s.turnNumber});s=state!;act('north',{type:'keep',tile:s.inspection!.tiles[0],turn:s.turnNumber});}
  return {events,state:state! as State};
 }throw Error('No draw fixture');
}
const browser=await launchBrowser();
try{for(const mode of ['human-single','human-choice','covered-computer']){
 const bot=mode==='covered-computer',f=fixture(bot,mode==='human-choice'),ctx=await browser.newContext({viewport:{width:1440,height:900}}),page=await ctx.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await ctx.addInitScript(events=>localStorage.setItem('hp-tabletop-local',JSON.stringify(events)),f.events);await page.goto(`${origin}/tabletop?local=1`);await expect(page.locator('.play-area')).toBeVisible();
 const id=f.state.bag[0],actor=f.state.players[f.state.turn],target=f.state.players[(f.state.turn+1)%2],oldAngle=actor.seat==='north'?180:0;
 if(!bot){await expect(page.locator('.play-area')).toHaveAttribute('data-turning','false');await page.getByRole('button',{name:`Reveal ${actor.name}’s rack`,exact:true}).click();}
 await page.evaluate(({id,angle})=>{
  const frames:any[]=[];(window as any).__drawFrames=frames;const start=performance.now();
  function record(){const scene=document.querySelector('.play-area') as HTMLElement;if(!scene)return;const transform=new DOMMatrixReadOnly(getComputedStyle(scene).transform),a=Math.atan2(transform.b,transform.a)*180/Math.PI;const tile=document.querySelector(`[data-rack-tile="${id}"],[data-tile-back="${id}"]`) as HTMLElement|null;
   frames.push({time:performance.now()-start,angle:a,flight:!!document.querySelector(`[data-flight-id="${id}"]`),visible:!!tile&&getComputedStyle(tile).visibility!=='hidden',turning:scene.dataset.turning});if(performance.now()-start<4500)requestAnimationFrame(record);
  }requestAnimationFrame(record);
 },{id,angle:oldAngle});
 if(!bot){await page.getByRole('button',{name:'Draw a soul',exact:true}).click();if(mode==='human-choice')await page.locator('.tabletop-inspection button').first().click();}
 await expect(page.locator(`[data-flight-id="${id}"]`)).toBeVisible({timeout:10000});await expect(page.locator(`[data-flight-id="${id}"]`)).toHaveCount(0,{timeout:10000});await expect(page.locator('.play-area')).toHaveAttribute('data-turning','false');
 const frames=await page.evaluate(()=>(window as any).__drawFrames as {time:number;angle:number;flight:boolean;visible:boolean;turning:string}[]),moving=frames.filter(f=>f.flight);expect(moving.length).toBeGreaterThan(4);
 const first=moving[0],last=moving.at(-1)!,departed=frames.find(f=>f.time>=first.time&&Math.abs((((f.angle-oldAngle+540)%360)+360)%360-180)>2);
 expect(departed).toBeDefined();expect(departed!.time).toBeGreaterThan(last.time);expect(frames.filter(f=>f.time<=last.time&&f.visible)).toHaveLength(0);
 await expect(page.locator(`[data-rack-tile="${id}"],[data-tile-back="${id}"]`)).toBeVisible();
 const s=replay(await page.evaluate(()=>JSON.parse(localStorage.getItem('hp-tabletop-local')!)));expect(s.players[s.turn].id).toBe(target.id);expect(s.players.find(p=>p.id===actor.id)!.hand).toContain(id);expect(errors).toEqual([]);
 console.log(`PASS ${mode}: rack hidden during flight; landing before rotation (${Math.round(last.time)}ms < ${Math.round(departed!.time)}ms).`);await ctx.close();
}}finally{await browser.close();}
