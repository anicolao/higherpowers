// A single requested catalogue entry, never a seed or migration. Dry-run by default.
const {getGlobalDefaultAccount,getAccessToken}=require('firebase-tools/lib/auth');
const {requireAuth}=require('firebase-tools/lib/requireAuth');
const {writeFileSync}=require('node:fs');
(async()=>{
 const arg=process.argv.find(a=>a.startsWith('--site='));
 const site=new URL(arg?arg.slice(7):'https://anicolao.github.io/higherpowers/');
 const artworkOnly=process.argv.includes('--artwork-only');
 if(site.origin!=='https://anicolao.github.io'||!/^\/higherpowers\/(pr\d+\/)?$/.test(site.pathname)||site.search||site.hash)throw Error('Use the production or retained PR Higher Powers site.');
 const record={Title:'Higher Powers',URL:new URL('tabletop/',site).href,WebURL:new URL('play/',site).href,Icon:new URL('art/integrations/higher-powers-cover-v1.webp',site).href,Hidden:false,GameroomEnabled:'integrated'};
 const account=getGlobalDefaultAccount();await requireAuth({project:'launcherui',...account});
 const {access_token}=await getAccessToken(account.tokens.refresh_token,[]);
 const headers={Authorization:`Bearer ${access_token}`,'Content-Type':'application/json'},base='https://firestore.googleapis.com/v1/projects/launcherui/databases/(default)/documents';
 const response=await fetch(`${base}/Applications?pageSize=1000`,{headers});if(!response.ok)throw Error(`Catalogue read failed (${response.status}).`);
 const snapshot=await response.json(),documents=snapshot.documents??[];
 if(snapshot.nextPageToken)throw Error('Catalogue needs pagination; review before registering.');
 const matches=documents.filter(d=>d.name.endsWith('/higherpowers')||d.fields.Title?.stringValue?.toLowerCase()==='higher powers'||[d.fields.URL?.stringValue,d.fields.WebURL?.stringValue].some(u=>u&&/^https:\/\/anicolao.github.io\/higherpowers\//.test(u)));
 if(matches.length>1||matches[0]&&!matches[0].name.endsWith('/higherpowers'))throw Error('Review the existing catalogue document ID before registering.');
 const prior=matches[0],old=Object.fromEntries(Object.entries(prior?.fields??{}).map(([k,v])=>[k,v.stringValue??v.booleanValue]));
 if(artworkOnly&&!prior)throw Error('Art-only updates require an existing Higher Powers entry.');
 // Preserve an existing entry's presentation and visibility; maintain only integration fields.
 const keys=artworkOnly?['Icon']:prior?['URL','WebURL','Icon','GameroomEnabled']:Object.keys(record);
 const changes=Object.fromEntries(keys.filter(k=>old[k]!==record[k]).map(k=>[k,record[k]]));
 console.log(JSON.stringify({id:'higherpowers',before:old,changes},null,2));
 if(!process.argv.includes('--apply')){console.log('Dry run. Use --apply once the site and launch contract are deployed.');return;}
 for(const target of artworkOnly?[record.Icon]:[record.URL,record.WebURL,record.Icon]){const check=await fetch(target,{method:'HEAD'});if(!check.ok)throw Error(`Deploy first: ${target} (${check.status})`);}
 const responseContract=await fetch(new URL('gameroom-launch.json',record.WebURL)),contract=await responseContract.json();
 if(!responseContract.ok||contract.game!=='higherpowers'||contract.protocol!=='gameroom-url'||contract.version!==1)throw Error('Deploy the Game Room URL protocol before enabling the catalogue entry.');
 if(!Object.keys(changes).length){console.log('Catalogue already current.');return;}
 const backup=`/tmp/higherpowers-catalogue-before-${Date.now()}.json`;writeFileSync(backup,JSON.stringify(snapshot,null,2));
 const fields=Object.fromEntries(Object.entries(changes).map(([k,v])=>[k,typeof v==='boolean'?{booleanValue:v}:{stringValue:v}]));
 const write={update:{name:prior?.name??'projects/launcherui/databases/(default)/documents/Applications/higherpowers',fields},currentDocument:prior?{updateTime:prior.updateTime}:{exists:false},...(prior?{updateMask:{fieldPaths:Object.keys(changes)}}:{})};
 const saved=await fetch(`${base}:commit`,{method:'POST',headers,body:JSON.stringify({writes:[write]})});if(!saved.ok)throw Error(`Catalogue update failed (${saved.status}): ${await saved.text()}`);
 const check=await fetch(`${base}/Applications/higherpowers`,{headers});if(!check.ok)throw Error('Catalogue read-back failed.');const final=await check.json();
 for(const key of keys)if((final.fields[key]?.stringValue??final.fields[key]?.booleanValue)!==record[key])throw Error(`Catalogue read-back mismatch: ${key}`);
 console.log(`Registered Higher Powers for both launchers. Backup: ${backup}`);
})().catch(e=>{console.error(e.message);process.exitCode=1;});
