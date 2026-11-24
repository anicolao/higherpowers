import registry from '../../models/registry.json';import {evaluate} from './pool';import {cohort} from './simulate';import type {Model} from '../../src/lib/engine/rl/policy';import {createHash} from 'node:crypto';
for(const level of Object.keys(registry.models)){
 const q=(registry.qualifications as Record<string,{report:string}>)[level],report=await Bun.file(q.report).json(),path=`models/${level}.json`,model:Model=await Bun.file(path).json(),hash=createHash('sha256').update(new Uint8Array(await Bun.file(path).arrayBuffer())).digest('hex');if(hash!==report.model.sha256)throw Error(`Changed ${level} artifact`);
 const previous=level==='easy'?null:await Bun.file(`models/${level==='standard'?'easy':'standard'}.json`).json();
 const result=await evaluate(model,previous,cohort(report.namespace,report.summary.games),Number(process.env.WORKERS??8));
 if(JSON.stringify(result.summary)!==JSON.stringify(report.summary)||Object.entries(report.byAngel).some(([a,r]:[string,any])=>JSON.stringify(result.byAngel[a])!==JSON.stringify(r)))throw Error(`${level} no longer reproduces its held-out report. Do not reuse that performance claim; evaluate with fresh seeds after changes.`);
 console.log(`PASS: ${level} reproduces ${result.summary.wins}/${result.summary.games} wins, score margins, steps, and power use.`);
}
