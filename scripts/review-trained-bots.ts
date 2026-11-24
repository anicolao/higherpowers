import {expect} from '@playwright/test';import {launchBrowser} from './browser';
import {applyEvent,commandEvent,type State,type GameEvent,type Command} from '../src/lib/engine/engine';
import {availableBotLevels} from '../src/lib/engine/trained-bot';
const browser=await launchBrowser(),origin=process.env.REVIEW_URL??'http://127.0.0.1:5198';
try{
 for(const difficulty of availableBotLevels){
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));let saved:GameEvent[]=[];
  for(let attempt=0;attempt<30;attempt++){
   let s:State|null=null;const events:GameEvent[]=[],act=(actor:string,c:Command)=>{const e=commandEvent(s,actor,c,crypto.randomUUID());s=applyEvent(s,e);events.push(e);};
   act('practice-player',{type:'create',name:'You',seed:`worker-${difficulty}-${attempt}`});act('practice-player',{type:'bot',id:'computer',name:difficulty,difficulty});act('practice-player',{type:'start'});for(const p of s!.players)act(p.id,{type:'angel',angel:p.options.find(a=>a!=='jegudiel')!});if(s!.players[s!.turn].id==='computer'){saved=events;break;}
  }
  expect(saved.length).toBeGreaterThan(0);await page.goto(`${origin}/play`);await page.evaluate(events=>localStorage.setItem('hp-practice',JSON.stringify(events)),saved);await page.goto(`${origin}/play?practice=1`);
  await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hp-practice')!).length),{timeout:30000}).toBeGreaterThan(saved.length);
  await expect(page.locator('.your-hand.active')).toBeVisible({timeout:30000});
  let events=await page.evaluate(()=>JSON.parse(localStorage.getItem('hp-practice')!)) as GameEvent[];let s:State|null=null;for(const event of events)s=applyEvent(s,event);expect(s!.players[1].difficulty).toBe(difficulty);expect(s!.players[s!.turn].id).toBe('practice-player');expect(events.slice(saved.length).every(e=>e.actor==='computer')).toBe(true);await expect(page.getByRole('alert')).toHaveCount(0);expect(errors).toEqual([]);
  await page.reload();await expect(page.locator('.your-hand.active')).toBeVisible();await expect(page.getByRole('alert')).toHaveCount(0);console.log(`PASS: ${difficulty} worker executes legal animated turns, stores its level, hands control back, and reloads.`);await page.close();
 }
 const tabletop=await browser.newPage({viewport:{width:1440,height:1000}});await tabletop.goto(`${origin}/tabletop?local=1`);await tabletop.getByRole('button',{name:'Join south',exact:true}).click();await tabletop.locator('.angel-option').first().click();await tabletop.getByRole('button',{name:'Tabletop menu',exact:true}).click();await expect(tabletop.getByLabel('Tabletop computer difficulty')).toBeVisible();await tabletop.getByLabel('Tabletop computer difficulty').selectOption(availableBotLevels.at(-1)!);await tabletop.getByRole('button',{name:'Close tabletop menu',exact:true}).click();await tabletop.getByRole('button',{name:'Add computer at north',exact:true}).click();await expect(tabletop.getByRole('button',{name:'Deal souls',exact:true})).toBeEnabled();const log=await tabletop.evaluate(()=>JSON.parse(localStorage.getItem('hp-tabletop-local')!));expect(log.find((e:GameEvent)=>e.command.type==='bot').command.difficulty).toBe(availableBotLevels.at(-1));console.log('PASS: tabletop difficulty selection registers the selected level and the worker chooses an Angel.');
}finally{await browser.close();}
