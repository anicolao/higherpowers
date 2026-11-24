import {isDeepStrictEqual} from 'node:util';
import registry from '../../models/registry.json';import {evaluate} from './pool';import {cohort} from './simulate';import type {Model} from '../../src/lib/engine/rl/policy';import {createHash} from 'node:crypto';
for(const level of Object.keys(registry.models)){
 const q=(registry.qualifications as Record<string,{report:string}>)[level],report=await Bun.file(q.report).json(),path=`models/${level}.json`,model:Model=await Bun.file(path).json(),hash=createHash('sha256').update(new Uint8Array(await Bun.file(path).arrayBuffer())).digest('hex');if(hash!==report.model.sha256)throw Error(`Changed ${level} artifact`);
 const previous=level==='easy'?null:await Bun.file(`models/${level==='standard'?'easy':'standard'}.json`).json();
 const counts=report.benchmark?.playerCounts??[2,3,4,5],specs=counts.length===1?cohort(report.namespace,report.summary.games*4).filter(s=>s.players===counts[0]).slice(0,report.summary.games):cohort(report.namespace,report.summary.games);const result=await evaluate(model,previous,specs,Number(process.env.WORKERS??8));
 if(!isDeepStrictEqual(result.summary,report.summary)||Object.entries(report.byAngel).some(([a,r]:[string,any])=>!isDeepStrictEqual(result.byAngel[a],r)))throw Error(`${level} no longer reproduces its held-out report. Do not reuse that performance claim; evaluate with fresh seeds after changes.`);
 console.log(`PASS: ${level} reproduces ${result.summary.wins}/${result.summary.games} wins, score margins, steps, and power use.`);
}
