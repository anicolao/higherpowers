import registry from '../../../models/registry.json';
import {botCommand} from './bot';
import {learnedCommand,type Model} from './rl/policy';
import type {State,Player,BotLevel} from './types';
export const availableBotLevels=Object.keys(registry.models) as BotLevel[];
export const defaultBotLevel:BotLevel=availableBotLevels.includes('standard')?'standard':'easy';
export function trainedBotCommand(state:State,player:Player){
 if(!player.difficulty)return botCommand(state,player);
 const model=(registry.models as Record<string,Model>)[player.difficulty];if(!model)throw Error(`The ${player.difficulty} model is not installed.`);
 return learnedCommand(state,player.id,model);
}
export function botPending(s:State,p:Player){
 if(!p.bot)return false;
 if((s.phase==='angels'||s.phase==='lobby'&&s.chooseOnJoin)&&!p.angel)return true;
 if(s.phase==='judgment'&&!p.ready)return true;
 if(s.phase==='dance'&&s.dance&&!s.dance.choices[p.id])return true;
 return s.players[s.turn]?.id===p.id&&['play','inspect','after-turn'].includes(s.phase);
}
