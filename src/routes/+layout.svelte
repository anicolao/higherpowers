<script lang="ts">
 import {base} from '$app/paths';
 import '@fontsource/cormorant-garamond/400.css';
 import '@fontsource/cormorant-garamond/500.css';
 import '@fontsource/cormorant-garamond/600.css';
 import '@fontsource/cormorant-garamond/700.css';
 import '@fontsource/atkinson-hyperlegible/400.css';
 import '@fontsource/atkinson-hyperlegible/700.css';
 import '../app.css';
 let {children}=$props();
</script>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header"><a class="wordmark" href={`${base}/`}>Higher <em>Powers</em><span>THE GRAND ORDER</span></a><nav aria-label="Main navigation"><a href={`${base}/play`}>Play</a><a href={`${base}/rules.html`}>Rulebook</a><a href={`${base}/gallery`}>Components</a><a class="nav-print" href={`${base}/gallery/print`}>Print & play</a></nav></header>
{@render children()}
<footer class="site-footer"><span>Heaven is a team effort. Only one angel gets promoted.</span><a href="https://github.com/anicolao/higherpowers">Source & artwork · GPL v3</a></footer>
