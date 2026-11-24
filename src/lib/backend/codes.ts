const legacyAlphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function newTableCode(){const letters='ABCDEFGHJKLMNPQRSTUVWXYZ';let code='';while(code.length<5)for(const byte of crypto.getRandomValues(new Uint8Array(8))){if(byte<240)code+=letters[byte%letters.length];if(code.length===5)break;}return code;}
/** Keep older invitations working while new tables use five letters. */
export function parseTableCode(input:string):string{
 let value=input.trim();
 if(value.includes('?')||value.includes('://')){try{value=new URL(value,'https://higherpowers.invalid').searchParams.get('table')??'';}catch{value='';}}
 if(/^[a-f0-9]{12}$/i.test(value))return value.toLowerCase();
 const code=value.replace(/[\s-]/g,'').toUpperCase();
 if(/^[A-Z]{5}$/.test(code)||/^[A-Z0-9]{8}$/.test(code)||code.length===6&&[...code].every(c=>legacyAlphabet.includes(c)))return code;
 throw new Error('Enter the five-letter table code or paste an invite link.');
}
