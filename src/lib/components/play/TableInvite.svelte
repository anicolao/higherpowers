<script lang="ts">
 let {code,url}:{code:string;url:string}=$props();let message=$state('');let link:HTMLInputElement;
 async function copy(text:string,label:string){try{await navigator.clipboard.writeText(text);message=`${label} copied.`;}catch{link.focus();link.select();message='Select and copy the invite link below.';}}
</script>
<section class="table-invite" aria-label="Invite friends">
 <h2>Invite your friends</h2><p>Share this code or link. Friends enter their name and join your table.</p>
 <button class="invite-code" aria-label="Copy table code" title="Copy table code" onclick={()=>copy(code,'Table code')}><span>TABLE CODE</span><strong>{code}</strong><span>Tap to copy</span></button>
 <label>Invite link<input bind:this={link} readonly value={url} onclick={e=>e.currentTarget.select()}/></label>
 <button class="copy-link" onclick={()=>copy(url,'Invite link')}>Copy invite link</button><span class="copy-status" role="status">{message}</span>
</section>
<style>
 .table-invite{color:#5d492a;background:#f4e8c9;border:1px solid #c3a76a;border-radius:10px;padding:20px;width:100%;box-sizing:border-box;box-shadow:0 8px 25px #08271d44}.table-invite h2{margin:0 0 6px;font:600 29px/1.1 'Cormorant Garamond',Georgia}.table-invite p{margin:0 0 12px;font:14px/1.4 'Atkinson Hyperlegible',sans-serif}.invite-code{display:grid;gap:4px;margin:0 auto 12px;padding:8px 18px;background:#fff8e6;color:#68502d;border:1px solid #c5a86c;border-radius:7px;text-align:center}.invite-code span{font:11px/1.2 sans-serif;letter-spacing:.08em}.invite-code strong{font:700 clamp(27px,5vw,40px)/1.1 'Atkinson Hyperlegible',sans-serif;letter-spacing:.14em}.table-invite label{display:grid;gap:4px;font:12px sans-serif}.table-invite input{width:100%;min-width:0;box-sizing:border-box;font:13px sans-serif;padding:9px;background:#fffaf0;border:1px solid #c5ae7d;border-radius:4px;color:#5d492a}.copy-link{margin-top:10px;background:#536044;color:#fff5d9;border:0;padding:9px 14px;border-radius:5px;font:14px sans-serif}.copy-status{display:inline-block;min-height:18px;margin-left:9px;font:12px sans-serif}@media(max-height:600px){.table-invite{padding:12px}.table-invite p{margin-bottom:6px}.invite-code{padding:5px 15px;margin-bottom:6px}.invite-code strong{font-size:27px}.invite-code span:last-child{display:none}}
</style>
