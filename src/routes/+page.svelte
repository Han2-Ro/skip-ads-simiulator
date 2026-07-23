<script lang="ts">
	import Ad1 from '../lib/assets/_Cannon__Wilkins_Coffee_commercial_(1957).webm.480p.vp9-DJ6ntx1g.webm';
	import Ad2 from '../lib/assets/Outdoor_Stone_Options_For_Residential_&_Commercial_Properties_by_Josh_Bois_(Clip_in_WebM_Format).webm';

	function pickRandom<T>(arr: T[]): T {
		if (arr.length === 0) throw new Error('Cannot pick from an empty array');
		return arr[Math.floor(Math.random() * arr.length)];
	}

	type GameState = 'inGame' | 'startScreen';
	let gameState: GameState = $state('startScreen');
	const ads = [Ad1, Ad2];

	let ad = $state(pickRandom(ads));
	let video: HTMLVideoElement | undefined = undefined;

	function start() {
		gameState = 'inGame';
	}
</script>

<h1>YouTube</h1>
{#if gameState === 'startScreen'}
	<button onclick={start}>Start</button>
{:else if gameState === 'inGame'}
	<video bind:this={video} autoplay>
		<source src={ad} />
	</video>
{/if}
