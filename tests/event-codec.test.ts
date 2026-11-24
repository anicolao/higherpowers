import {test,expect} from 'bun:test';
import {encodeEvent,decodeEvent} from '../src/lib/backend/event-codec';
import type {GameEvent} from '../src/lib/engine/types';
const event:GameEvent={version:2,sequence:8,id:'organize',actor:'a',command:{type:'organize',groups:[],turn:3,sanctuary:[[['a','b','c','d','e','f']],[['a','b','c'],['d','e','f']]]}};
test('Sanctuary history round-trips without nested arrays or mutation',()=>{
 const before=JSON.stringify(event),stored=encodeEvent(event);
 function check(value:unknown,inArray=false){if(Array.isArray(value)){expect(inArray).toBe(false);for(const item of value)check(item,true);}else if(value&&typeof value==='object')for(const item of Object.values(value))check(item);}
 check(stored);expect(decodeEvent(JSON.parse(JSON.stringify(stored)))).toEqual(event);expect(JSON.stringify(event)).toBe(before);
});
test('ordinary events and original replay histories stay compatible',()=>{
 const ordinary:GameEvent={version:1,sequence:1,id:'create',actor:'a',command:{type:'create',name:'A',seed:'seed'}};
 expect(decodeEvent(encodeEvent(ordinary))).toEqual(ordinary);expect(decodeEvent(event)).toEqual(event);
});
