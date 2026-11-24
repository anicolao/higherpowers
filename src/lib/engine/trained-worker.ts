import {botCommand} from './bot';import type {State,Player,Command} from './types';
let worker:Worker|undefined,sequence=0;const pending=new Map<number,{resolve:(c:Command|null)=>void;reject:(e:Error)=>void}>();
function connect(){
 if(worker)return worker;worker=new Worker(new URL('./trained.worker.ts',import.meta.url),{type:'module'});
 worker.onmessage=({data}:{data:{request:number;command:Command|null;error?:string}})=>{const task=pending.get(data.request);if(!task)return;pending.delete(data.request);if(data.error)task.reject(new Error(data.error));else task.resolve(data.command);};
 worker.onerror=e=>{for(const task of pending.values())task.reject(new Error(e.message));pending.clear();worker?.terminate();worker=undefined;};return worker;
}
export function trainedCommand(s:State,p:Player):Promise<Command|null>{
 if(!p.difficulty)return Promise.resolve(botCommand(s,p));
 const request=++sequence;return new Promise((resolve,reject)=>{pending.set(request,{resolve,reject});try{connect().postMessage({request,state:JSON.parse(JSON.stringify(s)),player:p.id});}catch(e){pending.delete(request);reject(e as Error);}});
}
export function closeBotWorker(){worker?.terminate();worker=undefined;for(const task of pending.values())task.reject(new Error('Computer task closed.'));pending.clear();}
