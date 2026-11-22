import {mount,unmount} from 'svelte';
import SharedHeaven from '../../src/lib/components/digital/SharedHeaven.svelte';
import {souls} from '../../src/lib/engine/engine';
const pool=souls();let board:ReturnType<typeof mount>;
(window as any).loadLayout=async(kind='tidy')=>{
 if(board)await unmount(board);
 const group=(id:string,color:string,x:number,y:number)=>({id,x,y,tiles:[3,4,5].map(r=>pool[`${color}-a-${r}`])});
 const initialGroups=kind==='transpose'?[group('black','black',200,80),group('red','red',200,157),group('blue','blue',200,234)]:[group('black','black',kind==='scale'?950:280,kind==='scale'?850:280),group('red','red',50,70)];
 board=mount(SharedHeaven,{target:document.body,props:{game:true,insetX:35,insetY:20,initialGroups,boardKey:kind}});(window as any).heaven=board;
};void (window as any).loadLayout();
