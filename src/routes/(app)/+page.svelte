<script lang="ts">
	import Account from '$lib/assets/AccountIcon.svelte';
	import Skip from '$lib/assets/SkipIcon.svelte';
	import { pickRandom, getRandomAd } from '$lib/random';
	import { getUsername } from '$lib/user.svelte';
	import { submitScore } from '$lib/pocketbase';
	import Logo from '$lib/assets/Logo.svelte';

	// Opens the mock advertiser landing page in a new tab. `from` records why
	// the player got sent there ('early' misclick on the skip button, 'missed'
	// click on the video itself) so the ad page can explain itself.
	function openAdPage(from: 'early' | 'missed') {
		window.open(`https://skip-ads.han2.dev/ad?from=${from}`, '_blank', 'noopener');
	}

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

	// leaderboard submission status for the end-of-game screen
	let submitting = $state(false);
	let submitted = $state<null | boolean>(null); // null = not attempted, true/false = outcome

	// score
	let shitPoints = $state(600);
	let shitPointsLimit = $state(1100);
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
	let videoCurrentTime = $state(0);
	let videoDuration = $state(0);
	let adProgress = $derived(videoDuration > 0 ? (videoCurrentTime / videoDuration) * 100 : 0);

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

	// map each runtime state to its COMPLETE tailwind class so the JIT
	// scanner can see the full literals (see https://tailwindcss.com/docs/content)
	const tbClass = { top: 'top-5', bottom: 'bottom-5' } as const;
	const lrClass = { left: 'left-2', right: 'right-2' } as const;

	function next() {
		clearInterval(interval);
		ad = getRandomAd();
		earlyClicks = 0;
		missedClicks = 0;
		startTimestamp = -1;
		const shitPointsMinus = (Math.atan(-0.4 * level + 4) + Math.PI / 2) * 110;
		console.log('Insanity-Meter minus:', shitPointsMinus);
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
		submitting = false;
		submitted = null;
		next();
	}

	function stop() {
		clearInterval(interval);
		reactionTime = Date.now() - startTimestamp;
		gameState = 'scoreScreen';
		score += totalScoreDelta;
		console.log('Insanity-Meter add:', shitPointsDelta);
		shitPoints += shitPointsDelta;
		level++;
		if (shitPoints >= shitPointsLimit) {
			gameState = 'startScreen';
			// The run is over — submit the final score to the leaderboard.
			// Guests (no username) are skipped silently by submitScore.
			void submitFinal();
		}
	}

	async function submitFinal() {
		if (getUsername() === null) {
			submitted = null; // guest — nothing to submit, no status shown
			return;
		}
		submitting = true;
		submitted = null;
		const rec = await submitScore(score);
		submitted = rec !== null;
		submitting = false;
	}
</script>

<!-- Insanity-Meter -->
<div class="absolute inset-x-[25%] top-4 h-10 rounded-full border border-white/20 p-1">
	<div
		class="h-full max-w-full min-w-7 rounded-full transition-[width,background-color] duration-700 ease-out"
		style="width: {shitPercent}%; background-color: hsl({(120 - shitPercent * 1.2).toFixed(
			0
		)} 80% 45%)"
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
<div class="flex h-full flex-col items-center justify-center p-2">
	{#if gameState === 'startScreen'}
		<div
			class="flex max-w-lg flex-col items-center gap-2 rounded-lg border border-white/20 bg-[#212121] px-10 py-5 text-center text-sm text-neutral-300"
		>
			<h2 class="text-lg font-bold text-white">
				{#if score === 0}
					Skip the ads!
				{:else}
					Too slow! The ads made you insane.
				{/if}
			</h2>
			<p>Can you hit the perfect skip? Keep the Insanity-Meter low and the score high.</p>
			<p>Tip: if you're fast enough the Insanity-Meter can go down again.</p>
			{#if score > 0}
				<p>Last Score: {score.toFixed()}</p>
			{/if}
			{#if submitting}
				<p class="text-white/50">Submitting score…</p>
			{:else if submitted === true}
				<p class="text-green-500">Score submitted to leaderboard ✓</p>
			{:else if submitted === false}
				<p class="text-red-500">Could not submit score.</p>
			{/if}
			<button
				class="mt-2 w-full rounded-full bg-linear-to-t from-white/10 to-white/20 p-1 font-bold text-white"
				onclick={start}>Start</button
			>
		</div>
	{:else if gameState === 'adPlaying'}
		<div>
			<div class="relative">
				<video
					class="h-[720px] max-h-[70vh] rounded-2xl"
					onclick={() => {
						missedClicks++;
						openAdPage('missed');
					}}
					src={ad}
					autoplay
					onended={next}
					onloadedmetadata={(e) => (videoDuration = e.currentTarget.duration)}
					ontimeupdate={(e) => (videoCurrentTime = e.currentTarget.currentTime)}
				/>

				<!-- ad progress bar -->
				<div class="absolute inset-x-5 bottom-3 h-1.5 bg-neutral-600">
					<div class="h-full bg-yellow-400" style="width: {adProgress}%"></div>
				</div>

				<!-- skip button -->
				<button
					onclick={skipEnabled
						? stop
						: () => {
								earlyClicks++;
								openAdPage('early');
							}}
					class={`absolute p-2 ${tbClass[button_tb]} ${lrClass[button_lr]} ${button_anim === 'oscillate' ? 'transition-transform duration-1000 ease-linear' : ''}`}
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
			<h2 class="py-4 text-start text-xl">The top ten longest water slides!!!</h2>
			<div class="flex gap-2">
				<div class="h-10 w-10 items-center rounded-full bg-blue-700"></div>
				<div>
					<div>Channel Name</div>
					<div class="text-sm text-white/50">21M subscribers</div>
				</div>
				<div class="ml-4 flex h-10 items-center rounded-full bg-white px-3 text-black">
					Subscribe
				</div>
			</div>
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
