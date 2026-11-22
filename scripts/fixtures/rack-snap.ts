import {mount,unmount} from 'svelte';
import RackSnap from './RackSnap.svelte';
import {souls} from '../../src/lib/engine/engine';
const pool=souls();let component:ReturnType<typeof mount>;
const root=document.createElement('div');document.body.append(root);
async function load(kind='procession'){
 if(component)await unmount(component);
 const choir=kind==='choir',ranks=kind==='procession'?[3,4,5]:[1,2,3],colors=choir?['black','red','blue','green']:['black','black','black'];
 const ids=choir?colors.map(c=>`${c}-a-4`):ranks.map(r=>`black-a-${r}`),incoming=choir?['green-a-5','black-a-5','blue-a-5']:kind==='procession'?['red-a-4','red-a-5','red-a-6']:['black-a-4','black-a-5','black-a-6'];
 component=mount(RackSnap,{target:root,props:{initialGroups:[{id:'target',x:200,y:150,tiles:ids.map(id=>pool[id]),zone:kind==='protected'?'rival':null}],tiles:incoming.map(id=>pool[id])}});
}
(window as any).loadSnap=load;void load();
