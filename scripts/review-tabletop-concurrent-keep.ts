import {expect} from '@playwright/test';
import {launchBrowser} from './browser';
const origin=process.env.REVIEW_URL||'http://127.0.0.1:5198';
const browser=await launchBrowser(),context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors:string[]=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(`${origin}/tabletop`);
 for(const seat of ['south','north']){await page.getByRole('button',{name:`Join ${seat}`,exact:true}).click();const chooser=page.getByRole('dialog',{name:'Choose your Angel',exact:true});await expect(chooser).toBeVisible();const options=chooser.locator('.angel-option');const button=await options.evaluateAll(nodes=>nodes.findIndex(n=>n.getAttribute('aria-label')!=='Choose Jegudiel'));await options.nth(button).click();await expect(chooser).toHaveCount(0);}
 const duplicate=await context.newPage();duplicate.on('pageerror',e=>errors.push(e.message));await duplicate.goto(page.url());await expect(duplicate.getByRole('button',{name:'Deal souls',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Deal souls',exact:true}).click();for(const p of [page,duplicate]){await expect(p.locator('.heaven-board')).toBeVisible();await expect(p.locator('.computer-flight')).toHaveCount(0,{timeout:10000});await expect(p.locator('.play-area')).toHaveAttribute('data-turning','false');}
 const id=new URL(page.url()).searchParams.get('table')!;
 const inspection=await page.evaluate(async id=>{const repo=await import('/src/lib/backend/'+'repository.ts');const s=await repo.readGame(id);return await repo.append(id,s,s.players[s.turn].id,{type:'draw',turn:s.turnNumber});},id);
 expect(inspection.phase).toBe('inspect');expect(inspection.inspection!.tiles).toHaveLength(1);
 await expect.poll(async()=>page.evaluate(async id=>{const repo=await import('/src/lib/backend/'+'repository.ts');const s=await repo.readGame(id);return s.turnNumber;},id),{timeout:15000}).toBe(inspection.turnNumber+1);
 // One old inspection snapshot exercises conflict recovery; a fresh snapshot exercises preflight deduplication.
 const actor=inspection.inspection!.player,command={type:'keep' as const,tile:inspection.inspection!.tiles[0],turn:inspection.turnNumber};
 const outcomes=await Promise.all([page.evaluate(async({id,s,actor,command})=>{const repo=await import('/src/lib/backend/'+'repository.ts');return await repo.append(id,s,actor,command);},{id,s:inspection,actor,command}),duplicate.evaluate(async({id,actor,command})=>{const repo=await import('/src/lib/backend/'+'repository.ts');return await repo.append(id,await repo.readGame(id),actor,command);},{id,actor,command})]);
 expect(outcomes[0].revision).toBe(inspection.revision+1);expect(outcomes[1].revision).toBe(inspection.revision+1);expect(outcomes[0].turnNumber).toBe(inspection.turnNumber+1);
 const stale=await page.evaluate(async({id,s,actor,command})=>{const repo=await import('/src/lib/backend/'+'repository.ts');const messages:string[]=[];for(const c of [{...command,tile:s.bag[0]},{type:'draw' as const,turn:command.turn}])try{await repo.append(id,await repo.readGame(id),actor,c);messages.push('unexpected success');}catch(e){messages.push((e as Error).message);}return {messages,state:await repo.readGame(id)};},{id,s:inspection,actor,command});
 expect(stale.messages).toEqual(['This action belongs to an earlier turn.','This action belongs to an earlier turn.']);expect(stale.state.revision).toBe(inspection.revision+1);
 for(const p of [page,duplicate])await expect(p.getByRole('alert')).toHaveCount(0);expect(errors).toEqual([]);console.log('PASS: two tabs share automatic keep safely; exact duplicate returns the committed result from old and fresh snapshots; wrong-tile keep and stale draw remain rejected; exactly one keep committed and one turn advanced.');
}finally{await browser.close();}
