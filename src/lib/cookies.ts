// Minimal client-side cookie helpers for a fully static (prerendered) app.

export function getCookie(name: string): string | null {
	if (typeof document === 'undefined') return null;
	try {
		const escaped = name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1');
		const match = document.cookie.match(new RegExp('(?:^|; )' + escaped + '=([^;]*)'));
		return match ? decodeURIComponent(match[1]) : null;
	} catch {
		// Accessing document.cookie can throw a SecurityError when the page runs
		// inside a sandboxed cross-origin <iframe> whose sandbox lacks the
		// `allow-same-origin` flag (e.g. the itch.io HTML embed). Chrome throws;
		// Firefox returns "". Treat both as "no cookie" so SvelteKit hydration
		// never crashes and leaves the page unresponsive.
		return null;
	}
}

export function setCookie(name: string, value: string, days: number): void {
	if (typeof document === 'undefined') return;
	try {
		const expires = new Date(Date.now() + days * 86_400_000).toUTCString();
		document.cookie =
			encodeURIComponent(name) +
			'=' +
			encodeURIComponent(value) +
			'; expires=' +
			expires +
			'; path=/; SameSite=Lax';
	} catch {
		// Setting cookies may be blocked in sandboxed/cross-origin iframes —
		// fail silently; the localStorage fallback in user.svelte.ts covers us.
	}
}

export function hasCookie(name: string): boolean {
	return getCookie(name) !== null;
}

export function deleteCookie(name: string): void {
	if (typeof document === 'undefined') return;
	try {
		document.cookie =
			encodeURIComponent(name) +
			'=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax';
	} catch {
		// Ignore sandboxed-iframe write failures.
	}
}