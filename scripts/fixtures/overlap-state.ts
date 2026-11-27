import {applyEvent,commandEvent,assertInventory,type State,type Command,type BotLevel} from '../../src/lib/engine/engine';
export function overlapState(level?:BotLevel){
 let state:State|null=null;const act=(actor:string,c:Command)=>state=applyEvent(state,commandEvent(state,actor,c,String((state?.revision??0)+1)));
 act('you',{type:'create',name:'You',seed:'overlap-fixture'});act('you',{type:'bot',id:'computer',name:'Computer',...(level?{difficulty:level}:{})});act('you',{type:'start'});for(const p of state!.players)act(p.id,{type:'angel',angel:p.options[0]});
 const s=state!;s.phase='play';s.turn=1;s.decrees=[0,0];s.players[1].opened=true;s.players[1].used=true;s.players[1].hand=['black-a-4','green-a-13'];s.players[0].hand=['blue-a-13'];
 s.heaven=[{id:'growing',x:20,y:40,tiles:['black-a-1','black-a-2','black-a-3'],zone:null},{id:'blocker',x:170,y:40,tiles:['red-a-7','red-a-8','red-a-9'],zone:'you'}];
 s.players[0].angel='barachiel';s.players[0].sanctuary=true;s.players[0].used=true;
 const used=new Set([...s.players.flatMap(p=>p.hand),...s.heaven.flatMap(g=>g.tiles)]);s.bag=Object.keys(s.tiles).filter(id=>!used.has(id));assertInventory(s);return s;
}
