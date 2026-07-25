#!/usr/bin/env node
/**
 * Download videos from a list of Wikimedia Commons "File:" URLs, transcode them
 * to 720p VP9/Opus .webm (only when not already ≤720p webm), and regenerate
 * src/lib/ads.ts with the proper imports + metadata pulled from the Commons API.
 *
 * Usage:
 *   pnpm prepare-ads              # skip files already present in assets/ads
 *   pnpm prepare-ads -- --force   # re-download + re-convert everything
 *
 * Input : src/lib/wikimedia-links.txt  (one commons page URL per line)
 * Output: src/lib/assets/ads/<name>.webm + regenerated src/lib/ads.ts
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const LINKS_FILE = resolve(ROOT, 'src/lib/wikimedia-links.txt');
const ADS_DIR = resolve(ROOT, 'src/lib/assets/ads');
const ADS_TS = resolve(ROOT, 'src/lib/ads.ts');
const TMP_DIR = resolve(ROOT, 'node_modules/.cache/wikimedia-ads');

const FORCE = process.argv.includes('--force');
const UA =
	'skip-ads-svelte/1.0 (https://github.com/; prepare-wikimedia-ads.ts) node';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const API = 'https://commons.wikimedia.org/w/api.php';

type ExtMeta = { value?: string } & Record<string, unknown>;
type ImageInfo = {
	url: string;
	descriptionurl: string;
	mime?: string;
	width?: number;
	height?: number;
	extmetadata?: Record<string, ExtMeta>;
};
type CommonsPage = {
	pageid: number;
	title: string;
	imageinfo?: ImageInfo[];
	missing?: '' | boolean;
};

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function apiQuery(titles: string): Promise<any> {
	const u =
		`${API}?action=query&format=json&titles=${encodeURIComponent(titles)}` +
		`&prop=imageinfo&iiprop=url|mime|size|extmetadata&iiurlwidth=1`;
	return fetchWithUA(u).then((r) => r.json());
}

async function fetchPage(fileTitle: string): Promise<CommonsPage> {
	// Commons may paginate non-redirected revisions, but core imageinfo is present
	// on the first response for all our files.
	const data = await apiQuery(fileTitle);
	const pages: CommonsPage[] = Object.values(data.query.pages);
	return pages[0];
}

async function fetchWithUA(url: string, init?: RequestInit): Promise<Response> {
	return fetch(url, { ...init, headers: { 'User-Agent': UA, ...(init?.headers || {}) } });
}

async function download(url: string, dest: string): Promise<void> {
	let lastErr: unknown;
	for (let attempt = 1; attempt <= 5; attempt++) {
		const res = await fetchWithUA(url);
		if (res.ok && res.body) {
			const ab = await res.arrayBuffer();
			writeFileSync(dest, Buffer.from(ab));
			if (attempt > 1) console.log(`     (downloaded on attempt ${attempt})`);
			return;
		}
		lastErr = new Error(`download failed (${res.status}): ${url}`);
		if (res.status === 429 || res.status >= 500) {
			const wait = 2000 * attempt;
			console.log(`     rate-limited (${res.status}), retrying in ${wait}ms…`);
			await sleep(wait);
			continue;
		}
		break;
	}
	throw lastErr;
}

function ffprobe(file: string): { width: number; height: number; isWebm: boolean } {
	const v = ffprobeVideo(file);
	if (!v) throw new Error(`ffprobe failed for ${file}`);
	return {
		width: Number(v.width) || 0,
		height: Number(v.height) || 0,
		isWebm: (v.codec_name || '').toLowerCase() === 'vp9',
	};
}

/** Returns the first video stream, or null if the file cannot be probed (e.g. corrupt). */
function ffprobeVideo(file: string): { width?: number; height?: number; codec_name?: string } | null {
	const r = spawnSync(
		'ffprobe',
		['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,codec_name', '-of', 'json', file],
		{ encoding: 'utf8' },
	);
	if (r.status !== 0 || !r.stdout) return null;
	try {
		const streams = JSON.parse(r.stdout).streams || [];
		return streams[0] || null;
	} catch {
		return null;
	}
}

