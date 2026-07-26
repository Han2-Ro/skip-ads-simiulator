<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import Logo from '$lib/assets/Logo.svelte';
	import { getUsername, hasIdentity, isGuest } from '$lib/user.svelte';
	import HamburgerIcon from '$lib/assets/HamburgerIcon.svelte';
	import HomeIcon from '$lib/assets/HomeIcon.svelte';
	import GlobeIcon from '$lib/assets/GlobeIcon.svelte';
	import LeaderboardIcon from '$lib/assets/LeaderboardIcon.svelte';
	import AccountIcon from '$lib/assets/AccountIcon.svelte';

	let menuExtended: boolean = $state(false);
	let { children } = $props();

	const loginPath = resolve('/login');

	// Redirect to the login page unless the user already has an identity
	// (logged in *or* chose to continue as guest). Runs client-side only,
	// so prerendering at build time is unaffected.
	$effect(() => {
		void page.url.pathname; // track navigation
		if (!browser) return;
		if (hasIdentity()) return;
		if (page.url.pathname === loginPath) return;
		goto(loginPath, { replaceState: true });
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex h-screen w-screen flex-col bg-[#0f0f0f] py-4 text-white">
	<div class="flex gap-4">
		<button onclick={() => menuExtended = !menuExtended} class="mx-4 rounded-full p-2 hover:bg-white/20">
			<HamburgerIcon />
		</button>
		<a href={resolve('/')} class="flex gap-4">
			<Logo />
			<h1 class=" text-2xl">AdTube</h1>
		</a>
	</div>
	<div class="flex flex-1">
		<nav class="flex items-center pt-4 flex-col">
			<a
				href={resolve('/')}
				class={`flex flex-col items-center gap-2 rounded-xl p-4 w-full hover:bg-white/20 ${menuExtended ? 'flex-row gap-6 bg-white/10' : 'flex-col'}`}
			>
				<div class="w-[24px]"><HomeIcon /></div>
				<p class={`${menuExtended ? 'text-base' : 'text-xs'}`}>Home</p></a
			>
			<a
				href={resolve('/leaderboard')}
				class={`flex flex-col items-center gap-2 rounded-xl p-4 w-full hover:bg-white/10 ${menuExtended ? 'flex-row gap-6' : 'flex-col'}`}
			>
				<div class="w-[24px]"><LeaderboardIcon /></div>
				<p class={`${menuExtended ? 'text-base' : 'text-xs'}`}>Leaderboard</p></a
			>
			<a
				href={resolve('/login')}
				class={`flex flex-col items-center gap-2 rounded-xl p-4 w-full hover:bg-white/10 ${menuExtended ? 'flex-row gap-6' : 'flex-col'}`}
			>
				<div class="w-[24px]"><AccountIcon /></div>
				<p class={`${menuExtended ? 'text-base' : 'text-xs'}`}>{getUsername() ?? (isGuest() ? 'Guest' : 'Sign In')}</p></a
			>
			<a
				href={resolve('/credits')}
				class={`flex flex-col items-center gap-2 rounded-xl p-4 w-full hover:bg-white/10 ${menuExtended ? 'flex-row gap-6' : 'flex-col'}`}
			>
				<div class="w-[24px]"><GlobeIcon /></div>
				<p class={`${menuExtended ? 'text-base' : 'text-xs'}`}>Credits</p></a
			>
		</nav>
		<main class="flex-1">
			{@render children()}
		</main>
	</div>
</div>
