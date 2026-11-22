import {launchBrowser} from './browser';
const url=process.env.REVIEW_URL??'http://127.0.0.1:5198/play';const browser=await launchBrowser(),errors:string[]=[];
const contexts=await Promise.all([0,1].map(()=>browser.newContext({viewport:{width:1440,height:1000}}))),[host,guest]=await Promise.all(contexts.map(c=>c.newPage()));for(const p of [host,guest])p.on('pageerror',e=>errors.push(e.message));
const leave=async(p:typeof host)=>{await p.getByRole('button',{name:'Table menu',exact:true}).click();await p.getByRole('button',{name:'Leave table',exact:true}).click();await p.getByRole('button',{name:'Create a table',exact:true}).waitFor();};
const create=async()=>{await host.getByRole('button',{name:'Create a table',exact:true}).click();await host.getByRole('region',{name:'Invite friends'}).waitFor();return host.url();};
const join=async(invite:string)=>{await guest.goto(invite);await guest.getByLabel('Your name').fill('Human Guest');await guest.getByRole('button',{name:'Join table',exact:true}).click();await guest.locator('.setup-table').waitFor();await host.getByLabel(/Human Guest, 0 souls/).waitFor();};
const choose=async(p:typeof host)=>{await p.locator('.angel-choice>button').first().click();};
try{
 await host.goto(url);await host.getByLabel('Your name').fill('Human Host');let invite=await create();if(!await host.getByRole('button',{name:'Deal Angels',exact:true}).isDisabled())throw Error('A solo table can start');await join(invite);
 if(await guest.getByRole('button',{name:'Add computer',exact:true}).count())throw Error('Guest may add computers');if(!await host.getByRole('button',{name:'Deal Angels',exact:true}).isEnabled())throw Error('Two humans cannot start');await host.getByRole('button',{name:'Deal Angels',exact:true}).click();
 for(const p of [host,guest]){await p.locator('.angel-choice>button').first().waitFor();if(await p.locator('.angel-choice>button').count()!==2)throw Error('Two-player Angel deal is wrong');await choose(p);}
 for(const p of [host,guest]){await p.locator('[data-rack-tile]').first().waitFor();if(await p.locator('[data-rack-tile]').count()!==14)throw Error('Two-player hand is wrong');}await host.screenshot({path:'tmp/qa/play/two-human-table.png'});
 await leave(host);await leave(guest);invite=await create();await join(invite);
 for(let i=0;i<3;i++){await host.getByRole('button',{name:'Add computer',exact:true}).click();await guest.getByLabel(new RegExp(`Angel ${i+3}, 0 souls`)).waitFor();}
 if(await host.getByRole('button',{name:'Add computer',exact:true}).count())throw Error('Bot control remains at five seats');if(await guest.locator('.player-seat').count()!==4)throw Error('Mixed roster did not synchronize');await host.screenshot({path:'tmp/qa/play/mixed-human-bot-lobby.png'});
 await host.getByRole('button',{name:'Deal Angels',exact:true}).click();await choose(host);await choose(guest);await host.locator('[data-rack-tile]').first().waitFor();if(await host.locator('.player-seat').count()!==4)throw Error('Mixed table lost opponents');
 await leave(host);await create();await host.getByRole('button',{name:'Add computer',exact:true}).click();await host.getByRole('button',{name:'Deal Angels',exact:true}).click();await choose(host);await host.locator('[data-rack-tile]').first().waitFor();if(await host.locator('.player-seat').count()!==1)throw Error('One human plus one computer did not start');
 if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({checks:['solo start rejected','two-human start','two Angel choices each','fourteen souls each','host-only Add computer','bots added after human joins','mixed roster synchronized','five-seat cap','mixed game starts with automatic bot choices','one human plus one bot'],errors}));
}finally{await browser.close();}