/** Transcode to VP9/Opus webm, scaling so height never exceeds 720 (no upscale). */
function transcode(src: string, dst: string): void {
	const args = [
		'-y',
		'-i', src,
		'-vf', "scale=-2:'min(720,ih)'",
		'-c:v', 'libvpx-vp9',
		'-b:v', '0',
		'-crf', '36',
		'-deadline', 'good',
		'-cpu-used', '4',
		'-c:a', 'libopus',
		'-b:a', '96k',
		'-map', '0:v:0',
		'-map', '0:a?',
		'-dn',
		dst,
	];
	const r = spawnSync('ffmpeg', args, { encoding: 'utf8' });
	if (r.status !== 0) throw new Error(`transcode failed for ${src}:\n${r.stderr}`);
}

// ---------------------------------------------------------------------------
// metadata helpers
// ---------------------------------------------------------------------------

function stripHtml(s: string | undefined): string {
	if (!s) return '';
	return s
		.replace(/<span[^>]*display:\s*none[^>]*>[\s\S]*?<\/span>/gi, '')
		.replace(/<style[\s\S]*?<\/style>/gi, '')
		.replace(/<[^>]*>/g, '')
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/\s+/g, ' ')
		.trim();
}

/** Year from a Commons DateTimeOriginal value if one is present. */
function parseYear(em?: ExtMeta): number | undefined {
	if (!em?.value) return undefined;
	const m = em.value.match(/\b(\d{4})\b/);
	return m ? Number(m[1]) : undefined;
}

/** Trim the author string from the API; keep it as-is (including "Unknown author"). */
function cleanAuthor(raw: string): string | undefined {
	if (!raw) return undefined;
	const a = raw.trim();
	return a || undefined;
}

type AdMeta = {
	author?: string;
	date?: number;
	link?: string;
	attributionHtml?: string;
};

function buildMeta(page: CommonsPage): AdMeta | undefined {
	const ii = page.imageinfo?.[0];
	if (!ii) return undefined;
	const em = ii.extmetadata || {};

	const attributionPlain = stripHtml(em.Attribution?.value);
	const artistPlain = stripHtml(em.Artist?.value);
	const author = cleanAuthor(attributionPlain || artistPlain);
	const date = parseYear(em.DateTimeOriginal);
	const link = ii.descriptionurl;
	const licenseShort = stripHtml(em.LicenseShortName?.value) || undefined;
	const licenseUrl = em.LicenseUrl?.value || undefined;

	// Attribution HTML — standard Wikimedia credit format, matching the style
	// already present in ads.ts. Built from clean API fields, not parsed.
	let attributionHtml: string | undefined;
	if (author && licenseShort) {
		const authorTag = `<a href="${link}">${author}</a>`;
		const licenseTag = licenseUrl
			? `<a href="${licenseUrl}">${licenseShort}</a>`
			: licenseShort;
		attributionHtml = `${authorTag}, ${licenseTag}, via Wikimedia Commons`;
	}

	const meta: AdMeta = {};
	if (author) meta.author = author;
	if (date) meta.date = date;
	if (link) meta.link = link;
	if (attributionHtml) meta.attributionHtml = attributionHtml;
	return meta;
}

// ---------------------------------------------------------------------------
// filename handling
// ---------------------------------------------------------------------------

