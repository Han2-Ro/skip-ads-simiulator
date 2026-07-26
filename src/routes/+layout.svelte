<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import Logo from '$lib/assets/logo.svelte';
	import { hasIdentity } from '$lib/user';

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

<div class="flex h-screen w-screen flex-col bg-[#0f0f0f] p-4 text-white">
	<a href={resolve("/")} class="flex gap-4">
		<Logo />
		<h1 class=" text-2xl">AdTube</h1>
	</a>
	<main class="flex-1">
		{@render children()}
	</main>

	<footer>
		<a href={resolve('/credits')}>Credits</a>
	</footer>
</div>
