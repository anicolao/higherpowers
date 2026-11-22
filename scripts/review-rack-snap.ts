import {launchBrowser} from './browser';
import {createServer} from 'vite';import {svelte} from '@sveltejs/vite-plugin-svelte';
import type {TileGroup} from '../src/lib/tabletop/rearrangement';
const vite=await createServer({configFile:false,cacheDir:'tmp/snap-vite-cache',publicDir:'static',plugins:[svelte({configFile:false}),{name:'test-paths',resolveId(id){if(id==='$app/paths')return '\0test-paths';},load(id){if(id==='\0test-paths')return 'export const base=""';}}],resolve:{alias:{$lib:new URL('../src/lib',import.meta.url).pathname}},server:{host:'127.0.0.1',port:5204,strictPort:true}});await vite.listen();
const browser=await launchBrowser(),p=await browser.newPage({viewport:{width:1280,height:1000}});const errors:string[]=[];p.on('pageerror',e=>errors.push(e.message));
try{await p.goto('http://127.0.0.1:5204/scripts/fixtures/rack-snap.html');for(const kind of ['procession','choir','join','protected']){
 await p.evaluate(k=>(window as any).loadSnap(k),kind);await p.locator('[data-rack-tile]').first().waitFor();const original:TileGroup[]=await p.evaluate(()=>(window as any).heaven.snapshot());
 const isVertical=kind==='procession'||kind==='choir',expectedX=kind==='procession'?247:200,expectedY=150+44*1.43+14,x=isVertical?expectedX+80+69+12:200+80+3*47+69+8,y=isVertical?expectedY+70+31.46+8:150+70+31.46+8;
 const b=(await p.locator('[data-rack-tile]').nth(1).boundingBox())!;await p.mouse.move(b.x+22,b.y+28);await p.mouse.down();await p.mouse.move(x,y,{steps:15});
 if(isVertical)await p.locator('.magnetic-preview').waitFor();else if(kind==='join')await p.locator('.join-caret').waitFor();else if(await p.locator('.magnetic-preview,.join-caret').count())throw Error('Protected target attracts a rack group');
 await p.mouse.up();await p.waitForTimeout(100);const groups:TileGroup[]=await p.evaluate(()=>(window as any).heaven.snapshot());
 if(kind==='join'){if(groups.length!==1||groups[0].tiles.map(t=>t.rank).join(',')!=='1,2,3,4,5,6')throw Error('Rack group did not join the procession');}
 else if(isVertical){const incoming=groups.find(g=>g.id!=='target')!;if(Math.abs(incoming.x-expectedX)>.01||Math.abs(incoming.y-expectedY)>.01)throw Error(`${kind} did not snap into alignment`);if(kind==='choir'&&incoming.slots?.join(',')!=='0,2,3')throw Error('Choir suit spacing lost');}
 else if(JSON.stringify(groups.find(g=>g.id==='target'))!==JSON.stringify(original[0]))throw Error('Protected Sanctuary was altered');
 await p.evaluate(()=>(window as any).heaven.undo());await p.waitForTimeout(100);if((await p.evaluate(()=>(window as any).heaven.snapshot())).length!==1||await p.locator('[data-rack-tile]').count()!==3)throw Error('Undo did not return the group to the rack');
 }console.log(JSON.stringify({checks:['rack Procession rank magnets','rack Choir suit magnets','rack group joins a row','live snap previews','protected regions unchanged','atomic Undo'],errors}));if(errors.length)throw Error(errors.join('\n'));}finally{await browser.close();await vite.close();}
