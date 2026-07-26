<script lang="ts">
	import { ads } from '$lib/ads';
	import { pickRandom } from '$lib/random';
	import { page } from '$app/state';

	// Why the player ended up here: `early` = clicked the skip button before
	// it was ready, `missed` = clicked on the video and missed the button.
	const from = $derived(page.url.searchParams.get('from'));

	// Pick a stable-but-random advertiser for this tab using Math.random at
	// load time. Use one of the real ads so the "after the ad" video matches.
	let ad = $state(pickRandom(ads));

	// Fake infomercial countdown — resets every reload.
	let dealCountdown = $state(9 * 60 + 47); // 9:47, the classic "offer ends soon"
	let countdownInterval: ReturnType<typeof setInterval>;
	$effect(() => {
		countdownInterval = setInterval(() => {
			dealCountdown = Math.max(0, dealCountdown - 1);
		}, 1000);
		return () => clearInterval(countdownInterval);
	});

	function fmt(t: number): string {
		const m = Math.floor(t / 60)
			.toString()
			.padStart(2, '0');
		const s = (t % 60).toString().padStart(2, '0');
		return `${m}:${s}`;
	}

	function rollAd() {
		ad = pickRandom(ads);
	}

	const reasonText = {
		early: 'You clicked the skip button before it was ready.',
		missed: 'You clicked on the video and missed the skip button.'
	} as const;
</script>

<svelte:head>
	<title>{ad.author ?? 'Sponsor'} — Special Offer!</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="min-h-full bg-linear-to-b from-yellow-50 to-orange-100 text-neutral-900">
	<!-- sponsor banner -->
	<div class="bg-red-600 px-4 py-2 text-center text-sm font-bold uppercase tracking-wider text-white">
		🔥 Limited-time offer — only {fmt(dealCountdown)} left! 🔥
	</div>

	<!-- sneaky note so the visitor realises this is the joke -->
	<div class="bg-neutral-900 px-4 py-1.5 text-center text-xs text-yellow-300">
		⚠️ You got AdTube'd — this is the fake advertiser page that opens when you misclick. Close it
		and get back to skipping.
	</div>

	<header class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
		<div class="text-2xl font-black tracking-tight text-red-700">
			{ad.author ?? 'Sponsor'}<span class="text-neutral-500">™</span>
		</div>
		{#if ad.date}<span class="text-sm text-neutral-500">Since {ad.date}</span>{/if}
	</header>

	<!-- hero -->
	<section class="mx-auto grid max-w-5xl gap-8 px-6 pb-12 md:grid-cols-2">
		<div class="overflow-hidden rounded-xl bg-neutral-900 shadow-2xl">
			<video
				class="h-[360px] w-full object-cover"
				src={ad.src}
				autoplay
				loop
				muted
				playsinline
			/>
		</div>
		<div class="flex flex-col justify-center">
			<h1 class="text-3xl font-black leading-tight md:text-4xl">
				Introducing the {ad.author ?? 'Amazing'} Experience
			</h1>
			<p class="mt-4 text-neutral-700">
				Doctors hate it. Your friends already have three. It slices, it dices, it skips ads
				for you — allegedly. You deserve the best, and the best is one click away.
			</p>

			<div class="mt-6 flex items-end gap-3">
				<span class="text-4xl font-black text-red-700">$19.99</span>
				<span class="mb-1 text-lg text-neutral-400 line-through">$199.99</span>
				<span class="mb-1 rounded bg-red-700 px-2 py-0.5 text-xs font-bold text-white"
					>SAVE 90%</span
				>
			</div>

			<button
				class="mt-6 rounded-full bg-linear-to-b from-yellow-400 to-yellow-500 px-8 py-4 text-xl font-black uppercase shadow-lg ring-2 ring-yellow-600 transition hover:scale-[1.02] hover:ring-yellow-700"
				onclick={rollAd}
			>
				Buy Now ⟶
			</button>
			<p class="mt-2 text-xs text-neutral-500">* This button does not actually do anything.</p>
		</div>
	</section>

	<!-- fake testimonials -->
	<section class="mx-auto max-w-5xl px-6 pb-12">
		<h2 class="mb-6 text-center text-2xl font-bold">What our customers say</h2>
		<div class="grid gap-6 sm:grid-cols-3">
			{#each ['“Changed my life!” — Karen', '“I cannot believe this is legal.” — Bob', '“My whole family bought one.” — A. Real Human'] as quote}
				<figure class="rounded-xl bg-white p-6 shadow-md">
					<blockquote class="text-lg font-semibold text-neutral-800">{quote}</blockquote>
					<div class="mt-3 text-yellow-500">★★★★★</div>
				</figure>
			{/each}
		</div>
	</section>

	<!-- footer -->
	<footer class="mx-auto max-w-5xl px-6 pb-12 text-center text-sm text-neutral-500">
		<p class="mb-2">
			You arrived here via a{from === 'early' ? 'n early' : ' missed'} click. {reasonText[
				(from as 'early' | 'missed') ?? 'missed'
			]}
		</p>
		{#if ad.attributionHtml}
			<p class="text-xs">{@html ad.attributionHtml}</p>
		{/if}
		<p class="mt-2">This is a parody mock page. No real product is being sold.</p>
	</footer>
</div>