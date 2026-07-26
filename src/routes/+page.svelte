<script lang="ts">
	import Account from '$lib/assets/account.svelte';
	import Skip from '$lib/assets/skip.svelte';
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
	let button_lr: 'left' | 'right' = $state('right');
	let button_tb: 'top' | 'bottom' = $state('bottom');
	let button_anim_target_x = $state(0);
	let button_anim_target_y = $state(0);
	let button_offset_x = $state(0);
	let button_offset_y = $state(0);
	let button_anim: '' | 'oscillate' | 'jump' = $state('');

	// score
	let shitPoints = $state(750);
	let shitPointsLimit = $state(1500);
	let shitPercent = $derived((shitPoints * 100) / shitPointsLimit);
	let score = $state(0);

	// score caluculation
	let shitPointsDelta = $derived(Math.log(0.005 * reactionTime + 1) * 300);
	let reactionScore = $derived(10000 / reactionTime);
	let earlyPenalty = $derived(earlyClicks * 20);
	let missPenalty = $derived(missedClicks * 5);
	let totalScoreDelta = $derived(reactionScore - earlyPenalty - missPenalty);

	let ad = $state(getRandomAd());
	let interval: NodeJS.Timeout;

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
		const {
			format = (n) => n.toFixed(0),
			duration = 1500,
			delay = 0,
			prefix = '',
			suffix = ''
		} = params;
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
		clearInterval(interval);
		ad = getRandomAd();
		earlyClicks = 0;
		missedClicks = 0;
		startTimestamp = -1;
		const shitPointsMinus = (Math.atan(-0.15 * level + 4) + Math.PI/2) * 110;
		console.log('ad-meter minus:', shitPointsMinus)
		shitPoints -= shitPointsMinus;
		if (shitPoints < 0) shitPoints = 0;

		countdown = level < 3 ? 5 : 2 + Math.floor(Math.random() * 5);

		button_lr = level < 3 ? 'right' : Math.random() < 0.5 ? 'right' : 'left';
		button_tb = level < 3 ? 'bottom' : Math.random() < 0.5 ? 'bottom' : 'top';

		button_anim_target_y = level < 5 || Math.random() < 0.5 ? 0 : 30 + Math.random() * 150;
		if (button_tb === 'bottom') button_anim_target_y *= -1;
		button_anim_target_x = level < 8 || Math.random() < 0.5 ? 0 : 30 + Math.random() * 150;
		if (button_lr === 'right') button_anim_target_x *= -1;

		button_anim = level < 8 ? 'oscillate' : pickRandom(['oscillate', 'jump']);

		console.log('lr', button_lr);
		console.log('tb', button_tb);
		console.log('button_anim', button_anim);
		console.log('countdown', countdown);
		console.log('button_anim_target_x', button_anim_target_x);
		console.log('button_anim_target_y', button_anim_target_y);
		console.log('shit', shitPoints, '/', shitPointsLimit, '=', shitPercent);

		gameState = 'adPlaying';
		button_offset_x = countdown % 2 != 0 ? 0 : button_anim_target_x;
		button_offset_y = countdown % 2 != 0 ? 0 : button_anim_target_y;
		interval = setInterval(() => {
			countdown--;
			if (countdown == 0) {
				startTimestamp = Date.now();
			}
			button_offset_x = countdown % 2 != 0 ? 0 : button_anim_target_x;
			button_offset_y = countdown % 2 != 0 ? 0 : button_anim_target_y;
		}, 1000);
	}

	function start() {
		level = 0;
		shitPoints = 1000;
		shitPointsLimit = 2000;
		score = 0;
		next();
	}

	function stop() {
		clearInterval(interval);
		reactionTime = Date.now() - startTimestamp;
		gameState = 'scoreScreen';
		score += totalScoreDelta;
		console.log('ad-meter add:', shitPointsDelta)
		shitPoints += shitPointsDelta;
		level++;
		if (shitPoints >= shitPointsLimit) {
			gameState = 'startScreen';
		}
	}
</script>

<!-- Ad-Meter -->
<div class="absolute inset-x-[25%] top-4 h-10 rounded-full border border-white/20 p-1">
	<div
		class="h-full max-w-full min-w-7 rounded-full bg-white/50 transition-[width] duration-700 ease-out"
		style="width: {shitPercent}%"
	>
		<!-- {`${shitPoints.toFixed(0)}/${shitPointsLimit}`} -->
	</div>
</div>
<div
	class="absolute top-4 right-4 flex h-10 min-w-13 items-center justify-center gap-2 rounded-full border border-white/20 p-2 text-xl font-bold text-[#3ea6ff]"
>
	<Account /><span class="px-1" use:countUp={{ value: score, from: score, delay: 1500 }}
		>{score.toFixed(0)}</span
	>
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
				class="h-[720px] max-h-[70vh]"
				onclick={() => {
					missedClicks++;
				}}
				src={ad}
				autoplay
				onended={next}
			/>

			<!-- skip button -->
			<button
				onclick={skipEnabled
					? stop
					: () => {
							earlyClicks++;
						}}
				class={`absolute p-2 ${button_tb}-5 ${button_lr}-2 ${button_anim === 'oscillate' ? 'transition-transform duration-1000 ease-linear' : ''}`}
				style={`transform: translate(${button_offset_x}px, ${button_offset_y}px)`}
			>
				<div
					class="flex w-[7em] items-center justify-around gap-2 rounded-full bg-black px-2 py-1 opacity-50 hover:opacity-90"
				>
					<span>Skip {countdown > 0 ? `${countdown}` : ''}</span>
					<Skip />
				</div>
			</button>
		</div>
	{:else if gameState === 'scoreScreen'}
		<div
			class="flex max-w-lg flex-col items-center gap-2 rounded-lg border border-white/20 bg-[#212121] px-10 py-5 text-center text-sm text-neutral-300"
		>
			<h2 class="text-lg font-bold text-white">Skipped!</h2>
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
