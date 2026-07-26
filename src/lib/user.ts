import { getCookie, hasCookie, setCookie } from './cookies';

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

/** The currently logged-in username, or null if none is set. */
export function getUsername(): string | null {
	return getCookie(USERNAME_COOKIE);
}

/** True when the user chose to play as guest (no submission to leaderboard). */
export function isGuest(): boolean {
	return hasCookie(GUEST_COOKIE);
}

/** True when a username is set and scores may be submitted. */
export function isLoggedIn(): boolean {
	return hasCookie(USERNAME_COOKIE);
}

/** True when the user should not be prompted to log in (either logged in or guest). */
export function hasIdentity(): boolean {
	return isLoggedIn() || isGuest();
}

/** Persist the username cookie. */
export function login(username: string, days = 365): void {
	const clean = sanitizeUsername(username);
	if (!clean) return;
	setCookie(USERNAME_COOKIE, clean, days);
}

/** Persist the guest decision so the user is not reprompted on every reload. */
export function continueAsGuest(days = 365): void {
	setCookie(GUEST_COOKIE, 'true', days);
}