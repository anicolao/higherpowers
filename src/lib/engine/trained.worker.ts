import {trainedBotCommand} from './trained-bot';import type {State,Command} from './types';
const scope=self as unknown as {onmessage:(event:MessageEvent<{request:number;state:State;player:string}>)=>void;postMessage:(value:{request:number;command?:Command|null;error?:string})=>void};
scope.onmessage=({data})=>{try{const player=data.state.players.find(p=>p.id===data.player);if(!player)throw Error('Unknown computer');scope.postMessage({request:data.request,command:trainedBotCommand(data.state,player)});}catch(error){scope.postMessage({request:data.request,error:(error as Error).message});}};
