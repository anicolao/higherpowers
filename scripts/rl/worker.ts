import {match,summarize,type Match} from './simulate';import type {Model} from '../../src/lib/engine/rl/policy';
const input=await Bun.stdin.json() as {matches:Match[];model:Model;opponent:Model|null};const results=input.matches.map(s=>match(s,input.model,input.opponent));console.log(JSON.stringify({summary:summarize(results),results}));
