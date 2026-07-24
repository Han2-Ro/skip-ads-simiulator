<script lang='ts'>
import { ads } from "$lib/ads";
</script>

{#each ads as ad, i (i)}
{#if ad.attributionHtml}
    <p class="ad-attribution">{@html ad.attributionHtml} - {ad.date}</p>
{:else}
    <p class="ad-attribution">{`${ad.author} - ${ad.date}, `}<a href={ad.link} target="_blank" rel='external noopener norefferer'>link</a></p>
    {/if}
{/each}

<style>
	.ad-attribution :global(a) {
		color: blue;
	}

	.ad-attribution :global(a:hover) {
		text-decoration: underline;
	}
</style>