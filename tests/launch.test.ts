import {test,expect} from 'bun:test';
import {readLaunch} from '../src/lib/backend/launch';
import {parseTableCode} from '../src/lib/backend/codes';
import {readFileSync} from 'node:fs';

test('Game Room invitations preserve codes and preferences without adopting outside identities',()=>{
 expect(readLaunch('?table=abc123de&launch=join&name=%20Alex%20&uid=another-player&returnTo=javascript:bad')).toEqual({mode:'join',table:'ABC123DE',name:'Alex'});
 expect(readLaunch('?table=ABC123DE&launch=create&name=Alex').mode).toBe('create');
 expect(readLaunch('?table=abcde')).toEqual({mode:null,table:'ABCDE',name:''});
 expect(readLaunch('?practice=1').mode).toBeNull();
 for(const search of ['?launch=other','?launch=create&name=Alex','?launch=join&table=ABC123DE','?launch=create&table=ABCDE&name=Alex',`?launch=join&table=ABC123DE&name=${'a'.repeat(41)}`])expect(()=>readLaunch(search)).toThrow();
 expect(parseTableCode('https://example.test/play/?table=ABC123DE')).toBe('ABC123DE');
});
test('both discoverable launch manifests match the shared catalogue document ID',()=>{
 const contract={game:'higherpowers',protocol:'gameroom-url',version:1};
 for(const path of ['static/gameroom-launch.json','static/play/gameroom-launch.json'])expect(JSON.parse(readFileSync(path,'utf8'))).toEqual(contract);
});
