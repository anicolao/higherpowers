<script lang="ts">
 import {base} from '$app/paths';
 import InkNumeral from './InkNumeral.svelte';
 let {value=0,allowance,name='Divine Favor'}:{value?:number;allowance?:number;name?:string}=$props();
 const numberSize=$derived(720*(value>=1000?.19:value>=100?.24:.33));
</script>
<span class="divine-favor" role="img" aria-label={`${name}: ${value} Favor${allowance!==undefined?`, inspect ${allowance} souls`:''}`}>
 <span class="favor-coin"><img src={`${base}/art/digital/favor-medallion.webp`} alt="" draggable="false" data-layer="favor-art"/><span class="favor-number" data-layer="favor-value"><InkNumeral {value} fontSize={numberSize} centerX={353} centerY={385}/></span></span>
 {#if allowance!==undefined}<span class="allowance"><strong>{allowance}</strong> to inspect</span>{/if}
</span>
<style>
 .divine-favor{display:inline-flex;flex-direction:column;align-items:center;gap:5px;flex:none}.favor-coin{position:relative;display:block;width:var(--favor-size,88px);aspect-ratio:1;filter:drop-shadow(0 3px 2px #34291d35)}img{display:block;width:100%;height:100%;object-fit:contain}.favor-number{color:#604820;position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}.allowance{font-size:.7rem;white-space:nowrap;color:#796b4e}.allowance strong{color:#4f442d;font-variant-numeric:tabular-nums}
</style>
