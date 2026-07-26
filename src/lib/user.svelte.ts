import { deleteCookie, getCookie, setCookie } from './cookies';

// Cookie names
export const USERNAME_COOKIE = 'adtube_username';
export const GUEST_COOKIE = 'adtube_guest';

// localStorage key prefix used *in addition to* cookies. On the real site we
// rely on cookies; but inside sandboxed / cross-origin iframes (such as the
// itch.io embed) `document.cookie` may be blocked while `localStorage` is still
// available (per top-level-site partition). Mirroring the identity there lets
// the player stay logged in across reloads in those contexts. Every access is
// guarded so an opaque-origin sandbox never crashes hydration in any browser.
const LS_PREFIX = 'adtube_';

function lsGet(name: string): string | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		return localStorage.getItem(LS_PREFIX + name);
	} catch {
		return null;
	}
}

function lsSet(name: string, value: string): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(LS_PREFIX + name, value);
	} catch {
		/* ignore sandboxed-iframe write failures */
	}
}

function lsDel(name: string): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.removeItem(LS_PREFIX + name);
	} catch {
		/* ignore sandboxed-iframe delete failures */
	}
}

/** Read identity state, preferring cookies and falling back to localStorage. */
function readStored(name: string): string | null {
	let value: string | null = null;
	try {
		value = getCookie(name);
	} catch {
		value = null;
	}
	if (value === null) value = lsGet(name);
	return value;
}

/** Persist identity state to both cookies (for the real site) and localStorage. */
function writeStored(name: string, value: string): void {
	setCookie(name, value, 365);
	lsSet(name, value);
}

/** Remove identity state from both backing stores. */
function clearStored(name: string): void {
	deleteCookie(name);
	lsDel(name);
}

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
// depend on cookie state. The whole block is guarded so a storage access
// failure (e.g. document.cookie throwing in a sandboxed opaque-origin iframe)
// can never crash module evaluation and break SvelteKit hydration.
if (typeof document !== 'undefined') {
	try {
		username = readStored(USERNAME_COOKIE);
		guest = readStored(GUEST_COOKIE) !== null;
	} catch {
		username = null;
		guest = false;
	}
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
	writeStored(USERNAME_COOKIE, clean);
	clearStored(GUEST_COOKIE);
	username = clean;
	guest = false;
}

/**
 * Continue as guest: persist the guest decision so the user is not reprompted
 * on every reload *and* remove any previously chosen username.
 */
export function continueAsGuest(days = 365): void {
	writeStored(GUEST_COOKIE, 'true');
	clearStored(USERNAME_COOKIE);
	username = null;
	guest = true;
}

/** Remove username and guest cookies entirely (sign out / reset identity). */
export function logout(): void {
	clearStored(USERNAME_COOKIE);
	clearStored(GUEST_COOKIE);
	username = null;
	guest = false;
}