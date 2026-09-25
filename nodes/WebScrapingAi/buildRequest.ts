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
};

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
		queryParams.fields = parseJsonParam(node, getParam('fields') as string, 'Fields') as IDataObject;
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
