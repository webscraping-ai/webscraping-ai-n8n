/* eslint-disable no-console, @n8n/community-nodes/no-restricted-globals -- dev-only script, never shipped or scanned */
/**
 * Hand-run smoke test against the live API. Not part of the test suite and
 * not shipped (package.json `files` is just `dist`, and tsconfig.json only
 * compiles nodes/ and credentials/). Uses real credits (see
 * https://webscraping.ai/docs for pricing): page operations run with js=false
 * on the datacenter proxy to keep the cost down, and SERP is billed per
 * results page returned (the plain call 1 page, the Austin call 2). Account
 * and Search Locations are free; the any-site /data call on
 * https://example.com/ is not charged when learning its structure outlasts
 * the request (503), none is found (422) or extracting the data or loading
 * the page runs out of time (a 500 timeout), and charged if it returns data.
 *
 * Results are checked, not just status codes: serp needs non-empty
 * organic_results and search_parameters.q matching the query (the Austin call
 * also search_parameters.location_used containing Austin), serpLocations a
 * non-empty list whose first canonical_name contains Austin, data needs
 * parse_status ok, provider youtube and a non-empty data.title (a page on a
 * site with a dedicated parser), data on https://example.com/ (any site) must
 * be a success envelope (request_parameters present), a 503 with error_code
 * structure_processing, a 422 with error_code structure_unavailable, or a 500
 * with error_code timeout,
 * selectedMultiple
 * needs at least one non-empty inner array, aiFields a non-empty object, the
 * rest a non-empty body. Printed lines never contain the API key.
 *
 * Usage:
 *   WEBSCRAPING_AI_API_KEY=... npm run smoke
 *   WEBSCRAPING_AI_API_URL=http://localhost:3000 ...   (optional; needs a scheme)
 *
 * Each operation's request comes from the real `buildRequest` helper. The
 * script adds `api_key` to `qs` the way the credential's generic auth does,
 * then encodes `qs` the way n8n's httpRequest helper does: n8n-core sets
 * axios's default paramsSerializer to `qs.stringify(params, { arrayFormat:
 * 'indices' })` (request-helpers/axios-config.js), but honours a per-request
 * `arrayFormat`, and buildRequest sets `arrayFormat: 'repeat'`. On the wire that looks like:
 *   selectors=h1&selectors=p                 (arrays -> repeated keys)
 *   fields%5Btitle%5D=Page%20title           (objects -> bracketed keys)
 *   headers%5BX-Foo%5D=bar
 */

import { INode } from 'n8n-workflow';
import { buildRequest, GetParam } from '../nodes/WebScrapingAi/buildRequest';

const PROD_BASE_URL = 'https://api.webscraping.ai';

