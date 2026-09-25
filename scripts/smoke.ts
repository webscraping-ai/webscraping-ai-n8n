/**
 * Hand-run smoke test against the live API. Not part of the test suite and
 * not shipped (package.json `files` is just `dist`, and tsconfig.json only
 * compiles nodes/ and credentials/). Costs ~32 credits per full sweep: page
 * operations run with js=false on the datacenter proxy; the SERP call alone
 * is 15.
 *
 * Usage:
 *   WEBSCRAPING_AI_API_KEY=... npm run smoke
 *
 * Each operation's request comes from the real `buildRequest` helper. The
 * script adds `api_key` to `qs` the way the credential's generic auth does,
 * then encodes `qs` the way n8n's httpRequest helper does: n8n-core sets
 * axios's default paramsSerializer to `qs.stringify(params, { arrayFormat:
 * 'indices' })` (request-helpers/axios-config.js), and buildRequest sets no
 * `arrayFormat` override. On the wire that looks like:
 *   selectors%5B0%5D=h1&selectors%5B1%5D=p   (arrays -> indices)
 *   fields%5Btitle%5D=Page%20title           (objects -> bracketed keys)
 *   headers%5BX-Foo%5D=bar
 */

import { INode } from 'n8n-workflow';
import { buildRequest, GetParam } from '../nodes/WebScrapingAi/buildRequest';

const PROD_BASE_URL = 'https://api.webscraping.ai';

// Mirrors qs.stringify(obj, { arrayFormat: 'indices' }) with qs's defaults
// (RFC 3986 encoding of keys and values; undefined skipped; null -> "key=";
// empty arrays/objects skipped; booleans/numbers stringified).
function qsEncode(value: string): string {
	return encodeURIComponent(value).replace(
		/[!'()*]/g,
		(c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
	);
}

function qsStringify(params: Record<string, unknown>): string {
	const parts: string[] = [];
	const walk = (key: string, value: unknown): void => {
		if (value === undefined) return;
		if (value === null) {
			parts.push(`${qsEncode(key)}=`);
		} else if (Array.isArray(value)) {
			value.forEach((v, i) => walk(`${key}[${i}]`, v));
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
const cheap = { js: false, proxy: 'datacenter' };

// Parameter values as n8n would hand them to getNodeParameter: what the user
// typed plus the node's UI defaults for the other visible fields.
const cases: Array<[string, Record<string, unknown>]> = [
	[
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
		{
			url: target,
			fields: '{"title":"Page title","description":"Short description"}',
			additionalOptions: cheap,
		},
	],
	['html', { url: target, format: 'json', return_script_result: false, additionalOptions: cheap }],
	['text', { url: target, text_format: 'plain', return_links: false, additionalOptions: cheap }],
	['selected', { url: target, selector: 'h1', format: 'json', additionalOptions: cheap }],
	['selectedMultiple', { url: target, selectors: '["h1", "p"]', additionalOptions: cheap }],
	['serp', { q: 'coffee machines', serpOptions: {} }],
	['account', {}],
];

function preview(body: string): string {
	return body.slice(0, 120).replace(/\s+/g, ' ');
}

async function main(): Promise<number> {
	const apiKey = process.env.WEBSCRAPING_AI_API_KEY;
	if (!apiKey) {
		console.error('WEBSCRAPING_AI_API_KEY env var is required');
		return 2;
	}
	const baseUrl = (process.env.WEBSCRAPING_AI_API_URL || PROD_BASE_URL).replace(/\/+$/, '');

	let failures = 0;
	for (const [operation, params] of cases) {
		const name = operation.padEnd(18);
		try {
			const getParam: GetParam = (paramName, fallback) =>
				paramName in params ? params[paramName] : fallback;
			const request = buildRequest(node, operation, getParam);

			// Credential generic auth: qs: { api_key: '={{$credentials.apiKey}}' }
			const qs = { ...(request.qs ?? {}), api_key: apiKey };
			const url = `${request.url.replace(PROD_BASE_URL, baseUrl)}?${qsStringify(qs)}`;

			const response = await fetch(url, {
				method: request.method ?? 'GET',
				signal: AbortSignal.timeout(90_000),
			});
			const body = await response.text();
			if (response.ok && body.trim().length > 0) {
				console.log(`  ok   ${name}  ${preview(body)}`);
			} else {
				failures += 1;
				console.log(`  FAIL ${name}  HTTP ${response.status}: ${body.slice(0, 300)}`);
			}
		} catch (err) {
			failures += 1;
			const e = err as Error;
			console.log(`  FAIL ${name}  ${e?.constructor?.name ?? 'Error'}: ${e?.message ?? String(err)}`);
		}
	}
	return failures === 0 ? 0 : 1;
}

main().then(
	(code) => process.exit(code),
	(err) => {
		console.error(err);
		process.exit(1);
	},
);
