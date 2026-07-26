// Minimal client-side cookie helpers for a fully static (prerendered) app.

export function getCookie(name: string): string | null {
	if (typeof document === 'undefined') return null;
	const escaped = name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1');
	const match = document.cookie.match(new RegExp('(?:^|; )' + escaped + '=([^;]*)'));
	return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(name: string, value: string, days: number): void {
	if (typeof document === 'undefined') return;
	const expires = new Date(Date.now() + days * 86_400_000).toUTCString();
	document.cookie =
		encodeURIComponent(name) +
		'=' +
		encodeURIComponent(value) +
		'; expires=' +
		expires +
		'; path=/; SameSite=Lax';
}

export function hasCookie(name: string): boolean {
	return getCookie(name) !== null;
}

export function deleteCookie(name: string): void {
	if (typeof document === 'undefined') return;
	document.cookie =
		encodeURIComponent(name) +
		'=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax';
}