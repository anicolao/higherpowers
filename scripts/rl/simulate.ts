import {applyEvent,commandEvent,total,angelIds,type State,type Command,type Angel} from '../../src/lib/engine/engine';
import {botCommand} from '../../src/lib/engine/bot';
import {learnedCommand,type Model} from '../../src/lib/engine/rl/policy';
export interface Match {seed:string;players:number;seat:number;angel:Angel;}
export interface Result {seed:string;win:boolean;tie:boolean;margin:number;steps:number;seat:number;players:number;angel:Angel;powers:Record<string,number>;}
const cache=new Map<string,State>();
export function setup(match:Match):State{
 const key=JSON.stringify(match),cached=cache.get(key);if(cached)return structuredClone(cached);
 for(let retry=0;retry<200;retry++){
  let s:State|null=null;const act=(actor:string,c:Command)=>s=applyEvent(s,commandEvent(s,actor,c,String((s?.revision??0)+1)));
  act('p0',{type:'create',name:'P0',seed:`${match.seed}/${retry}`});for(let i=1;i<match.players;i++)act('p0',{type:'bot',id:`p${i}`,name:`P${i}`});act('p0',{type:'start'});
  if(!s!.players[match.seat].options.includes(match.angel))continue;
  for(const p of s!.players)act(p.id,{type:'angel',angel:p.id===`p${match.seat}`?match.angel:p.options[0]});
  if(cache.size>500)cache.clear();cache.set(key,structuredClone(s!));return s!;
 }
 throw Error('Could not deal requested Angel');
}
export function match(spec:Match,model:Model,opponent:Model|null):Result{
 let s=setup(spec),steps=0;const mine=`p${spec.seat}`,powers:Record<string,number>={};
 while(s.phase!=='ended'){
  if(++steps>4000)throw Error(`Unfinished match ${spec.seed}`);
  let command:Command|null=null,actor='p0';
  if(s.phase==='round-end')command={type:'next-round'};
  else for(const p of s.players){
   command=p.id===mine?learnedCommand(s,p.id,model):opponent?learnedCommand(s,p.id,opponent):botCommand(s,p);
   if(command){actor=p.id;break;}
  }
  if(!command)throw Error(`No command in ${s.phase}`);
  if(actor===mine&&(command.type==='before'||command.type==='organize'&&command.power||command.type==='communion'||command.type==='draw'&&command.foretell||command.type==='continue'&&command.zeal)){const key=s.players.find(p=>p.id===mine)!.angel!;powers[key]=(powers[key]??0)+1;}
  s=applyEvent(s,commandEvent(s,actor,command,String(s.revision+1)));
 }
 const score=total(s.players[spec.seat]),best=Math.max(...s.players.filter(p=>p.id!==mine).map(total));return {seed:spec.seed,win:score>best,tie:score===best,margin:score-best,steps,seat:spec.seat,players:spec.players,angel:spec.angel,powers};
}
export function cohort(namespace:string,n:number,offset=0):Match[]{return Array.from({length:n},(_,j)=>{const i=j+offset,players=2+Math.floor(i/12)%4;return {seed:`${namespace}/${i}`,players,seat:Math.floor(i/48)%players,angel:angelIds[i%12]};});}
export function summarize(results:Result[]){const n=results.length,wins=results.filter(r=>r.win).length,p=wins/n,z=1.96,den=1+z*z/n;return {games:n,wins,ties:results.filter(r=>r.tie).length,winRate:p,wilson95:[(p+z*z/(2*n)-z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n)))/den,(p+z*z/(2*n)+z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n)))/den],meanMargin:results.reduce((a,r)=>a+r.margin,0)/n,meanSteps:results.reduce((a,r)=>a+r.steps,0)/n,powers:results.reduce((a,r)=>{for(const [k,n] of Object.entries(r.powers))a[k]=(a[k]??0)+n;return a;},{} as Record<string,number>)};}
