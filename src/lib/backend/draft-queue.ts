/** Coalesce drag frames, retaining the latest frame while a connection starts or reconnects. */
export function draftQueue<T>(send:(value:T)=>Promise<void>,onError:(error:Error)=>void,interval=65){
 let pending:{value:T}|null=null,ready=false,closed=false,running=false,lastSent=0,timer:ReturnType<typeof setTimeout>|undefined;
 function schedule(){if(ready&&!closed&&!running&&pending&&!timer)timer=setTimeout(()=>void flush(),Math.max(0,interval-(Date.now()-lastSent)));}
 async function flush(){timer=undefined;const next=pending;if(!next||!ready||closed)return;pending=null;running=true;lastSent=Date.now();try{await send(next.value);}catch(e){if(!closed){pending??=next;ready=false;onError(e as Error);}}finally{running=false;schedule();}}
 return {publish(value:T){if(closed)return;pending={value};schedule();},start(){ready=true;schedule();},pause(){ready=false;if(timer)clearTimeout(timer);timer=undefined;},close(){closed=true;pending=null;if(timer)clearTimeout(timer);timer=undefined;}};
}
