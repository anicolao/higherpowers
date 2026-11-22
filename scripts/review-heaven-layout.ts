import {launchBrowser} from './browser';
import {createServer} from 'vite';import {svelte} from '@sveltejs/vite-plugin-svelte';
import type {TileGroup} from '../src/lib/tabletop/rearrangement';
const vite=await createServer({configFile:false,cacheDir:'tmp/snap-vite-cache',publicDir:'static',plugins:[svelte({configFile:false}),{name:'test-paths',resolveId(id){if(id==='$app/paths')return '\0test-paths';},load(id){if(id==='\0test-paths')return 'export const base=""';}}],resolve:{alias:{$lib:new URL('../src/lib',import.meta.url).pathname}},server:{host:'127.0.0.1',port:5204,strictPort:true}});await vite.listen();
const browser=await launchBrowser(),p=await browser.newPage({viewport:{width:1000,height:900}});const errors:string[]=[];p.on('pageerror',e=>errors.push(e.message));
try{
 await p.goto('http://127.0.0.1:5204/scripts/fixtures/heaven-layout.html');await p.locator('[data-tile-id]').first().waitFor();
 await p.getByRole('button',{name:'Tidy Heaven',exact:true}).click();await p.waitForTimeout(90);
 const animated=await p.evaluate(()=>document.getAnimations().some(a=>a.effect?.getTiming().duration===460));if(!animated)throw Error('Tidy did not animate');
 await p.waitForTimeout(500);const tidy:any[]=await p.evaluate(()=>(window as any).heaven.snapshot());if(tidy.some(g=>g.y>=200))throw Error('Tidy did not move upward');
 await p.evaluate(()=>(window as any).loadLayout('transpose'));await p.locator('[data-tile-id]').first().dblclick();await p.getByRole('button',{name:'Transpose aligned groups',exact:true}).click();await p.waitForTimeout(80);
 if(!await p.evaluate(()=>document.getAnimations().some(a=>a.effect?.getTiming().duration===460)))throw Error('Transpose did not animate');await p.waitForTimeout(500);
 const groups:any[]=await p.evaluate(()=>(window as any).heaven.snapshot());if(groups.length!==3||groups.some(g=>g.layoutKind!=='choir'))throw Error('Transpose changed physical tiles incorrectly');
 await p.setViewportSize({width:390,height:844});await p.evaluate(()=>(window as any).loadLayout('scale'));await p.waitForTimeout(100);
 const scale=Number(await p.locator('.heaven-board').getAttribute('data-scale'));if(scale>=1)throw Error('Oversized Heaven was not scaled');
 const bounds=await p.locator('.play-viewport').boundingBox();for(const tile of await p.locator('[data-tile-id]').all()){const b=(await tile.boundingBox())!;if(b.x<bounds!.x||b.y<bounds!.y||b.x+b.width>bounds!.x+bounds!.width||b.y+b.height>bounds!.y+bounds!.height)throw Error('A tile is outside the fixed view');}
 const tile=p.locator('[data-tile-id="black-a-3"]'),b=(await tile.boundingBox())!;await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();await p.mouse.move(b.x+b.width/2-20,b.y+b.height/2-20,{steps:8});await p.mouse.up();await p.waitForTimeout(500);
 const shifted:any[]=await p.evaluate(()=>(window as any).heaven.snapshot());if(Math.abs(shifted.find(g=>g.id==='black').x-(950-20/scale))>1)throw Error(`Scaled drag did not follow the pointer: ${JSON.stringify({scale,shifted,b})}`);
 await p.locator('.play-viewport').hover();await p.mouse.wheel(100,300);await p.waitForTimeout(100);if(!await p.locator('.play-viewport').evaluate(el=>el.scrollTop===0&&el.scrollLeft===0&&getComputedStyle(el).overflow==='clip'))throw Error('Heaven scrolled');
 await p.screenshot({path:'tmp/qa/play/heaven-fixed-mobile.png'});
 if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({checks:['animated tidy','animated transpose','all tiles visible on mobile','scaled pointer coordinates','Heaven never scrolls'],errors}));
}finally{await browser.close();await vite.close();}
