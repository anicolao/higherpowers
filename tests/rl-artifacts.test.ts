import {test,expect} from 'bun:test';import {createHash} from 'node:crypto';import {readFileSync} from 'node:fs';
import registry from '../models/registry.json';
const sha=(path:string)=>createHash('sha256').update(readFileSync(path)).digest('hex');
test('installed levels are backed by matching, passing held-out evidence',()=>{
 for(const [level,model] of Object.entries(registry.models)){
  const q=(registry.qualifications as Record<string,{report:string;modelSha256:string;winRate:number}>)[level],report=JSON.parse(readFileSync(q.report,'utf8')),artifact=JSON.parse(readFileSync(`models/${level}.json`,'utf8'));
  expect(sha(`models/${level}.json`)).toBe(report.model.sha256);expect(q.modelSha256).toBe(report.model.sha256);expect(report.qualified).toBe(true);expect(report.summary.winRate).toBeGreaterThanOrEqual(.8);expect(report.summary.wilson95[0]).toBeGreaterThanOrEqual(.8);
  for(const r of Object.values(report.byPlayers) as {winRate:number}[])expect(r.winRate).toBeGreaterThanOrEqual(.8);
  for(const r of Object.values(report.byAngel) as {winRate:number;wilson95:number[]}[])if(report.benchmark?.playerCounts?.length===1&&report.benchmark.playerCounts[0]===2)expect(r.wilson95[0]).toBeGreaterThanOrEqual(.5);else expect(r.winRate).toBeGreaterThanOrEqual(.8);
  const {training,...runtime}=artifact;expect(model).toEqual(runtime);expect(model.weights.every(Number.isFinite)).toBe(true);expect(model.weights.length).toBe(model.powers?29:17);
  expect(report.results.filter((r:{win:boolean})=>r.win).length).toBe(report.summary.wins);expect(report.results.length).toBe(report.summary.games);
 }
});
