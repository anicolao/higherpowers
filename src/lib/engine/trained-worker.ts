import {botCommand} from './bot';import type {State,Player,Command} from './types';
let worker:Worker|undefined,sequence=0;
interface Task {key:string;request:number;promise:Promise<Command|null>;resolve:(c:Command|null)=>void;reject:(e:Error)=>void;}
let task:Task|undefined;
function aborted(){const error=new Error('Computer calculation superseded.');error.name='AbortError';return error;}
function connect(){
 if(worker)return worker;worker=new Worker(new URL('./trained.worker.ts',import.meta.url),{type:'module'});
 worker.onmessage=({data}:{data:{request:number;command:Command|null;error?:string}})=>{if(!task||task.request!==data.request)return;const current=task;task=undefined;if(data.error)current.reject(new Error(data.error));else current.resolve(data.command);};
 worker.onerror=e=>{const current=task;task=undefined;worker?.terminate();worker=undefined;current?.reject(new Error(e.message));};return worker;
}
export function trainedCommand(s:State,p:Player):Promise<Command|null>{
 if(!p.difficulty){if(task)closeBotWorker();return Promise.resolve(botCommand(s,p));}
 const key=JSON.stringify([s.eventIds[0],s.revision,p.id,p.difficulty]);if(task?.key===key)return task.promise;
 if(task)closeBotWorker();const request=++sequence;let resolve!:Task['resolve'],reject!:Task['reject'];const promise=new Promise<Command|null>((yes,no)=>{resolve=yes;reject=no;});task={key,request,promise,resolve,reject};
 try{connect().postMessage({request,state:JSON.parse(JSON.stringify(s)),player:p.id});}catch(e){task=undefined;reject(e as Error);}return promise;
}
export function closeBotWorker(){worker?.terminate();worker=undefined;const current=task;task=undefined;current?.reject(aborted());}
