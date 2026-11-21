import {launchBrowser} from './browser';
import {mkdir,writeFile} from 'node:fs/promises';
const origin=process.env.REVIEW_URL||'http://127.0.0.1:5198';
const b=await launchBrowser();const p=await b.newPage({viewport:{width:1440,height:1100}}),errors:string[]=[];p.on('pageerror',e=>errors.push(e.message));
function assert(value:unknown,message:string):asserts value{if(!value)throw Error(message);}
const tile=(id:string)=>p.locator(`[data-tile-id="${id}"]`),group=(id:string)=>p.locator(`.soul-group:has([data-tile-id="${id}"])`);
async function position(id:string){return group(id).evaluate(el=>{const matrix=new DOMMatrix(getComputedStyle(el).transform);return {x:matrix.m41,y:matrix.m42,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height};});}
async function ids(){return p.locator('.tile-control').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-tile-id')).sort());}
async function moveWhole(id:string,x:number,y:number,magnet?:'procession'|'choir'){
 await tile(id).dblclick();await group(id).and(p.locator('[data-whole-selected=true]')).waitFor();const start=await position(id),box=await tile(id).boundingBox();assert(box,'Missing source bounds');
 await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.move(box.x+box.width/2+x-start.x,box.y+box.height/2+y-start.y,{steps:10});
 if(magnet){await p.locator(`.magnetic-preview[data-magnet-kind=${magnet}]`).waitFor();await p.screenshot({path:`tmp/qa/digital/magnet-${magnet}.png`});}
 await p.mouse.up();
}
await mkdir('tmp/qa/digital',{recursive:true});await p.goto(`${origin}/gallery?collection=digital`);await p.locator('.soul-group').first().waitFor();await p.evaluate(()=>document.fonts.ready);await p.waitForFunction(()=>Array.from(document.images).every(i=>i.complete));
const initialIds=await ids(),beforeGroups=await p.locator('.soul-group').count();const black=await position('black-b-1'),pitch=black.height+14,surface=await p.locator('.heaven-board').evaluate(el=>({width:el.clientWidth,height:el.clientHeight}));
assert(await p.getByRole('button',{name:'Transpose aligned groups',exact:true}).isDisabled(),'Transpose must require an aligned stack');
await moveWhole('green-b-5',18,surface.height-95);
await moveWhole('red-b-5',black.x+6,black.y+pitch+8,'procession');let red=await position('red-b-1');assert(Math.abs(red.x-black.x)<.1&&Math.abs(red.y-black.y-pitch)<.1,'Rank magnet missed north/south alignment');
await moveWhole('blue-b-5',black.x+5,red.y+pitch-7,'procession');const blue=await position('blue-b-1');await moveWhole('green-b-5',black.x+4,blue.y+pitch+6,'procession');
assert(await p.locator('.soul-group.in-stack').count()===4,'Expected all four Processions in the stack');assert(await p.locator('.soul-group').count()===beforeGroups,'Magnetic snapping merged formations');assert(JSON.stringify(await ids())===JSON.stringify(initialIds),'Magnet changed inventory');
await p.getByRole('button',{name:'Transpose aligned groups',exact:true}).click();await p.waitForFunction(()=>document.querySelector('[data-tile-id="black-b-1"]')?.closest('.soul-group')?.querySelectorAll('.tile-control').length===4);
for(let rank=1;rank<=13;rank++){const row=group(`black-b-${rank}`);assert(await row.locator('.tile-control').count()===4,'A rank column did not become a Choir');assert(await row.getAttribute('data-kind')==='choir','Transposed rank is not a legal Choir');}
assert(JSON.stringify(await ids())===JSON.stringify(initialIds),'Transpose lost, invented, or duplicated souls');await p.locator('.legality[data-status=halo]').waitFor();await p.screenshot({path:'tmp/qa/digital/transposed-choirs.png'});
// Detach a Choir, then restore it with a north/south suit magnet.
const seventh=await position('black-b-7'),sixth=await position('black-b-6');await moveWhole('black-b-7',620,seventh.y);assert(await p.getByRole('button',{name:'Transpose aligned groups',exact:true}).isDisabled(),'Detached Choir should not claim a connected stack');
await moveWhole('black-b-7',sixth.x+6,sixth.y+pitch+6,'choir');const restored=await position('black-b-7');assert(Math.abs(restored.x-sixth.x)<.1&&Math.abs(restored.y-sixth.y-pitch)<.1,'Suit magnet did not restore the Choir');assert(await p.locator('.soul-group.in-stack').count()===13,'Choir stack did not reconnect');
await p.keyboard.press('t');await p.waitForFunction(()=>document.querySelector('[data-tile-id="black-b-1"]')?.closest('.soul-group')?.querySelectorAll('.tile-control').length===13);
for(const color of ['black','red','blue','green']){const row=group(`${color}-b-1`);assert(await row.locator('.tile-control').count()===13,'Reverse transpose did not rebuild a Procession');assert(await row.getAttribute('data-kind')==='procession','Reverse transpose is not a legal Procession');}
assert(JSON.stringify(await ids())===JSON.stringify(initialIds),'Round-trip inventory changed');await p.locator('.legality[data-status=halo]').waitFor();await p.screenshot({path:'tmp/qa/digital/transposed-processions.png'});
await p.keyboard.press('Control+z');await p.waitForFunction(()=>document.querySelector('[data-tile-id="black-b-1"]')?.closest('.soul-group')?.querySelectorAll('.tile-control').length===4);assert(JSON.stringify(await ids())===JSON.stringify(initialIds),'Transpose undo changed inventory');
assert(!errors.length,errors.join('\n'));const report={status:'pass',errors,souls:initialIds.length,checks:['rank magnets','suit magnets','stack discovery','Processions to Choirs','Choirs to Processions','keyboard transpose','atomic undo','physical inventory preserved']};await writeFile('tmp/qa/digital/magnetism-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await b.close();
