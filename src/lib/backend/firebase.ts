import {initializeApp,getApps} from 'firebase/app';
import {getAuth,connectAuthEmulator,signInAnonymously} from 'firebase/auth';
import {initializeFirestore,connectFirestoreEmulator,type FirestoreSettings} from 'firebase/firestore';
import {getDatabase,connectDatabaseEmulator} from 'firebase/database';
import config from './firebase-config.json';
let client:Promise<Awaited<ReturnType<typeof initialize>>>|null=null;
async function initialize(){
 const emulator=import.meta.env.VITE_FIREBASE_EMULATORS==='true';
 const app=getApps().find(a=>a.name==='higher-powers')??initializeApp(emulator?{apiKey:'demo-higher-powers',projectId:'demo-higher-powers',databaseURL:'https://demo-higher-powers-default-rtdb.firebaseio.com'}:config,'higher-powers');
 const auth=getAuth(app),db=initializeFirestore(app,{useFetchStreams:!(/Safari/.test(navigator.userAgent)&&!/Chrome|Chromium|Edg/.test(navigator.userAgent))} as FirestoreSettings&{useFetchStreams:boolean}),live=getDatabase(app);
 if(emulator){connectAuthEmulator(auth,'http://127.0.0.1:19301',{disableWarnings:true});connectFirestoreEmulator(db,'127.0.0.1',18301);connectDatabaseEmulator(live,'127.0.0.1',19001);}
 await auth.authStateReady();if(!auth.currentUser)await signInAnonymously(auth);
 return {app,auth,db,live,uid:auth.currentUser!.uid};
}
export function firebase(){return client??=initialize().catch(e=>{client=null;throw e;});}
