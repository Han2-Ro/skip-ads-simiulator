import PocketBase from 'pocketbase';
import { getUsername } from './user.svelte';

// Backend for the leaderboard. The site is fully static (prerendered), so all
// calls are made client-side from the browser.
export const POCKETBASE_URL = 'https://pocketbase-bosb82mczzv2i0euaoumypmz.han2.dev';
const COLLECTION = 'Scores';

// A single shared client. PocketBase is SSR-safe — it only reaches the network
// when a method is actually called, so importing this module during prerender
// (or SSR) is fine.
let pb: PocketBase | null = null;
function client(): PocketBase {
	if (!pb) pb = new PocketBase(POCKETBASE_URL);
	return pb;
}

export type ScoreRecord = {
	id: string;
	Name: string;
	score: number;
	created: string;
};

export type LeaderboardEntry = {
	Name: string;
	score: number;
	created: string;
};

/**
 * Submit the final score for the currently logged-in user.
 * Returns the created record on success, or null on failure / when the user is a
 * guest (no username set → never submit).
 */
export async function submitScore(score: number): Promise<ScoreRecord | null> {
	const name = getUsername();
	if (name === null) return null; // guest — score must not be submitted
	try {
		const record = await client().collection(COLLECTION).create({
			Name: name,
			score: Math.max(0, Math.round(score))
		});
		return record as unknown as ScoreRecord;
	} catch (err) {
		console.error('[leaderboard] Failed to submit score:', err);
		return null;
	}
}

/**
 * Fetch the top leaderboard entries, deduplicated per username (only the
 * highest score per Name is kept). Records come back sorted by `-score`, so the
 * first time we see a given Name is already its best — we simply drop later
 * occurrences.
 *
 * @param uniqueCount how many distinct usernames to return (default 50)
 * @param fetchSize   how many raw records to pull before deduping (default 200)
 */
export async function getLeaderboard(
	uniqueCount = 50,
	fetchSize = 200
): Promise<LeaderboardEntry[]> {
	try {
		const result = await client().collection(COLLECTION).getList(1, fetchSize, {
			sort: '-score'
		});
		const seen = new Set<string>();
		const entries: LeaderboardEntry[] = [];
		for (const item of result.items as unknown as ScoreRecord[]) {
			// skip blank/garbage names that slipped through (no required constraint)
			const name = item.Name?.trim();
			if (!name) continue;
			if (seen.has(name)) continue; // already kept this user's best
			seen.add(name);
			entries.push({ Name: name, score: item.score, created: item.created });
			if (entries.length >= uniqueCount) break;
		}
		return entries;
	} catch (err) {
		console.error('[leaderboard] Failed to load leaderboard:', err);
		throw err;
	}
}