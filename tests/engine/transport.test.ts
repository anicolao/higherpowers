import {test,expect} from 'bun:test';
import {shouldUseFetchStreams} from '../../src/lib/backend/transport';
for(const [name,userAgent,platform,maxTouchPoints,expected] of [
 ['Safari','Mozilla/5.0 (Macintosh) Version/26.5 Safari/626.2.5','MacIntel',0,false],
 ['iPhone Safari','Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1','iPhone',5,false],
 ['iOS Chrome','Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 CriOS/140.0 Mobile/15E148 Safari/604.1','iPhone',5,false],
 ['iOS Firefox','Mozilla/5.0 (iPhone) FxiOS/140.0 Mobile Safari/605.1.15','iPhone',5,false],
 ['iPad desktop mode','Mozilla/5.0 (Macintosh) Version/26.5 Safari/626.2.5','MacIntel',5,false],
 ['iOS webview without Safari token','Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Mobile/15E148','iPhone',5,false],
 ['iPad desktop identity without Safari token','Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15','MacIntel',5,false],
 ['iOS Edge','Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 EdgiOS/140.0 Mobile/15E148','iPhone',5,false],
 ['Desktop Edge','Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/140.0 Safari/537.36 Edg/140.0','Win32',0,true],
 ['Chrome','Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/140.0 Safari/537.36','MacIntel',0,true],
 ['Firefox','Mozilla/5.0 Gecko/20100101 Firefox/140.0','MacIntel',0,true],
 ['Android Chrome','Mozilla/5.0 (Linux; Android) Chrome/140.0 Mobile Safari/537.36','Linux arm',5,true]
] as const)test(`Firestore transport: ${name}`,()=>expect(shouldUseFetchStreams({userAgent,platform,maxTouchPoints})).toBe(expected));
test('server rendering has no browser requirement',()=>expect(shouldUseFetchStreams(undefined)).toBe(true));
