import { deleteCookie, getCookie, hasCookie, setCookie } from './cookies';

// Cookie names
export const USERNAME_COOKIE = 'adtube_username';
export const GUEST_COOKIE = 'adtube_guest';

// A username can be at most this many characters (sanitized below).
export const MAX_USERNAME_LENGTH = 20;

/**
 * Sanitize a username: trim, collapse whitespace, limit length, strip control chars.
 * Returns null when the result is empty.
 */
export function sanitizeUsername(raw: string): string | null {
	const cleaned = raw
		.replace(/[\u0000-\u001f\u007f]/g, '')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, MAX_USERNAME_LENGTH);
	return cleaned.length > 0 ? cleaned : null;
}

// Reactive identity state. Living in $state means any component that reads
// getUsername()/isGuest()/hasIdentity() in a reactive context (template,
// $derived, $effect) re-renders automatically when the identity changes.
let username = $state<string | null>(null);
let guest = $state(false);

// Initialize once at module load (browser only). SSR skips this since the
// cookies (and `document`) aren't available, and prerendering shouldn't
// depend on cookie state.
if (typeof document !== 'undefined') {
	username = getCookie(USERNAME_COOKIE);
	guest = hasCookie(GUEST_COOKIE);
}

/** The currently logged-in username, or null if none is set. */
export function getUsername(): string | null {
	return username;
}

/** True when the user chose to play as guest (no submission to leaderboard). */
export function isGuest(): boolean {
	return guest;
}

/** True when a username is set and scores may be submitted. */
export function isLoggedIn(): boolean {
	return username !== null;
}

/** True when the user should not be prompted to log in (either logged in or guest). */
export function hasIdentity(): boolean {
	return username !== null || guest;
}

/** Persist the username cookie (and clear any previous guest decision). */
export function login(value: string, days = 365): void {
	const clean = sanitizeUsername(value);
	if (!clean) return;
	setCookie(USERNAME_COOKIE, clean, days);
	deleteCookie(GUEST_COOKIE);
	username = clean;
	guest = false;
}

/**
 * Continue as guest: persist the guest decision so the user is not reprompted
 * on every reload *and* remove any previously chosen username.
 */
export function continueAsGuest(days = 365): void {
	setCookie(GUEST_COOKIE, 'true', days);
	deleteCookie(USERNAME_COOKIE);
	username = null;
	guest = true;
}

/** Remove username and guest cookies entirely (sign out / reset identity). */
export function logout(): void {
	deleteCookie(USERNAME_COOKIE);
	deleteCookie(GUEST_COOKIE);
	username = null;
	guest = false;
}