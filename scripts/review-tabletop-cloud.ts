import {expect} from '@playwright/test';
import {launchBrowser} from './browser';
const origin=process.env.REVIEW_URL||'http://127.0.0.1:5198';
const browser=await launchBrowser(),page=await browser.newPage({viewport:{width:1800,height:1100}}),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
page.setDefaultTimeout(15000);
try{
 await page.goto(`${origin}/tabletop`);await page.getByRole('button',{name:'Join north',exact:true}).click();await page.locator('.seat-join input').fill('Cloud North');await page.getByRole('button',{name:'Sit here',exact:true}).click();
 await expect(page.locator('[data-tabletop-seat=north]')).toHaveClass(/occupied/,{timeout:20000});
 await page.getByRole('button',{name:'Join west',exact:true}).click();await page.locator('.seat-join input').fill('Cloud West');await page.getByRole('button',{name:'Sit here',exact:true}).click();
 await expect(page.locator('[data-tabletop-seat=west]')).toHaveClass(/occupied/,{timeout:15000});
 await page.getByRole('button',{name:'Add computer at south-east',exact:true}).click();await expect(page.locator('[data-tabletop-seat=south-east]')).toHaveClass(/occupied/,{timeout:15000});
 await page.getByRole('button',{name:'Deal Angels',exact:true}).click();
 for(const name of ['Cloud North','Cloud West']){await page.getByRole('button',{name:`Reveal ${name}’s rack`,exact:true}).click();await page.locator(`[aria-label="Choose ${name}’s Angel"]`).locator('button').first().click();}
 await expect(page.locator('.heaven-board')).toBeVisible({timeout:15000});await expect(page.locator('[data-private-seat]')).toHaveCount(0);
 const url=page.url();await page.reload();await expect(page.locator('.heaven-board')).toBeVisible({timeout:15000});await expect(page.locator('[data-private-seat]')).toHaveCount(0);expect(page.url()).toBe(url);
 await page.getByRole('button',{name:'Reveal Cloud North’s rack',exact:true}).click();await expect(page.locator('[data-private-seat] [data-rack-tile]').first()).toBeVisible();
 await page.getByRole('button',{name:'Tabletop menu',exact:true}).click();const download=page.waitForEvent('download');await page.getByRole('button',{name:'Save replay',exact:true}).click();const replay=await download;await replay.saveAs('tmp/qa/tabletop/cloud-replay.json');const file=await Bun.file('tmp/qa/tabletop/cloud-replay.json').json();expect(file.events.length).toBeGreaterThanOrEqual(7);expect(file.events.some((e:any)=>e.command.type==='seat')).toBe(true);
 await page.screenshot({path:'tmp/qa/tabletop/07-cloud-reloaded.png'});await expect(page.getByRole('alert')).toHaveCount(0);expect(errors).toEqual([]);console.log('PASS: Firebase tabletop creation, local human actor control, chosen computer seat, Angel deal/choices, clockwise start, durable reload, covered private hands, complete replay export.');
}catch(e){await page.screenshot({path:'tmp/qa/tabletop/cloud-failure.png'});console.log((await page.locator('body').innerText()).slice(-2500));throw e;}finally{await browser.close();}
