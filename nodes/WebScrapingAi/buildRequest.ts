import { IDataObject, IHttpRequestOptions } from 'n8n-workflow';

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
};

/**
 * Pure request shaper for the WebScraping.AI node. Returned options are
 * handed straight to `httpRequestWithAuthentication` — the credential
 * injects `api_key` via generic auth.
 *
 * Throws plain Error on bad user input; the caller wraps in
 * NodeOperationError so the node can keep the helper free of n8n deps.
 */
export function buildRequest(operation: string, getParam: GetParam): IHttpRequestOptions {
	const endpoint = OPERATION_ENDPOINT[operation];
	if (!endpoint) {
		throw new Error(`Unknown operation: ${operation}`);
	}

	const queryParams: QueryParams = {};

	if (operation === 'aiQuestion') {
		queryParams.url = getParam('url') as string;
		queryParams.question = getParam('question') as string;
		const format = getParam('format', 'json') as string;
		if (format) queryParams.format = format;
	} else if (operation === 'aiFields') {
		queryParams.url = getParam('url') as string;
		queryParams.fields = parseJsonParam(getParam('fields') as string, 'Fields') as IDataObject;
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
		const parsed = parseJsonParam(getParam('selectors') as string, 'Selectors');
		if (!Array.isArray(parsed)) {
			throw new Error('Selectors must be a JSON array');
		}
		queryParams.selectors = parsed as IDataObject[] | string[];
	}

	if (SCRAPE_OPERATIONS.has(operation)) {
		const additionalOptions = (getParam('additionalOptions', {}) as Record<string, unknown>) ?? {};
		for (const [key, value] of Object.entries(additionalOptions)) {
			if (value === '' || value === undefined || value === null) continue;
			if (key === 'headers' && typeof value === 'string') {
				queryParams[key] = parseJsonParam(value, 'Headers') as IDataObject;
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
		returnFullResponse: true,
		json: false,
	};
}

function parseJsonParam(raw: string, label: string): unknown {
	try {
		return JSON.parse(raw);
	} catch (e) {
		throw new Error(`Invalid JSON in ${label} parameter`);
	}
}
