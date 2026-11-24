/** Keep metadata readable and complete per-game data compact in code review. */
export function reportJson(value:{results?:unknown[];[key:string]:unknown}){
 const {results,...metadata}=value;if(!results)return JSON.stringify(value,null,2)+'\n';
 return JSON.stringify(metadata,null,2).slice(0,-2)+',\n  "results": [\n'+results.map(row=>'    '+JSON.stringify(row)).join(',\n')+'\n  ]\n}\n';
}
