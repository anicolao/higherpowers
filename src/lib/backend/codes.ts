const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function newTableCode(){return Array.from(crypto.getRandomValues(new Uint8Array(6)),n=>alphabet[n%alphabet.length]).join('');}
/** Keep older invitations working while new tables use six readable characters. */
export function parseTableCode(input:string):string{
 let value=input.trim();
 if(value.includes('?')||value.includes('://')){try{value=new URL(value,'https://higherpowers.invalid').searchParams.get('table')??'';}catch{value='';}}
 if(/^[a-f0-9]{12}$/i.test(value))return value.toLowerCase();
 const code=value.replace(/[\s-]/g,'').toUpperCase();
 if(code.length===6&&[...code].every(c=>alphabet.includes(c)))return code;
 throw new Error('Enter the six-character table code or paste an invite link.');
}
