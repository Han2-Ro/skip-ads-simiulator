<script lang="ts">
	import Ad1 from '../lib/assets/ads/_Cannon__Wilkins_Coffee_commercial_(1957).webm.480p.vp9-DJ6ntx1g.webm';
	import Ad2 from '../lib/assets/ads/Outdoor_Stone_Options_For_Residential_&_Commercial_Properties_by_Josh_Bois_(Clip_in_WebM_Format).webm';
    import Ad3 from "../lib/assets/ads/Jim_Henson_-_McGarry's_Sausages_featuring_Kermit_and_Mack_(1964).webm"

	function pickRandom<T>(arr: T[]): T {
		if (arr.length === 0) throw new Error('Cannot pick from an empty array');
		return arr[Math.floor(Math.random() * arr.length)];
	}

	type GameState = 'inGame' | 'startScreen' | 'endScreen';
	let gameState: GameState = $state('startScreen');
	const ads = [Ad1, Ad2, Ad3];
    let countdown = $state(5);
    let skipEnabled = $state(false);
    let startTimestamp = -1;
    let reactionTime = -1;

	let ad = $state(pickRandom(ads));
	let video: HTMLVideoElement | undefined = undefined;

	function start() {
		gameState = 'inGame';
        const interval = setInterval(() => {
            countdown--;
            if(countdown <= 0) {
                startTimestamp = Date.now();
                skipEnabled = true;
                clearInterval(interval);
            }
        }, 1000)
	}

    function stop() {
        reactionTime = Date.now() - startTimestamp;
        gameState = 'endScreen';
    }
</script>

<main class="h-screen w-screen bg-neutral-900 text-white">
	<h1 class=" text-2xl">YouTube</h1>
	<div class="h-full flex justify-center items-center">
		{#if gameState === 'startScreen'}
			<button class=" border-2 border-white p-2 rounded-xl text-2xl" onclick={start}>Start</button>
		{:else if gameState === 'inGame'}
        <div class="relative">
			<video bind:this={video} src={ad} autoplay />
            <button disabled={!skipEnabled} onclick={stop} class="bg-black py-2 px-4 absolute right-0 bottom-5">Skip {countdown > 0 ? `| ${countdown}` : ''}</button>
        </div>
        {:else if gameState === 'endScreen'}
        <div>
            You watched <span class="font-bold">{reactionTime}ms</span> of unnecessary ads.
        </div>
		{/if}
	</div>
</main>
