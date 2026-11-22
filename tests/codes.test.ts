import {test,expect} from 'bun:test';
import {newTableCode,parseTableCode} from '../src/lib/backend/codes';
test('new table codes use six unambiguous characters',()=>{for(let i=0;i<100;i++)expect(newTableCode()).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);});
test('codes accept case, spaces, dashes and complete invitation URLs',()=>{
 for(const text of ['ABC234','abc234','abc-234',' abc 234 ','https://anicolao.github.io/higherpowers/pr4/play/?table=abc234&extra=1','/play?table=ABC234'])expect(parseTableCode(text)).toBe('ABC234');
 expect(parseTableCode('AbC123DEF456')).toBe('abc123def456');expect(parseTableCode('https://example.com/play?table=abc123def456')).toBe('abc123def456');
 for(const text of ['','ABC','AAAAAA/../bad','https://example.com/no-code','OI0123','https://example.com/?table=bad'])expect(()=>parseTableCode(text)).toThrow('six-character');
});
