import { IDataObject, IHttpRequestOptions, INode, NodeOperationError } from 'n8n-workflow';

const BASE_URL = 'https://api.webscraping.ai';

export type GetParam = <T>(name: string, fallback?: T) => unknown;

type QueryParams = IDataObject;

const SCRAPE_OPERATIONS = new Set([
	'aiQuestion',
	'aiFields',
	'html',
	'text',
	'selected',
	'selectedMultiple',
]);

const OPERATION_ENDPOINT: Record<string, string> = {
	aiQuestion: '/ai/question',
	aiFields: '/ai/fields',
	html: '/html',
	text: '/text',
	selected: '/selected',
	selectedMultiple: '/selected-multiple',
	account: '/account',
	serp: '/serp',
	data: '/data',
};

// Extra Parameters can't carry these: api_key comes from the credential, and
// url is the operation's own field.
const DATA_RESERVED_PARAMS = new Set(['api_key', 'url']);
// Named fields of the operation: set them there, not as an extra parameter.
const DATA_NAMED_PARAMS = new Set(['country', 'transcript', 'transcript_language']);

/**
 * Pure request shaper for the WebScraping.AI node. Returned options are
 * handed straight to `httpRequestWithAuthentication` — the credential
 * injects `api_key` via generic auth.
 *
 * Throws NodeOperationError on bad user input.
 */
