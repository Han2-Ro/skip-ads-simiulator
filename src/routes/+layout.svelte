<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { resolve } from '$app/paths';
	import Logo from '$lib/assets/logo.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex h-screen w-screen flex-col bg-neutral-900 p-2 text-white">
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
