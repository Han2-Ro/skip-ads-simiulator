<script lang="ts">
	import { ads } from '$lib/ads';
</script>

<div class="ad-attribution">
	<h2 class="text-xl">Icons</h2>
	<p>
		Vectors and icons by <a
			href="https://www.figma.com/@chikin_icons?ref=svgrepo.com"
			target="_blank">Chikin Icons</a
		>
		in CC Attribution License via <a href="https://www.svgrepo.com/" target="_blank">SVG Repo</a>
	</p>
	<p>
		Vectors and icons by <a
			href="https://github.com/bem/yandex-ui-icons?ref=svgrepo.com"
			target="_blank">Yandex</a
		>
		in MLP License via <a href="https://www.svgrepo.com/" target="_blank">SVG Repo</a>
	</p>
	<h2 class="mt-8 text-xl">Ads</h2>
	{#each ads as ad, i (i)}
		{#if ad.attributionHtml}
			<p class="ad-attribution">{@html ad.attributionHtml} - {ad.date}</p>
		{:else}
			<p class="ad-attribution">
				{`${ad.author} - ${ad.date}, `}<a
					href={ad.link}
					target="_blank"
					rel="external noopener norefferer">link</a
				>
			</p>
		{/if}
	{/each}
</div>

<style>
	.ad-attribution :global(a) {
		color: blue;
	}

	.ad-attribution :global(a:hover) {
		text-decoration: underline;
	}
</style>
