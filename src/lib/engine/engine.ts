import {suits} from '../tabletop/rearrangement';
import {formation,resolveJokers} from './formations';
import {shuffle,random} from './random';
import {angelIds,type State,type Player,type Group,type Command,type GameEvent} from './types';
export * from './types';
export function requireRule(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message);}
const unique=(a:readonly string[])=>new Set(a).size===a.length;
const same=(a:readonly string[],b:readonly string[])=>a.length===b.length&&[...a].sort().join('|')===[...b].sort().join('|');
const ids=(groups:Group[])=>groups.flatMap(g=>g.tiles);
export const decree=(s:State)=>s.round<3?s.decrees[s.round-1]??0:0;
export const total=(p:Player)=>p.scores.reduce((a,b)=>a+b,0);
export const allowance=(s:State,id:string)=>s.players.length-s.players.filter(p=>p.id!==id&&p.favor>=(s.players.find(p=>p.id===id)?.favor??0)).length;
export function souls(){return Object.fromEntries([...suits.flatMap(color=>['a','b'].flatMap(copy=>Array.from({length:13},(_,i)=>({id:`${color}-${copy}-${i+1}`,rank:i+1,color})))),{id:'joker-1',rank:'joker' as const,color:'black' as const},{id:'joker-2',rank:'joker' as const,color:'green' as const}].map(t=>[t.id,t]));}
function player(id:string,name:string,bot=false):Player {requireRule(/^[A-Za-z0-9_-]{1,128}$/.test(id),'Invalid player identifier.');requireRule(name.trim().length>0&&name.length<=40,'Use a name of 1–40 characters.');return {id,name:name.trim(),bot,options:[],angel:null,hand:[],favor:0,opened:false,used:false,purgatory:null,sanctuary:false,scales:[],credit:0,target:null,ready:false,scores:[]};}
function mix(s:State,tiles:string[],tag:string){return shuffle(tiles,`${s.seed}/${s.revision}/${tag}`);}
function beginRound(s:State){s.round++;s.turn=s.starter;s.turnNumber++;s.heaven=[];s.bag=mix(s,Object.keys(s.tiles),`round-${s.round}`);s.idle=0;s.changed=false;s.winner=null;s.communion=null;s.inspection=null;s.dance=null;
 const totals=s.players.map(total);for(const p of s.players){p.hand=s.bag.splice(0,14);p.favor=s.round===3&&s.judgment===4?totals.filter(n=>n>total(p)).length:0;p.opened=false;p.used=false;p.purgatory=null;p.sanctuary=false;p.scales=[];p.credit=0;p.target=null;p.ready=false;}
 s.phase=s.round===3&&[2,3].includes(s.judgment)?'judgment':'play';}
function value(s:State,id:string){return s.tiles[id].rank==='joker'?30:Number(s.tiles[id].rank);}
export function penalty(s:State,p:Player){return [...p.hand,...(p.purgatory?[p.purgatory]:[])].reduce((n,id)=>n+value(s,id)*(p.scales.includes(id)?3:1),0);}
function finishRound(s:State,winner:Player,stalemate=false){const highest=Math.max(...s.players.map(total)),favorite=s.players.filter(p=>total(p)===highest).map(p=>p.id),penalties:Record<string,number>={};const base=penalty(s,winner);for(const p of s.players){let n=p.id===winner.id?0:penalty(s,p);if(s.round===3&&s.judgment===1&&!favorite.includes(winner.id)&&favorite.includes(p.id))n*=2;penalties[p.id]=p.id===winner.id?0:stalemate?Math.max(0,n-base):n;}
 const award=Object.values(penalties).reduce((a,b)=>a+b,0),scores:Record<string,number>={};for(const p of s.players){const shared=s.round===3&&s.judgment===2&&p.target?(penalties[p.target]??0):0;const score=(p.id===winner.id?award:-penalties[p.id])+p.credit+shared;p.scores.push(score);scores[p.id]=score;}
 if(s.round===3&&s.judgment===5){const low=Math.min(...winner.scores.slice(0,2));if(low<0)winner.scores[winner.scores.indexOf(low)]=0;}
 s.winner=winner.id;s.lastResult={winner:winner.id,penalties,scores,stalemate};s.phase=s.round===3?'ended':'round-end';s.communion=null;}
