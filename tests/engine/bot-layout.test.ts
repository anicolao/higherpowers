import {test,expect} from 'bun:test';
import {overlapState} from '../../scripts/fixtures/overlap-state';
import {trainedBotCommand,availableBotLevels} from '../../src/lib/engine/trained-bot';
import {layoutBotCommand} from '../../src/lib/engine/bot-layout';
import {learnedCommand,type Model} from '../../src/lib/engine/rl/policy';
import registry from '../../models/registry.json';
import {tryCommand,applyEvent,commandEvent,assertInventory,type Command} from '../../src/lib/engine/engine';
import {formationRect} from '../../src/lib/tabletop/layout';
import {overlaps} from '../../src/lib/tabletop/rearrangement';
const metrics={step:47,tileHeight:44*1.43};
for(const level of [undefined,...availableBotLevels])test(`${level??'heuristic'} bot leaves an extended set clear of a protected neighbor`,()=>{
 const s=overlapState(level),before=structuredClone(s),p=s.players[1],c=trainedBotCommand(s,p);expect(c?.type).toBe('organize');if(c?.type!=='organize')throw Error('Expected an extension');expect(tryCommand(s,p.id,c)).toBeNull();
 expect(c.groups.find(g=>g.id==='growing')!.tiles).toContain('black-a-4');expect(c.groups.find(g=>g.id==='blocker')).toEqual(s.heaven[1]);
 const boxes=c.groups.map(g=>formationRect({...g,tiles:g.tiles.map(id=>s.tiles[id])},metrics));for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)expect(overlaps(boxes[i],boxes[j])).toBe(false);
 if(level){const raw=learnedCommand(s,p.id,registry.models[level] as Model)!;const strip=(c:Command)=>c.type==='organize'?{...c,groups:c.groups.map(({x,y,...g})=>g)}:c;expect(strip(c)).toEqual(strip(raw));}
 const event=commandEvent(s,p.id,c,'clear-extension'),next=applyEvent(s,event);assertInventory(next);expect(next.heaven).toEqual(c.groups);expect(s).toEqual(before);
});
test('final bot placement separates reused anchors and preserves slotted groups and command metadata',()=>{
 const s=overlapState(),c:Command={type:'organize',turn:s.turnNumber,groups:[{...s.heaven[0],slots:[0,2,4]},s.heaven[1],{id:'new',x:20,y:40,tiles:['blue-a-1','blue-a-2','blue-a-3'],zone:null}],stage:s.heaven,sanctuary:[],opening:['blue-a-1','blue-a-2','blue-a-3']};
 const before=structuredClone(c),out=layoutBotCommand(s,'computer',c);expect(out?.type).toBe('organize');if(out?.type!=='organize')return;
 expect(out.stage).toBe(c.stage);expect(out.opening).toBe(c.opening);expect(out.sanctuary).toBe(c.sanctuary);expect(out.groups[0].slots).toEqual([0,2,4]);expect(out.groups[1]).toEqual(s.heaven[1]);
 const boxes=out.groups.map(g=>formationRect({...g,tiles:g.tiles.map(id=>s.tiles[id])},metrics));for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)expect(overlaps(boxes[i],boxes[j])).toBe(false);expect(c).toEqual(before);expect(layoutBotCommand(s,'computer',out)).toEqual(out);
});
