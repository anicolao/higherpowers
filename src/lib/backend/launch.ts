import {parseTableCode} from './codes';

/** Display names are preferences; Firebase Auth remains the only identity. */
export function readLaunch(search:string){
 const params=new URLSearchParams(search),mode=params.get('launch');
 if(mode!==null&&mode!=='create'&&mode!=='join')throw new Error('This invitation needs a create or join instruction.');
 const raw=params.get('table'),table=raw?parseTableCode(raw):'';
 const name=(params.get('name')??'').trim();
 if(mode&&!/^[A-Z0-9]{8}$/.test(table))throw new Error('This Game Room invitation needs an eight-character table code.');
 if(mode&&(!table||!name||name.length>40))throw new Error('This invitation needs a table code and a name of 1–40 characters.');
 return {mode,table,name};
}