function checkWinner(s:State){for(let i=0;i<s.players.length;i++){const p=s.players[(s.turn+i)%s.players.length];if(!p.hand.length){finishRound(s,p);return true;}}return false;}
function nextTurn(s:State){s.turn=(s.turn+1)%s.players.length;s.turnNumber++;s.phase='play';s.changed=false;s.communion=null;}
function endTurn(s:State,changed:boolean){s.changed ||=changed;if(checkWinner(s))return;
 s.idle=s.bag.length===0&&!s.changed?s.idle+1:0;
 if(!s.bag.length&&s.idle>=s.players.length){const order=Array.from({length:s.players.length},(_,i)=>s.players[(s.starter+i)%s.players.length]);finishRound(s,order.reduce((best,p)=>penalty(s,p)<penalty(s,best)?p:best),true);return;}
 const p=s.players[s.turn];if(p.angel==='jegudiel'&&!p.used)s.phase='after-turn';else nextTurn(s);}
function spend(p:Player,angel:string){requireRule(p.angel===angel&&!p.used,'That gift is unavailable.');p.used=true;}
function handTransfers(s:State){for(const p of s.players)p.scales=p.scales.filter(id=>p.hand.includes(id));}
function groupLegal(s:State,g:Group){return formation(g.tiles.map(id=>s.tiles[id]),decree(s),g.jokerFaces??{});}
function organize(s:State,p:Player,c:Extract<Command,{type:'organize'}>){
 const old=s.heaven,allOld=ids(old),allNew=ids(c.groups),handBefore=[...p.hand];
 requireRule(c.groups.length<=106&&unique(c.groups.map(g=>g.id))&&unique(allNew),'Each soul and group must appear once.');
 for(const g of c.groups){requireRule(typeof g.id==='string'&&g.id.length>0&&g.id.length<=128&&g.tiles.length>0&&g.tiles.every(id=>!!s.tiles[id]),'Unknown or empty formation.');requireRule(Number.isFinite(g.x)&&Number.isFinite(g.y)&&g.x>=0&&g.y>=0&&g.x<=20000&&g.y<=20000,'Invalid table position.');requireRule(g.zone===null||s.players.some(p=>p.id===g.zone),'Unknown Sanctuary.');requireRule(!g.slots||g.slots.length===g.tiles.length&&g.slots.every((n,i)=>Number.isInteger(n)&&n>=0&&n<=106&&(i===0||n>g.slots![i-1])),'Invalid tile spacing.');for(const [id,face]of Object.entries(g.jokerFaces??{}))requireRule(g.tiles.includes(id)&&s.tiles[id]?.rank==='joker'&&suits.includes(face.color)&&Number.isInteger(face.rank)&&face.rank>=1&&face.rank<=13,'Invalid joker face.');requireRule(!!groupLegal(s,g),'Every formation in Heaven must be legal.');}
 const stage=c.stage??old,stageIds=ids(stage);
 if(c.stage){requireRule(!!c.power&&unique(stageIds)&&allOld.every(id=>stageIds.includes(id))&&stageIds.every(id=>allOld.includes(id)||handBefore.includes(id))&&stage.every(g=>g.zone===null||old.some(o=>JSON.stringify(o)===JSON.stringify(g))),'Invalid pre-gift arrangement.');for(const g of stage)requireRule(g.tiles.every(id=>s.tiles[id]),'Unknown soul in the pre-gift arrangement.');}
 // Other players’ protected formations cannot be changed, including their positions.
 for(const other of s.players.filter(q=>q.id!==p.id)){requireRule(JSON.stringify(old.filter(g=>g.zone===other.id))===JSON.stringify(c.groups.filter(g=>g.zone===other.id)),'Only the owner may rearrange a Sanctuary.');}
 const power=c.power;requireRule(!power||['forgive','penance','transfigure','sanctuary'].includes(power.kind),'Unknown organizing gift.');let retrieved:string[]=[],purgOut:string|null=null,purgIn:string|null=null;
 if(power){requireRule(!p.purgatory,'Rescue Purgatory or draw.');if(power.kind==='forgive'){spend(p,'zadkiel');retrieved=[power.tile];}if(power.kind==='penance'){spend(p,'raphael');purgIn=power.tile;}if(power.kind==='transfigure'){spend(p,'jophiel');requireRule(power.tiles.length===2&&unique(power.tiles),'Transfiguration retrieves exactly two souls.');retrieved=power.tiles;}if(power.kind==='sanctuary')spend(p,p.angel==='selaphiel'?'selaphiel':'barachiel');}
 for(const id of [...retrieved,...(purgIn?[purgIn]:[])]){
  requireRule(!!s.tiles[id]&&stageIds.includes(id),'Choose a soul in Heaven.');
  requireRule(!stage.some(g=>g.zone!==null&&g.tiles.includes(id)),'A protected soul cannot be taken.');
 }
 if(p.purgatory){requireRule(allNew.includes(p.purgatory),'Rescue Purgatory before playing.');const rescue=c.groups.find(g=>g.tiles.includes(p.purgatory!))!;requireRule(groupLegal(s,rescue)==='procession','Purgatory must be rescued into a Procession.');purgOut=p.purgatory;}
 if(purgIn)requireRule(!allNew.includes(purgIn),'The soul must remain in Purgatory.');
 const allowed=new Set([...allOld,...handBefore,...retrieved,...(purgOut?[purgOut]:[])]);
 let communionOwner:Player|undefined;
 if(c.communionTile){requireRule(s.communion?.player===p.id,'Inspect the opponent’s hand first.');communionOwner=s.players.find(q=>q.id===s.communion!.target)!;requireRule(communionOwner.hand.includes(c.communionTile)&&allNew.includes(c.communionTile),'Choose a soul from the inspected hand and deliver it.');allowed.add(c.communionTile);}
 requireRule(allNew.every(id=>allowed.has(id)),'A soul cannot be taken from another hand or the bag.');
 for(const id of allOld)requireRule(allNew.includes(id)||retrieved.includes(id)||purgIn===id,'Souls may leave Heaven only through a gift.');
 const delivered=handBefore.filter(id=>allNew.includes(id)),newDeliveries=delivered.length;
 if(!p.opened){requireRule(c.opening&&unique(c.opening)&&c.opening.every(id=>handBefore.includes(id))&&!!formation(c.opening.map(id=>s.tiles[id]),decree(s)),'First meld one complete formation entirely from your own hand.');requireRule(c.opening.every(id=>allNew.includes(id)||retrieved.includes(id)||purgIn===id),'Your opening must enter Heaven.');p.opened=true;}
 if(c.communionTile)requireRule(newDeliveries>0,'Communion must accompany a soul from your hand.');
 if(power?.kind==='transfigure'){requireRule(retrieved.every(id=>allOld.includes(id)&&!allNew.includes(id))&&newDeliveries>=2,'Retrieve two souls into your hand and deliver at least two from your original hand.');}
 requireRule(newDeliveries>0||!!power||!!purgOut,'Deliver a soul or use an organizing gift.');
 if(power?.kind==='sanctuary'){const g=c.groups.find(g=>g.id===power.group);requireRule(g&&g.zone===p.id,'Choose a complete formation for your Sanctuary.');p.sanctuary=true;}
 for(const g of c.groups.filter(g=>g.zone===p.id)){requireRule(p.sanctuary,'The Sanctuary is unavailable.');requireRule(groupLegal(s,g)===(p.angel==='selaphiel'?'choir':'procession'),'Sanctuary must contain its named formation.');}
 if(!c.groups.some(g=>g.zone===p.id))p.sanctuary=false;
 // Jokers that leave Heaven must use an explicit retrieval gift. Table rearrangement is free.
 for(const id of allOld.filter(id=>s.tiles[id].rank==='joker'))requireRule(allNew.includes(id)||retrieved.includes(id)||purgIn===id,'Replay a reclaimed joker during this action.');
 const finalHand=[...handBefore.filter(id=>!allNew.includes(id)&&id!==purgIn),...retrieved.filter(id=>!allNew.includes(id)&&!handBefore.includes(id))];
 p.hand=finalHand;p.purgatory=purgIn;p.favor+=Math.max(0,allNew.length-allOld.length+(purgIn?1:0)-(purgOut?1:0)+(power?.kind==='forgive'?1:0));
 if(communionOwner)communionOwner.hand=communionOwner.hand.filter(id=>id!==c.communionTile);
 // Scales credits become final on delivery, even when a different player delivers the soul.
 for(const owner of s.players){const credited=owner.scales.filter(id=>allNew.includes(id)||!!c.stage&&stageIds.includes(id));owner.credit+=credited.reduce((n,id)=>n+value(s,id),0);owner.scales=owner.scales.filter(id=>!credited.includes(id));}
 s.heaven=JSON.parse(JSON.stringify(c.groups));for(const g of s.heaven){const faces=resolveJokers(g.tiles.map(id=>s.tiles[id]),decree(s),g.jokerFaces);requireRule(faces,'Declare a legal identity for each joker.');if(Object.keys(faces).length)g.jokerFaces=faces;}s.communion=null;handTransfers(s);endTurn(s,true);
}
export function applyEvent(previous:State|null,event:GameEvent):State{
 requireRule(event.version===1&&Number.isInteger(event.sequence)&&event.sequence===(previous?.revision??0)+1,'Unsupported schema or gap in the game log.');requireRule(typeof event.id==='string'&&event.id.length>0&&!(previous?.eventIds.includes(event.id)),'Duplicate event identifier.');
 const c=event.command;let s:State;
 if(!previous){requireRule(c.type==='create'&&event.sequence===1,'A game starts with a create event.');requireRule(typeof c.seed==='string'&&c.seed.length>0&&c.seed.length<=200,'A replay seed is required.');s={version:1,revision:1,seed:c.seed,owner:event.actor,players:[player(event.actor,c.name)],tiles:souls(),phase:'lobby',round:0,starter:0,turn:0,turnNumber:0,bag:Object.keys(souls()),heaven:[],decrees:shuffle([1,2,3,4,5,6,7,8,9,10],c.seed+'/decrees'),judgment:shuffle([1,2,3,4,5],c.seed+'/judgment')[0],idle:0,changed:false,inspection:null,communion:null,dance:null,winner:null,lastResult:null,eventIds:[event.id]};return s;}
 s=JSON.parse(JSON.stringify(previous));s.revision=event.sequence;const p=s.players.find(p=>p.id===event.actor);
 if(c.type==='join'||c.type==='bot'){requireRule(s.phase==='lobby'&&s.players.length<5,'The lobby is full or the game has started.');if(c.type==='bot')requireRule(event.actor===s.owner,'Only the host adds computers.');const id=c.type==='bot'?c.id:event.actor;requireRule(!s.players.some(p=>p.id===id),'That player already joined.');s.players.push(player(id,c.name,c.type==='bot'));}
 else{requireRule(p,'Join the game first.');
 if(c.type==='start'){requireRule(s.phase==='lobby'&&s.players.length>=3&&event.actor===s.owner,'The host can start with 3–5 players.');const deck=shuffle(angelIds,s.seed+'/angels');s.players.forEach((p,i)=>p.options=deck.slice(i*2,i*2+2));s.starter=Math.floor(random(s.seed+'/starter')()*s.players.length);s.phase='angels';}
 else if(c.type==='angel'){requireRule(s.phase==='angels'&&!p.angel&&p.options.includes(c.angel),'Choose one of your two Angels.');p.angel=c.angel;if(s.players.every(p=>p.angel))beginRound(s);}
 else if(c.type==='judgment-choice'){requireRule(s.phase==='judgment'&&!p.ready,'Your judgment choice is already fixed.');if(s.judgment===2){requireRule(c.target&&s.players.some(q=>q.id===c.target&&q.id!==p.id),'Choose another player.');p.target=c.target;}else{const ts=c.tiles??[];requireRule(ts.length<=5&&unique(ts)&&ts.every(id=>p.hand.includes(id)&&s.tiles[id].rank!=='joker'),'Set aside up to five numbered souls.');p.scales=ts;}p.ready=true;if(s.players.every(p=>p.ready))s.phase='play';}
 else if(c.type==='rack'){requireRule(s.round>0&&same(c.tiles,p.hand),'Rack arrangement must contain your entire hand.');p.hand=[...c.tiles];}
 else if(c.type==='next-round'){requireRule(s.phase==='round-end'&&event.actor===s.owner,'The host starts the next round.');s.starter=(s.starter+1)%s.players.length;beginRound(s);}
 else{
  requireRule('turn'in c&&c.turn===s.turnNumber,'This action belongs to an earlier turn.');
  if(c.type==='dance-choice'){requireRule(s.phase==='dance'&&s.dance&&!s.dance.choices[p.id],'Your Dance selection is already fixed.');requireRule(c.tiles.length===s.dance.count&&unique(c.tiles)&&c.tiles.every(id=>p.hand.includes(id)),'Choose the requested number of souls.');s.dance.choices[p.id]=[...c.tiles];if(s.players.every(p=>s.dance!.choices[p.id])){const choices=s.dance.choices;for(let i=0;i<s.players.length;i++){const q=s.players[i];q.hand=[...q.hand.filter(id=>!choices[q.id].includes(id)),...choices[s.players[(i+1)%s.players.length].id]];}s.dance=null;s.phase='play';s.changed=true;handTransfers(s);checkWinner(s);}}
  else{requireRule(s.players[s.turn].id===p.id,'It is another player’s turn.');
   if(c.type==='continue'){requireRule(s.phase==='after-turn','Finish the current action first.');if(c.zeal){spend(p,'jegudiel');s.phase='play';s.turnNumber++;s.changed=false;}else nextTurn(s);}
   else if(c.type==='keep'){requireRule(s.phase==='inspect'&&s.inspection?.player===p.id&&s.inspection.tiles.includes(c.tile),'Choose one inspected soul.');p.hand.push(c.tile);s.bag=mix(s,[...s.bag,...s.inspection.tiles.filter(id=>id!==c.tile)],'return');s.inspection=null;endTurn(s,true);}
   else{requireRule(s.phase==='play','Complete the pending choice first.');
    if(c.type==='organize')organize(s,p,c);
    else if(c.type==='draw'){s.communion=null;if(!s.bag.length){requireRule(!c.foretell,'Foretelling requires souls in the bag.');endTurn(s,false);}else{if(c.foretell){requireRule(!p.purgatory,'Purgatory allows only rescue or ordinary drawing.');spend(p,'uriel');}const count=Math.min(s.bag.length,c.foretell?8:allowance(s,p.id));s.inspection={player:p.id,tiles:s.bag.splice(0,count)};s.phase='inspect';}}
    else if(c.type==='communion'){requireRule(!p.purgatory,'Rescue Purgatory or draw.');spend(p,'chamuel');requireRule(c.target!==p.id&&s.players.some(q=>q.id===c.target),'Choose another player.');s.communion={player:p.id,target:c.target};s.changed=true;}
    else if(c.type==='before'){requireRule(['calling','banish','judgment','dance'].includes(c.power),'Unknown gift.');requireRule(!p.purgatory,'Rescue Purgatory or draw.');
     if(c.power==='calling'){spend(p,'gabriel');requireRule(Number.isInteger(c.rank)&&c.rank!>=1&&c.rank!<=13,'Name a rank from 1 to 13.');for(const q of s.players.filter(q=>q.id!==p.id)){const ts=q.hand.filter(id=>s.tiles[id].rank===c.rank);q.hand=q.hand.filter(id=>!ts.includes(id));p.hand.push(...ts);}}
     if(c.power==='banish'){spend(p,'michael');const q=s.players.find(q=>q.id===c.target&&q.id!==p.id),ts=p.hand.filter(id=>s.tiles[id].rank===c.rank);requireRule(q&&ts.length&&Number.isInteger(c.rank),'Choose an owned rank and another player.');p.hand=p.hand.filter(id=>!ts.includes(id));q.hand.push(...ts);}
     if(c.power==='judgment'){spend(p,'raguel');const ts=c.tiles??[];requireRule(ts.length>0&&unique(ts)&&ts.every(id=>p.hand.includes(id))&&s.bag.length>=ts.length,'Return a positive number that can be drawn back twice.');p.hand=p.hand.filter(id=>!ts.includes(id));p.scales=p.scales.filter(id=>!ts.includes(id));s.bag=mix(s,[...s.bag,...ts],'judgment');p.hand.push(...s.bag.splice(0,ts.length*2));}
     if(c.power==='dance'){spend(p,'haniel');requireRule(Number.isInteger(c.count)&&c.count!>0&&c.count!<=Math.min(...s.players.map(q=>q.hand.length)),'Choose a positive count no larger than the smallest hand.');s.dance={count:c.count!,choices:{}};s.phase='dance';}
     s.changed=true;handTransfers(s);if(!s.dance)checkWinner(s);
    }else requireRule(false,'Unknown game command.');
   }
  }
 }
 }
 s.eventIds.push(event.id);assertInventory(s);return s;
}
export function assertInventory(s:State){const all=[...s.bag,...ids(s.heaven),...s.players.flatMap(p=>[...p.hand,...(p.purgatory?[p.purgatory]:[])]),...(s.inspection?.tiles??[])];requireRule(all.length===106&&unique(all)&&all.every(id=>!!s.tiles[id]),'The game log does not conserve all 106 souls.');}
export function replay(events:GameEvent[]):State{requireRule(events.length,'The game log is empty.');let s:State|null=null;for(const e of events)s=applyEvent(s,e);return s!;}
export function commandEvent(s:State|null,actor:string,command:Command,id:string):GameEvent{return {version:1,sequence:(s?.revision??0)+1,id,actor,command};}
export function tryCommand(s:State,actor:string,c:Command):string|null{try{applyEvent(s,commandEvent(s,actor,c,'validation'));return null;}catch(e){return e instanceof Error?e.message:String(e);}}
