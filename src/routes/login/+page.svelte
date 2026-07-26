<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import Logo from '$lib/assets/Logo.svelte';
	import {
		MAX_USERNAME_LENGTH,
		continueAsGuest,
		login,
		sanitizeUsername
	} from '$lib/user';

	let username = $state('');
	let touched = $state(false);

	const trimmed = $derived(username.trim());
	const invalid = $derived(touched && sanitizeUsername(username) === null);

	function submit(e: Event) {
		e.preventDefault();
		touched = true;
		const clean = sanitizeUsername(username);
		if (!clean) return;
		login(clean);
		username = '';
		touched = false;
		goto(resolve('/'), { replaceState: true });
	}

	function skip() {
		continueAsGuest();
		goto(resolve('/'), { replaceState: true });
	}
</script>

<svelte:head><title>Sign in · AdTube</title></svelte:head>

<div class="flex h-full flex-col items-center justify-center px-4">
	<div
		class="flex w-full max-w-[450px] flex-col items-center gap-4 rounded-2xl border border-white/20 bg-[#212121] px-10 py-12 text-center"
	>
		<a href={resolve('/')} class="flex items-center gap-3" aria-label="AdTube">
			<Logo />
			<span class="text-3xl font-semibold tracking-tight text-white">AdTube</span>
		</a>

		<div class="flex flex-col gap-1">
			<h1 class="text-2xl font-bold text-white">Sign in</h1>
			<p class="text-base text-white/60">to continue to AdTube</p>
		</div>

		<form class="flex w-full flex-col gap-1" onsubmit={submit} novalidate>
			<div class="group relative">
				<input
					id="username"
					type="text"
					autocomplete="username"
					autocapitalize="off"
					spellcheck={false}
					maxlength={MAX_USERNAME_LENGTH}
					bind:value={username}
					onblur={() => (touched = true)}
					placeholder=" "
					aria-invalid={invalid}
					class="peer w-full rounded-md border bg-[#1f1f1f] px-3.5 pt-4 pb-1.5 text-base text-white outline-none transition-colors focus:border-[#3ea6ff] aria-[invalid=true]:border-red-600 aria-[invalid=true]:focus:border-red-600 border-white/40"
				/>
				<label
					for="username"
					class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-white/50 transition-all peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-[#3ea6ff] peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs"
				>
					Username
				</label>
			</div>

			{#if invalid}
				<p class="self-start pl-1 text-xs text-red-500">Please enter a username.</p>
			{:else}
				<p class="self-start pl-1 text-xs text-white/40">
					Your score will be submitted to the leaderboard.
				</p>
			{/if}

			<button
				type="submit"
				disabled={trimmed.length === 0}
				class="mt-4 w-full rounded-full bg-[#3ea6ff] py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#5cb5ff] disabled:cursor-not-allowed disabled:opacity-50"
			>
				Next
			</button>
		</form>

		<button
			type="button"
			onclick={skip}
			class="text-sm font-medium text-[#3ea6ff] hover:underline"
		>
			Continue without an account
		</button>
		<p class="text-xs text-white/40">Your score won't be submitted to the leaderboard.</p>
	</div>
</div>