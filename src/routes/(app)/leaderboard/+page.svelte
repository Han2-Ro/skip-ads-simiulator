<script lang="ts">
	import { browser } from '$app/environment';
	import { getLeaderboard, type LeaderboardEntry } from '$lib/pocketbase';
	import { getUsername } from '$lib/user.svelte';

	type Status = 'loading' | 'loaded' | 'error';

	let entries = $state<LeaderboardEntry[]>([]);
	let status = $state<Status>('loading');
	let errorMsg = $state('');

	const currentName = $derived(getUsername());

	async function load() {
		status = 'loading';
		try {
			entries = await getLeaderboard(50, 200);
			status = 'loaded';
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
			status = 'error';
		}
	}

	// Fetch on mount (client only — safe for prerendering).
	$effect(() => {
		if (!browser) return;
		void load();
	});

	// Refresh when the tab regains focus, so a freshly submitted score shows up.
	function onFocus() {
		if (document.visibilityState === 'visible') void load();
	}

	function medal(i: number): string {
		return i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
	}
</script>

<svelte:head><title>Leaderboard · AdTube</title></svelte:head>

<svelte:window onfocus={onFocus} />

<div class="flex h-full flex-col items-center px-4 pt-8">
	<div class="flex w-full max-w-xl flex-col gap-4">
		<div class="flex items-center justify-between">
			<h1 class="text-3xl font-bold text-white">Leaderboard</h1>
			<button
				onclick={() => void load()}
				disabled={status === 'loading'}
				class="rounded-full border border-white/20 px-4 py-1.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 disabled:opacity-50"
			>
				{status === 'loading' ? 'Loading…' : 'Refresh'}
			</button>
		</div>

		{#if status === 'loading'}
			<p class="text-white/50">Loading scores…</p>
		{:else if status === 'error'}
			<p class="text-red-500">Couldn't load the leaderboard.</p>
			<p class="text-xs text-white/40">{errorMsg}</p>
		{:else if entries.length === 0}
			<p class="text-white/50">No scores yet. Be the first!</p>
		{:else}
			<ol class="flex flex-col gap-1">
				{#each entries as entry, i (entry.Name)}
					<li
						class={`flex items-center gap-4 rounded-lg px-4 py-2.5 ${
							entry.Name === currentName
								? 'bg-[#3ea6ff]/15 ring-1 ring-[#3ea6ff]/40'
								: 'bg-white/5'
						}`}
					>
						<span class="w-10 text-center text-lg font-bold text-white/70">{medal(i)}</span>
						<span class="flex-1 truncate font-medium text-white">{entry.Name}</span>
						<span class="font-mono text-lg font-bold text-[#3ea6ff]"
							>{entry.score.toLocaleString()}</span
						>
					</li>
				{/each}
			</ol>
		{/if}
	</div>
</div>