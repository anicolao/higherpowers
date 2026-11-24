import {expect} from '@playwright/test';
import {launchBrowser} from './browser';
if(process.env.VITE_FIREBASE_EMULATORS!=='true')throw Error('Run test:launch with the demo Firebase emulators.');
const origin='http://127.0.0.1:5207',server=Bun.spawn(['bunx','vite','dev','--host','127.0.0.1','--port','5207','--strictPort'],{env:{...process.env,VITE_FIREBASE_EMULATORS:'true'},stdout:'ignore',stderr:'inherit'});
const browser=await launchBrowser(),errors:string[]=[];
try{
 await expect.poll(async()=>{try{return (await fetch(`${origin}/play/gameroom-launch.json`)).status;}catch{return 0;}},{timeout:20000}).toBe(200);
 expect(await (await fetch(`${origin}/play/gameroom-launch.json`)).json()).toEqual({game:'higherpowers',protocol:'gameroom-url',version:1});
 const contexts=await Promise.all([0,1,2,3,4,5].map(()=>browser.newContext({viewport:{width:1440,height:1000}}))),pages=await Promise.all(contexts.map(c=>c.newPage()));
 for(const p of pages){p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(15000);}
 const [host,guest,friend,other,full,outsider]=pages,code=crypto.randomUUID().replaceAll('-','').slice(0,8).toUpperCase();
 const invite=(mode:string,name:string)=>`${origin}/play/?table=${code}&launch=${mode}&name=${encodeURIComponent(name)}&uid=not-a-game-identity&returnTo=javascript:bad`;
 const state=(p:typeof host)=>p.evaluate(async id=>{const r=await import('/src/lib/backend/'+'repository.ts');return r.readGame(id);},code);
 await guest.goto(invite('join','Alex'));await expect(guest.getByRole('status')).toHaveText('Waiting for your host to open the table…');
 await host.goto(invite('create','Alex'));for(const p of [host,guest])await expect(p.locator('.setup-table')).toBeVisible();
 await expect.poll(async()=> (await state(host)).players.length).toBe(2);
 let s=await state(host);expect(s.players.map(p=>p.name)).toEqual(['Alex','Alex']);expect(new Set(s.players.map(p=>p.id)).size).toBe(2);expect(s.players.some(p=>p.id==='not-a-game-identity')).toBe(false);
 const revision=s.revision,owner=s.owner;
 await host.goto(invite('create','Changed preference'));await expect(host.locator('.setup-table')).toBeVisible();expect((await state(host)).revision).toBe(revision);expect((await state(host)).owner).toBe(owner);
 await guest.goto(invite('join','Another preference'));await expect(guest.locator('.setup-table')).toBeVisible();expect((await state(host)).revision).toBe(revision);
 await outsider.goto(invite('create','Intruder'));await expect(outsider.getByRole('alert')).toContainText('already belongs to someone else');expect((await state(host)).revision).toBe(revision);
 await Promise.all([[friend,'Friend'],[other,'Other'],[full,'Fifth']].map(async([p,n])=>{await (p as typeof host).goto(invite('join',n as string));await expect((p as typeof host).locator('.setup-table')).toBeVisible();}));
 await expect.poll(async()=> (await state(host)).players.length).toBe(5);
 await outsider.goto(invite('join','Sixth'));await expect(outsider.getByRole('alert')).toContainText('lobby is full');
 // The original long Game Room code becomes a friendly five-letter invitation.
 expect(new URL(host.url()).searchParams.get('table')).toMatch(/^[A-Z]{5}$/);
 const reloadUrl=guest.url();await guest.goto(reloadUrl);await expect(guest.locator('.setup-table')).toBeVisible();expect((await state(host)).players.length).toBe(5);
 await host.getByRole('button',{name:'Deal Angels',exact:true}).click();await expect(guest.locator('.angel-choice>button')).toHaveCount(2);
 await outsider.goto(invite('join','Too late'));await expect(outsider.getByRole('alert')).toContainText('game has started');
 const tabletop=await contexts[5].newPage();tabletop.on('pageerror',e=>errors.push(e.message));await tabletop.goto(`${origin}/tabletop/`);await expect(tabletop.getByRole('button',{name:/^Join /})).toHaveCount(8);await tabletop.getByRole('button',{name:'Join north',exact:true}).click();await expect(tabletop.getByRole('dialog',{name:'Choose your Angel',exact:true})).toBeVisible();
 await outsider.goto(`${origin}/play/?launch=join&table=BAD&name=Alex`);await expect(outsider.getByRole('alert')).toBeVisible();
 expect(errors).toEqual([]);
 console.log('PASS: guest-first launch, independent identities with equal names, idempotent create/join, collision protection, simultaneous guests, capacity, alias reload, deal sync, late join rejection, invalid invitation, and name-free eight-position tabletop entry.');
}finally{await browser.close();server.kill();await server.exited;}
