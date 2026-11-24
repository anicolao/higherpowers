import type {Model} from '../../src/lib/engine/rl/policy';import {summarize,type Match,type Result} from './simulate';
export async function evaluate(model:Model,opponent:Model|null,matches:Match[],workers=8){
 const chunks=Array.from({length:Math.min(workers,matches.length)},(_,i)=>matches.filter((_,j)=>j%Math.min(workers,matches.length)===i));
 const outcomes=await Promise.all(chunks.map(async matches=>{const p=Bun.spawn(['bun','scripts/rl/worker.ts'],{stdin:'pipe',stdout:'pipe',stderr:'inherit',cwd:process.env.RL_SOURCE_ROOT??process.cwd()});p.stdin.write(JSON.stringify({model,opponent,matches}));p.stdin.end();const raw=await new Response(p.stdout).text();if(await p.exited)throw Error('RL worker failed');return JSON.parse(raw).results as Result[];}));
 const results=outcomes.flat();return {summary:summarize(results),byAngel:Object.fromEntries([...new Set(results.map(r=>r.angel))].map(a=>[a,summarize(results.filter(r=>r.angel===a))])),byPlayers:Object.fromEntries([...new Set(results.map(r=>r.players))].map(n=>[n,summarize(results.filter(r=>r.players===n))])),results};
}