export function buildRequest(
	node: INode,
	operation: string,
	getParam: GetParam,
): IHttpRequestOptions {
	const endpoint = OPERATION_ENDPOINT[operation];
	if (!endpoint) {
		throw new NodeOperationError(node, `Unknown operation: ${operation}`);
	}

	const queryParams: QueryParams = {};

	if (operation === 'aiQuestion') {
		queryParams.url = getParam('url') as string;
		queryParams.question = getParam('question') as string;
		const format = getParam('format', 'json') as string;
		if (format) queryParams.format = format;
	} else if (operation === 'aiFields') {
		queryParams.url = getParam('url') as string;
		queryParams.fields = parseJsonParam(
			node,
			getParam('fields') as string,
			'Fields',
		) as IDataObject;
	} else if (operation === 'html') {
		queryParams.url = getParam('url') as string;
		const format = getParam('format', 'json') as string;
		if (format) queryParams.format = format;
		const returnScriptResult = getParam('return_script_result', false) as boolean;
		if (returnScriptResult) queryParams.return_script_result = returnScriptResult;
	} else if (operation === 'text') {
		queryParams.url = getParam('url') as string;
		const textFormat = getParam('text_format', 'plain') as string;
		if (textFormat) queryParams.text_format = textFormat;
		const returnLinks = getParam('return_links', false) as boolean;
		if (returnLinks) queryParams.return_links = returnLinks;
	} else if (operation === 'selected') {
		queryParams.url = getParam('url') as string;
		const selector = getParam('selector', '') as string;
		if (selector) queryParams.selector = selector;
		const format = getParam('format', 'json') as string;
		if (format) queryParams.format = format;
	} else if (operation === 'selectedMultiple') {
		queryParams.url = getParam('url') as string;
		const parsed = parseJsonParam(node, getParam('selectors') as string, 'Selectors');
		if (!Array.isArray(parsed)) {
			throw new NodeOperationError(node, 'Selectors must be a JSON array');
		}
		queryParams.selectors = parsed as IDataObject[] | string[];
	} else if (operation === 'serp') {
		// Query-shaped, not URL-shaped: none of the scraping additionalOptions apply.
		const q = ((getParam('q', '') as string) ?? '').trim();
		if (!q) {
			throw new NodeOperationError(node, 'Query is required for the Search (SERP) operation');
		}
		queryParams.q = q;
		const serpOptions = (getParam('serpOptions', {}) as Record<string, unknown>) ?? {};
		for (const key of ['engine', 'gl', 'hl', 'page']) {
			const value = serpOptions[key];
			if (value === '' || value === undefined || value === null) continue;
			// The UI enforces minValue 1, but expressions bypass it, and the API
			// silently serves (and bills) page 1 for an invalid page.
			if (key === 'page' && !(Number.isSafeInteger(value) && (value as number) >= 1)) {
				throw new NodeOperationError(node, 'Page must be a whole number of 1 or more');
			}
			queryParams[key] = value as IDataObject[keyof IDataObject];
		}
	} else if (operation === 'data') {
		// None of the scraping additionalOptions apply. The URL is deliberately not
		// checked against a site list: supported sites grow on the server, whose
		// free 400 is the source of truth for "unsupported".
		const rawUrl = getParam('url', '');
		if (rawUrl !== undefined && rawUrl !== null && typeof rawUrl !== 'string') {
			throw new NodeOperationError(node, 'URL must be a string');
		}
		// Trimmed like serp's q (deliberate); otherwise sent byte for byte.
		const url = (rawUrl ?? '').trim();
		if (!url) {
			throw new NodeOperationError(node, 'URL is required for the Get Structured Data operation');
		}
		const extra = (getParam('extraParams', {}) as { parameter?: unknown } | null) ?? {};
		const pairs = Array.isArray(extra.parameter) ? extra.parameter : [];
		for (const pair of pairs as Array<{ name?: unknown; value?: unknown }>) {
			const name = typeof pair?.name === 'string' ? pair.name.trim() : '';
			if (!name) continue;
			if (DATA_RESERVED_PARAMS.has(name)) {
				throw new NodeOperationError(node, `Extra Parameters must not contain "${name}"`);
			}
			if (DATA_NAMED_PARAMS.has(name)) {
				throw new NodeOperationError(
					node,
					`Extra Parameters must not contain "${name}": use the ${name} field instead`,
				);
			}
			if (Object.prototype.hasOwnProperty.call(queryParams, name)) {
				throw new NodeOperationError(node, `Extra Parameters contain "${name}" more than once`);
			}
			const value = pair.value;
			if (value === undefined || value === null) continue;
			if (typeof value === 'object') {
				throw new NodeOperationError(
					node,
					`Extra parameter "${name}" must be a string, number or boolean`,
				);
			}
			queryParams[name] = value as string | number | boolean;
		}
		queryParams.url = url;
		const country = getParam('country', '');
		if (typeof country === 'string' && country.trim()) queryParams.country = country.trim();
		const transcript = getParam('transcript', false);
		if (transcript === true) queryParams.transcript = true;
		const transcriptLanguage = getParam('transcript_language', '');
		if (typeof transcriptLanguage === 'string' && transcriptLanguage.trim()) {
			queryParams.transcript_language = transcriptLanguage.trim();
		}
	}

	if (SCRAPE_OPERATIONS.has(operation)) {
		const additionalOptions = (getParam('additionalOptions', {}) as Record<string, unknown>) ?? {};
		for (const [key, value] of Object.entries(additionalOptions)) {
			if (value === '' || value === undefined || value === null) continue;
			if (key === 'headers' && typeof value === 'string') {
				queryParams[key] = parseJsonParam(node, value, 'Headers') as IDataObject;
			} else {
				queryParams[key] = value as IDataObject[keyof IDataObject];
			}
		}
	}

	// Server-side analytics signal — mirrors MCP's `from_mcp_server`.
	// Lets us measure what share of API traffic originates from n8n workflows.
	queryParams.from_n8n = true;

	return {
		url: `${BASE_URL}${endpoint}`,
		method: 'GET',
		qs: queryParams,
		// The API reads repeated keys (selectors=h1&selectors=p). n8n's default
		// `indices` (selectors[0]=h1) is silently ignored and /selected-multiple
		// returns [[]]. Objects (headers, fields) still encode as headers[Cookie]=.
		arrayFormat: 'repeat',
		returnFullResponse: true,
		json: false,
	};
}

function parseJsonParam(node: INode, raw: string, label: string): unknown {
	try {
		return JSON.parse(raw);
	} catch (e) {
		throw new NodeOperationError(node, `Invalid JSON in ${label} parameter`);
	}
}
