<script lang="ts">
	import Account from '$lib/assets/account.svelte';
	import { pickRandom, getRandomAd } from '$lib/random';

	type GameState = 'adPlaying' | 'startScreen' | 'scoreScreen' | 'endScreen';
	let gameState: GameState = $state('startScreen');
	let countdown = $state(5);
	let startTimestamp = -1;
	let earlyClicks = $state(0);
	let missedClicks = $state(0);
	let reactionTime = $state(-1);
	let skipEnabled = $derived(gameState === 'adPlaying' && countdown <= 0);
	let level = $state(0);
	let button_x = $state('right-0');
	let button_anim: '' | 'oscillate' | 'jump' = $state('');

	// score
	let shitPoints = $state(0);
	let shitPointsLimit = $state(1000);
	let shitPercent = $derived((shitPoints * 100) / shitPointsLimit);
	let score = $state(0);

	// score caluculation
	let shitPointsDelta = $derived(Math.log(0.005 * reactionTime + 1) * 300);
	let reactionScore = $derived(10000 / reactionTime);
	let earlyPenalty = $derived(earlyClicks * 20);
	let missPenalty = $derived(missedClicks * 5);
	let totalScoreDelta = $derived(reactionScore - earlyPenalty - missPenalty);

	let ad = $state(getRandomAd());

	type CountUpParams = {
		value: number;
		from?: number;
		format?: (n: number) => string;
		duration?: number;
		prefix?: string;
		suffix?: string;
		delay?: number;
	};

	// Svelte action: animates the element's text content from `from` to `value`.
	export function countUp(node: HTMLElement, params: CountUpParams) {
		const { format = (n) => n.toFixed(0), duration = 1500, delay = 0, prefix = '', suffix = '' } = params;
		let raf = 0;
		let current = params.from ?? 0;
		const target = params.value;

		function animate(from: number, to: number) {
			const startTime = performance.now();
			cancelAnimationFrame(raf);
			function tick(now: number) {
				if (now - startTime < delay) {
					raf = requestAnimationFrame(tick);
					return;
				}
				const t = Math.min((now - startTime - delay) / duration, 1);
				const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
				current = from + (to - from) * eased;
				node.textContent = prefix + format(current) + suffix;
				if (t < 1) raf = requestAnimationFrame(tick);
				else current = to;
			}
			raf = requestAnimationFrame(tick);
		}

		animate(current, target);
		return {
			update(next: CountUpParams) {
				animate(current, next.value);
			},
			destroy() {
				cancelAnimationFrame(raf);
			}
		};
	}

	function next() {
		ad = getRandomAd();
		earlyClicks = 0;
		missedClicks = 0;
		startTimestamp = -1;
		shitPointsLimit += 250;

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
		console.log('shit', shitPoints, '/', shitPointsLimit, '=', shitPercent);

		gameState = 'adPlaying';
		const interval = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				startTimestamp = Date.now();
				clearInterval(interval);
			}
		}, 1000);
	}

	function start() {
		level = 0;
		shitPoints = 0;
		shitPointsLimit = 1000;
		score = 0;
		next();
	}

	function stop() {
		reactionTime = Date.now() - startTimestamp;
		gameState = 'scoreScreen';
		score += totalScoreDelta;
		shitPoints += shitPointsDelta;
		level++;
		if (shitPoints >= shitPointsLimit) {
			gameState = 'startScreen';
		}
	}
</script>

<div class="absolute inset-x-[25%] top-4 h-10 rounded-full border border-white/20 p-1">
	<div class="h-full max-w-full min-w-7 rounded-full bg-white/50" style="width: {shitPercent}%">
		<!-- {`${shitPoints.toFixed(0)}/${shitPointsLimit}`} -->
	</div>
</div>
<div
	class="absolute top-4 right-4 flex h-10 min-w-13 items-center justify-center gap-2 rounded-full border border-white/20 p-2 text-xl font-bold text-[#3ea6ff]"
>
	<Account /><span class="px-1" use:countUp={{ value: score, from: score, delay: 1500 }}>{score.toFixed(0)}</span>
</div>
<div class="flex h-full flex-col items-center justify-center">
	{#if gameState === 'startScreen'}
		<div
			class="flex max-w-lg flex-col items-center gap-2 rounded-lg border border-white/20 bg-[#212121] px-10 py-5 text-center text-sm text-neutral-300"
		>
			<h2 class="text-lg font-bold text-white">
				{#if score === 0}
					Skip the ads!
				{:else}
					Too slow! The ad-meter is full.
				{/if}
			</h2>
			<p>Can you hit the perfect skip? Keep the ad-meter low and the score high.</p>
			<p>Tipp: if you're fast enough the ad-meter can go down again.</p>
			{#if score > 0}
				<p>Last Score: {score.toFixed()}</p>
			{/if}
			<button
				class="mt-2 w-full rounded-full bg-linear-to-t from-white/10 to-white/20 p-1 font-bold text-white"
				onclick={start}>Start</button
			>
		</div>
	{:else if gameState === 'adPlaying'}
		<div class="relative">
			<video
				onclick={() => {
					missedClicks++;
				}}
				src={ad}
				autoplay
				onended={next}
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
	{:else if gameState === 'scoreScreen'}
		<div
			class="flex max-w-lg flex-col items-center gap-2 rounded-lg border border-white/20 bg-[#212121] px-10 py-5 text-center text-sm text-neutral-300"
		>
			<h2 class="font-bold text-lg text-white">
				Skipped!
			</h2>
			<p>
				You watched <span class="font-bold">{reactionTime}ms</span> of unnecessary ads.
				<span
					class="pl-2 font-bold text-green-700"
					use:countUp={{ value: reactionScore, prefix: '+' }}>+{reactionScore.toFixed(0)}</span
				>
			</p>
			{#if earlyClicks > 0}<p>
					You clicked too early <span class="font-bold"
						>{`${earlyClicks} time${earlyClicks > 1 ? 's' : ''}`}</span
					>.
					<span
						class="pl-2 font-bold text-red-700"
						use:countUp={{ value: earlyPenalty, prefix: '-' }}>-{earlyPenalty}</span
					>
				</p>{/if}
			{#if missedClicks > 0}<p>
					You missed the button <span class="font-bold"
						>{`${missedClicks} time${missedClicks > 1 ? 's' : ''}`}</span
					>.
					<span
						class="pl-2 font-bold text-red-700"
						use:countUp={{ value: missPenalty, prefix: '-' }}>-{missPenalty}</span
					>
				</p>{/if}
			<!-- <p>+{shitPointsDelta}</p> -->
			<button
				class="mt-2 w-full rounded-full bg-linear-to-t from-white/10 to-white/20 p-1 font-bold text-white"
				onclick={next}>Next</button
			>
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
