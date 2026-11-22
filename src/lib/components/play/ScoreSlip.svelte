<script lang="ts">
 import InkNumeral from '../digital/InkNumeral.svelte';
 let {value=0,name='Your'}:{value?:number;name?:string}=$props();
</script>
<span class="score-slip" role="img" aria-label={`${name} score: ${value} points`} title={`Score: ${value} points`}>
 <svg viewBox="0 0 116 72" aria-hidden="true"><path d="m4 5 100-2 7 9-2 56-103-2Z" fill="#f6edcf" stroke="#bda373" stroke-width="1.7"/><path d="m104 3-2 12 9-3" fill="#dfcca0" stroke="#bda373" stroke-width="1"/><path d="M14 57h84M25 15v44" stroke="#b3976277" stroke-width=".8"/><text x="10" y="23" fill="#8c7041" font-family="Georgia,serif" font-size="17">∑</text></svg>
 <InkNumeral {value} width={116} height={72} centerX={64} centerY={34} fontSize={String(value).length>3?27:36}/>
</span>
<style>
 .score-slip{position:relative;display:block;width:100%;height:100%;color:#654c2b;filter:drop-shadow(0 2px 2px #14281a55)}.score-slip>svg{display:block;width:100%;height:100%}
</style>
