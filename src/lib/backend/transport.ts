type BrowserIdentity={maxTouchPoints:number;platform:string;userAgent:string};
/** Match Jaipur: WebKit can buffer Firestore's final Fetch Streams frame. */
export function shouldUseFetchStreams(browser:BrowserIdentity|undefined){
 if(!browser)return true;
 const ios=/iPad|iPhone|iPod/.test(browser.userAgent)||(browser.platform==='MacIntel'&&browser.maxTouchPoints>1);
 const safari=/^((?!chrome|android|crios|fxios).)*safari/i.test(browser.userAgent);
 return !(ios||safari);
}
