<script lang="ts">
 let {color='black'}:{color?:'black'|'red'|'blue'|'green'}=$props();
</script>
<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" data-suit={color==='black'?'spades':color==='red'?'hearts':color==='blue'?'diamonds':'clubs'}>
 {#if color==='black'}<path d="M12 1C9 5 2 8 2 13a5 5 0 0 0 8 4c-.2 2-1 4-2.5 5h9c-1.5-1-2.3-3-2.5-5a5 5 0 0 0 8-4C22 8 15 5 12 1Z"/>
 {:else if color==='red'}<path d="M12 22 3 13C-3 6 5-2 12 5c7-7 15 1 9 8Z"/>
 {:else if color==='blue'}<path d="m12 1 10 11-10 11L2 12Z"/>
 {:else}<path d="M12 1a5 5 0 0 0-4.3 7.6A5 5 0 1 0 10 17c-.2 2-1 4-2.5 5h9c-1.5-1-2.3-3-2.5-5a5 5 0 1 0 2.3-8.4A5 5 0 0 0 12 1Z"/>{/if}
</svg>
