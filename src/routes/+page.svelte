<script lang="ts">
	import Account from '$lib/assets/account.svelte';
	import { pickRandom, getRandomAd } from '$lib/random';

	type GameState = 'inGame' | 'startScreen' | 'endScreen';
	let gameState: GameState = $state('startScreen');
	let countdown = $state(5);
	let startTimestamp = -1;
	let earlyClicks = $state(0);
	let missedClicks = $state(0);
	let reactionTime = $state(-1);
	let skipEnabled = $derived(gameState === 'inGame' && countdown <= 0);
	let level = $state(0);
	let button_x = $state('right-0');
	let button_anim: '' | 'oscillate' | 'jump' = $state('');

	//score
	let shit_points = $state(0);
	let shit_points_limit = $state(1000);
	let shit_percent = $derived(shit_points * 100 / shit_points_limit);
	let score = $state(0);

	//

	let ad = $state(getRandomAd());

	function start() {
		ad = getRandomAd();
		earlyClicks = 0;
		missedClicks = 0;
		startTimestamp = -1;
		shit_points_limit += 250;

		button_x = level < 3 ? 'right-0' : Math.random() < 0.5 ? 'right-0' : 'left-0';
		button_anim =
			level < 5
				? ''
				: level < 8
					? pickRandom(['oscillate', ''])
					: pickRandom(['', 'oscillate', 'jump']);
		countdown = level < 3 ? 5 : 2 + Math.floor(Math.random() * 5);

		console.log('button_x', button_x);
		console.log('button_anim', button_anim);
		console.log('countdown', countdown);
		console.log('shit', shit_points, '/', shit_points_limit, '=', shit_percent);

		gameState = 'inGame';
		const interval = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				startTimestamp = Date.now();
				clearInterval(interval);
			}
		}, 1000);
	}

	function stop() {
		reactionTime = Date.now() - startTimestamp;
		gameState = 'endScreen';
		score += 10000 / reactionTime;
		shit_points += reactionTime;
		level++;
	}
</script>

<div class="absolute inset-x-[25%] top-4 h-10 rounded-full border border-white/20 p-1">
	<div class="h-full min-w-7 rounded-full bg-white/50" style="width: {shit_percent}%">{`${shit_points.toFixed(0)}/${shit_points_limit}`}</div>
</div>
<div
	class="absolute top-4 right-4 flex h-10 min-w-13 items-center justify-center gap-2 rounded-full border border-white/20 p-2 text-xl font-bold text-[#3ea6ff]"
>
	<Account /><span class="px-1">{score.toFixed(0)}</span>
</div>
<div class="flex h-full flex-col items-center justify-center">
	{#if gameState === 'startScreen'}
		<button class=" rounded-xl border-2 border-white p-2 text-2xl" onclick={start}>Start</button>
	{:else if gameState === 'inGame'}
		<div class="relative">
			<video
				onclick={() => {
					missedClicks++;
				}}
				src={ad}
				autoplay
				onended={start}
			/>
			<button
				onclick={skipEnabled
					? stop
					: () => {
							earlyClicks++;
						}}
				class={`absolute bottom-5 bg-black px-4 py-2 ${button_x} ${button_anim}`}
				>Skip {countdown > 0 ? `| ${countdown}` : ''}</button
			>
		</div>
	{:else if gameState === 'endScreen'}
		<div class="flex flex-col items-center gap-5">
			<p>You watched <span class="font-bold">{reactionTime}ms</span> of unnecessary ads.</p>
			{#if earlyClicks > 0}<p>
					You clicked too early <span class="font-bold"
						>{`${earlyClicks} time${earlyClicks > 1 ? 's' : ''}`}</span
					>
				</p>{/if}
			{#if missedClicks > 0}<p>
					You missed the button <span class="font-bold"
						>{`${missedClicks} time${missedClicks > 1 ? 's' : ''}`}</span
					>
				</p>{/if}
			<button class=" rounded-xl border-2 border-white p-2 text-2xl" onclick={start}>Next</button>
		</div>
	{/if}
</div>

<style>
	.oscillate {
		animation: move 2s ease-in-out 0s infinite alternate;
		transform: translateY(-100px);
	}
	.jump {
		animation: move 1s steps(2, jump-both) 0s infinite alternate;
		transform: translateY(-100px);
	}
	@keyframes move {
		0% {
			transform: translateY(0);
		}
		1000% {
			transform: translateY(-1000px);
		}
	}
</style>
