import {test,expect} from 'bun:test';
import {hasCommittedKeep} from '../src/lib/backend/committed';
import type {GameEvent} from '../src/lib/engine/types';
const events:GameEvent[]=[{version:1,sequence:31,id:'winner',actor:'michael',command:{type:'keep',tile:'green-b-13',turn:11}}];
test('a racing or delayed copy of the same keep is already committed',()=>{expect(hasCommittedKeep(events,'michael',{type:'keep',tile:'green-b-13',turn:11})).toBe(true);});
test('completion requires the same actor, turn, tile, and command type',()=>{
 expect(hasCommittedKeep(events,'barachiel',{type:'keep',tile:'green-b-13',turn:11})).toBe(false);
 expect(hasCommittedKeep(events,'michael',{type:'keep',tile:'green-b-13',turn:12})).toBe(false);
 expect(hasCommittedKeep(events,'michael',{type:'keep',tile:'green-a-13',turn:11})).toBe(false);
 expect(hasCommittedKeep(events,'michael',{type:'draw',turn:11})).toBe(false);
 expect(hasCommittedKeep([],'michael',{type:'keep',tile:'green-b-13',turn:11})).toBe(false);
});