// Mirrors qs.stringify(obj, { arrayFormat }) with qs's defaults
// (RFC 3986 encoding of keys and values; undefined skipped; null -> "key=";
// empty arrays/objects skipped; booleans/numbers stringified).
function qsEncode(value: string): string {
	return encodeURIComponent(value).replace(
		/[!'()*]/g,
		(c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
	);
}

function qsStringify(
	params: Record<string, unknown>,
	arrayFormat: 'indices' | 'repeat' = 'indices',
): string {
	const parts: string[] = [];
	const walk = (key: string, value: unknown): void => {
		if (value === undefined) return;
		if (value === null) {
			parts.push(`${qsEncode(key)}=`);
		} else if (Array.isArray(value)) {
			value.forEach((v, i) => walk(arrayFormat === 'repeat' ? key : `${key}[${i}]`, v));
		} else if (value instanceof Date) {
			parts.push(`${qsEncode(key)}=${qsEncode(value.toISOString())}`);
		} else if (typeof value === 'object') {
			for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
				walk(`${key}[${k}]`, v);
			}
		} else {
			parts.push(`${qsEncode(key)}=${qsEncode(String(value))}`);
		}
	};
	for (const [k, v] of Object.entries(params)) walk(k, v);
	return parts.join('&');
}

const node: INode = {
	id: 'smoke',
	name: 'WebScraping.AI',
	type: 'n8n-nodes-webscraping-ai.webScrapingAi',
	typeVersion: 1,
	position: [0, 0],
	parameters: {},
};

const target = 'https://example.com';
const serpQuery = 'coffee machines';
const cheap = { js: false, proxy: 'datacenter' };
const dataUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

// Parameter values as n8n would hand them to getNodeParameter: what the user
// typed plus the node's UI defaults for the other visible fields.
// [label, operation, params, check ('anySite' accepts 200/503/422/500, see
// checkAnySite; default: HTTP 2xx + checkBody)]
const cases: Array<[string, string, Record<string, unknown>, 'anySite'?]> = [
	[
		'aiQuestion',
		'aiQuestion',
		{
			url: target,
			question: 'What is this page about? Answer in one sentence.',
			format: 'json',
			additionalOptions: cheap,
		},
	],
	[
		'aiFields',
		'aiFields',
		{
			url: target,
			fields: '{"title":"Page title","description":"Short description"}',
			additionalOptions: cheap,
		},
	],
	[
		'html',
		'html',
		{ url: target, format: 'json', return_script_result: false, additionalOptions: cheap },
	],
	[
		'text',
		'text',
		{ url: target, text_format: 'plain', return_links: false, additionalOptions: cheap },
	],
	[
		'selected',
		'selected',
		{ url: target, selector: 'p', format: 'json', additionalOptions: cheap },
	],
	[
		'selectedMultiple',
		'selectedMultiple',
		{ url: target, selectors: '["h1", "p"]', additionalOptions: cheap },
	],
	['serp', 'serp', { q: serpQuery, serpOptions: {} }],
	['serp:location', 'serp', { q: serpQuery, serpOptions: { location: 'Austin, TX', pages: 2 } }],
	['serpLocations', 'serpLocations', { q: 'austin', limit: 3 }],
	[
		'data',
		'data',
		{ url: dataUrl, country: '', transcript: false, transcript_language: '', extraParams: {} },
	],
	['data:any-site', 'data', { url: `${target}/` }, 'anySite'],
	['account', 'account', {}],
];

function preview(body: string): string {
	return body.slice(0, 120).replace(/\s+/g, ' ');
}

/** Strip the API key (raw or URL-encoded) and any `api_key=...` from text. */
function redact(text: string, apiKey: string): string {
	let out = text.replace(/(api_key=)[^&\s"'<>]*/gi, '$1[REDACTED]');
	for (const form of new Set([apiKey, encodeURIComponent(apiKey), qsEncode(apiKey)])) {
		out = out.split(form).join('[REDACTED]');
	}
	return out;
}

/** Return a problem description if a 2xx body is the wrong shape, else undefined. */
function checkBody(label: string, operation: string, body: string): string | undefined {
	if (body.trim().length === 0) return 'empty body';
	switch (operation) {
		case 'serp': {
			const r = JSON.parse(body) as {
				organic_results?: unknown[];
				search_parameters?: { q?: unknown; location_used?: unknown };
			};
			if (!Array.isArray(r.organic_results) || r.organic_results.length === 0) {
				return 'organic_results is empty';
			}
			if (r.search_parameters?.q !== serpQuery) {
				return `search_parameters.q is ${JSON.stringify(r.search_parameters?.q)}, expected ${JSON.stringify(serpQuery)}`;
			}
			const used = r.search_parameters?.location_used;
			if (label === 'serp:location' && !(typeof used === 'string' && used.includes('Austin'))) {
				return `search_parameters.location_used is ${JSON.stringify(used)}, expected Austin`;
			}
			return undefined;
		}
		case 'serpLocations': {
			const r = JSON.parse(body) as Array<{ canonical_name?: unknown }>;
			if (!Array.isArray(r) || r.length === 0) return 'expected a non-empty JSON array';
			const name = r[0]?.canonical_name;
			if (!(typeof name === 'string' && name.includes('Austin'))) {
				return `first canonical_name is ${JSON.stringify(name)}, expected Austin`;
			}
			return undefined;
		}
		case 'data': {
			const r = JSON.parse(body) as {
				parse_status?: unknown;
				request_parameters?: { provider?: unknown };
				data?: { title?: unknown } | null;
			};
			if (r.parse_status !== 'ok') return `parse_status is ${JSON.stringify(r.parse_status)}`;
			if (r.request_parameters?.provider !== 'youtube') {
				return `request_parameters.provider is ${JSON.stringify(r.request_parameters?.provider)}`;
			}
			if (typeof r.data?.title !== 'string' || r.data.title === '') return 'data.title is empty';
			return undefined;
		}
		case 'selectedMultiple': {
			// The API answers mis-encoded selectors with an empty [[]], not an error.
			const r = JSON.parse(body) as unknown;
			if (!Array.isArray(r)) return 'expected a JSON array';
			const anyMatch = r.some((inner) => Array.isArray(inner) && inner.length > 0);
			return anyMatch ? undefined : 'no matches (selectors not received?)';
		}
		case 'aiFields': {
			const r = JSON.parse(body) as unknown;
			if (!r || typeof r !== 'object' || Array.isArray(r) || Object.keys(r).length === 0) {
				return 'expected a non-empty JSON object';
			}
			return undefined;
		}
		default:
			return undefined;
	}
}

/**
 * /data on a page without a dedicated parser: accept a success envelope
 * (request_parameters present), a 503 when learning the page structure outlasts
 * the request (error_code structure_processing), a 422 when there's no structured data
 * (error_code structure_unavailable), or a 500 when extracting the data or loading the
 * page runs out of time (error_code timeout). Anything else is a problem.
 */
function checkAnySite(status: number, body: string): string | undefined {
	let r: { request_parameters?: unknown; error_code?: unknown };
	try {
		r = JSON.parse(body) as typeof r;
	} catch {
		return `HTTP ${status} with a non-JSON body`;
	}
	if (status === 200) {
		return r.request_parameters && typeof r.request_parameters === 'object'
			? undefined
			: 'request_parameters is missing';
	}
	if (status === 503) {
		return r.error_code === 'structure_processing'
			? undefined
			: `HTTP 503 with error_code ${JSON.stringify(r.error_code)}, expected "structure_processing"`;
	}
	if (status === 422) {
		return r.error_code === 'structure_unavailable'
			? undefined
			: `HTTP 422 with error_code ${JSON.stringify(r.error_code)}, expected "structure_unavailable"`;
	}
	if (status === 500) {
		return r.error_code === 'timeout'
			? undefined
			: `HTTP 500 with error_code ${JSON.stringify(r.error_code)}, expected "timeout"`;
	}
	return `HTTP ${status}, expected 200, 503, 422 or 500`;
}

async function main(): Promise<number> {
	const apiKey = process.env.WEBSCRAPING_AI_API_KEY;
	if (!apiKey) {
		console.error('WEBSCRAPING_AI_API_KEY env var is required');
		return 2;
	}
	const baseUrl = (process.env.WEBSCRAPING_AI_API_URL || PROD_BASE_URL).replace(/\/+$/, '');
	// Validate up front: fetch() on a scheme-less URL throws "Failed to parse
	// URL from <url>", and that URL carries api_key.
	let parsedBase: URL;
	try {
		parsedBase = new URL(baseUrl);
	} catch {
		console.error(
			`WEBSCRAPING_AI_API_URL is not a valid absolute URL (include http:// or https://): ${redact(baseUrl, apiKey)}`,
		);
		return 2;
	}
	if (parsedBase.protocol !== 'http:' && parsedBase.protocol !== 'https:') {
		console.error(`WEBSCRAPING_AI_API_URL must use http or https, got ${parsedBase.protocol}`);
		return 2;
	}

	let failures = 0;
	for (const [label, operation, params, check] of cases) {
		const name = label.padEnd(18);
		try {
			const getParam: GetParam = (paramName, fallback) =>
				paramName in params ? params[paramName] : fallback;
			const request = buildRequest(node, operation, getParam);

			// Credential generic auth: qs: { api_key: '={{$credentials.apiKey}}' }
			const qs = { ...(request.qs ?? {}), api_key: apiKey };
			const url = `${request.url.replace(PROD_BASE_URL, baseUrl)}?${qsStringify(qs, request.arrayFormat === 'repeat' ? 'repeat' : 'indices')}`;

			const response = await fetch(url, {
				method: request.method ?? 'GET',
				signal: AbortSignal.timeout(90_000),
			});
			const body = await response.text();
			let problem: string | undefined;
			if (check === 'anySite') {
				problem = checkAnySite(response.status, body);
			} else {
				problem = response.ok ? checkBody(label, operation, body) : `HTTP ${response.status}`;
			}
			if (!problem) {
				console.log(redact(`  ok   ${name}  ${preview(body)}`, apiKey));
			} else {
				failures += 1;
				console.log(redact(`  FAIL ${name}  ${problem}: ${body.slice(0, 300)}`, apiKey));
			}
		} catch (err) {
			failures += 1;
			const e = err as Error;
			console.log(
				redact(
					`  FAIL ${name}  ${e?.constructor?.name ?? 'Error'}: ${e?.message ?? String(err)}`,
					apiKey,
				),
			);
		}
	}
	return failures === 0 ? 0 : 1;
}

main().then(
	(code) => process.exit(code),
	(err) => {
		const key = process.env.WEBSCRAPING_AI_API_KEY;
		const text = err instanceof Error ? (err.stack ?? err.message) : String(err);
		console.error(key ? redact(text, key) : text);
		process.exit(1);
	},
);