/** File: title -> safe "<name>.webm" filename. */
function targetWebmName(fileTitle: string): string {
	// fileTitle is like "File:Great Shakes commercial (c. 1966).webm"
	const name = fileTitle.replace(/^File:/i, '');
	const base = name.replace(/\.(webm|ogv|ogg|mp4|mov|m4v|avi|mkv)$/i, '');
	return (
		base
			.replace(/\s+/g, '_')
			.replace(/["'?:*<>|]/g, '')
			.replace(/_+/g, '_')
			.replace(/^_+|_+$/g, '') + '.webm'
	);
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
	mkdirSync(ADS_DIR, { recursive: true });
	if (FORCE) rmSync(TMP_DIR, { recursive: true, force: true });
	mkdirSync(TMP_DIR, { recursive: true });

	const links = readFileSync(LINKS_FILE, 'utf8')
		.split('\n')
		.map((l) => l.trim())
		.filter((l) => l && !l.startsWith('#'));

	console.log(`Found ${links.length} Wikimedia links.\n`);

	type Entry = { importName: string; file: string; meta: AdMeta };
	const entries: Entry[] = [];

	for (let i = 0; i < links.length; i++) {
		const link = links[i];
		const parsed = new URL(link);
		const m = parsed.pathname.match(/\/File:(.+)$/i);
		if (!m) {
			console.warn(`${i + 1}. SKIP (not a File: URL): ${link}`);
			continue;
		}
		const fileTitle = 'File:' + decodeURIComponent(m[1]);
		const idx = String(i + 1).padStart(2, '0');
		console.log(`${i + 1}. ${fileTitle}`);

		const page = await fetchPage(fileTitle);
		if (page.missing || !page.imageinfo?.[0]) {
			console.warn(`   ! file not found on Commons, skipping`);
			continue;
		}
		const ii = page.imageinfo[0];
		const outName = targetWebmName(page.title);
		const outPath = resolve(ADS_DIR, outName);

		let downloaded: string | undefined;
		const alreadyExists = existsSync(outPath);
		const presentValid = alreadyExists && ffprobeVideo(outPath) != null;
		if (FORCE || !presentValid) {
			if (alreadyExists && !presentValid) console.warn(`   ! existing ${outName} appears corrupt; re-downloading`);
			console.log(`   download → ${outName}`);
			const rawExt = (ii.url.match(/\.(\w+)(\?|$)/)?.[1] || 'bin').toLowerCase();
			const rawPath = resolve(TMP_DIR, `${i}.orig.${rawExt}`);
			await download(ii.url, rawPath);
			downloaded = rawPath;
		} else {
			console.log(`   already present: ${outName}`);
		}

		if (downloaded) {
			await sleep(500);
		const probe = ffprobe(downloaded);
			if (probe.isWebm && probe.height > 0 && probe.height <= 720) {
				// already webm ≤720h: just move into place
				writeFileSync(outPath, readFileSync(downloaded));
				console.log(`   copied (webm, ${probe.width}x${probe.height})`);
			} else {
				console.log(`   transcode (${probe.width}x${probe.height}, webm=${probe.isWebm}) → ${outName}`);
				transcode(downloaded, outPath);
				if (!ffprobeVideo(outPath)) {
					rmSync(outPath, { force: true });
					throw new Error(`transcode produced invalid output for ${outName}`);
				}
			}
		}

		const meta = buildMeta(page) || {};
		entries.push({ importName: `A${idx}`, file: `./assets/ads/${outName}`, meta });
	}

	// Sort imports to keep stable ordering (alphabetical by filename, ascending).
	// But mirror link-file order so re-runs produce minimal diffs.
	entries.sort((a, b) => a.file.localeCompare(b.file));

	writeFileSync(ADS_TS, renderAdsTs(entries));
	console.log(`\nWrote ${ADS_TS} (${entries.length} entries).`);
}

function renderAdsTs(entries: { importName: string; file: string; meta: AdMeta }[]): string {
	const imports = entries
		.map((e) => `import ${e.importName} from '${e.file}';`)
		.join('\n');
	const rows = entries.map((e) => {
		const parts: string[] = [`src: ${e.importName}`];
		const m = e.meta;
		if (m.author !== undefined) parts.push(`author: ${JSON.stringify(m.author)}`);
		if (m.date !== undefined) parts.push(`date: ${m.date}`);
		if (m.link !== undefined) parts.push(`link: ${JSON.stringify(m.link)}`);
		if (m.attributionHtml !== undefined) parts.push(`attributionHtml: ${JSON.stringify(m.attributionHtml)}`);
		return `\t{ ${parts.join(', ')} }`;
	});
	return (
		`// AUTO-GENERATED by scripts/prepare-wikimedia-ads.ts — do not edit by hand.\n` +
		`// Source: src/lib/wikimedia-links.txt\n` +
		`${imports}\n\n` +
		`type Ad = { src: string; author?: string; date?: number; link?: string; attributionHtml?: string };\n\n` +
		`export const ads: Ad[] = [\n${rows.join(',\n')}\n];\n`
	);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});