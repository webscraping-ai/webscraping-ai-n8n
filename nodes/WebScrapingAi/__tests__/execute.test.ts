import { IExecuteFunctions, INode } from 'n8n-workflow';

import { WebScrapingAi } from '../WebScrapingAi.node';

const node = {
	id: 'test',
	name: 'WebScraping.AI',
	type: 'webScrapingAi',
	typeVersion: 1,
	position: [0, 0],
	parameters: {},
} as INode;

const API_KEY = 'secret-api-key-123';

/** Minimal IExecuteFunctions for one input item and the `data` operation. */
function context(
	params: Record<string, unknown>,
	httpRequest: jest.Mock,
	continueOnFail = true,
): IExecuteFunctions {
	return {
		getInputData: () => [{ json: {} }],
		getNodeParameter: (name: string, _i: number, fallback?: unknown) =>
			name in params ? params[name] : fallback,
		getNode: () => node,
		continueOnFail: () => continueOnFail,
		helpers: {
			httpRequestWithAuthentication: httpRequest,
			returnJsonArray: (items: unknown) => items,
		},
	} as unknown as IExecuteFunctions;
}

const jsonResponse = (body: unknown) => ({
	headers: { 'content-type': 'application/json; charset=utf-8' },
	body: JSON.stringify(body),
});

describe('execute: data', () => {
	test('passes unknown provider/type strings and a null data through unchanged', async () => {
		const body = {
			request_parameters: {
				url: 'https://future.example/page',
				provider: 'some_future_site',
				type: 'some_future_type',
			},
			parse_status: 'parse_failed',
			data: null,
		};
		const http = jest.fn().mockResolvedValue(jsonResponse(body));
		const [items] = await new WebScrapingAi().execute.call(
			context({ operation: 'data', url: 'https://future.example/page' }, http),
		);

		expect(items).toEqual([{ json: body, pairedItem: { item: 0 } }]);
		expect(http).toHaveBeenCalledTimes(1);
		expect(http.mock.calls[0][1].url).toBe('https://api.webscraping.ai/data');
	});

	test('surfaces the server 400 {message} (continueOnFail) without the API key', async () => {
		const message =
			'Unsupported URL for /data. Supported sites: youtube, tiktok, twitter, linkedin, instagram, reddit. For other sites, use /ai/fields for AI-powered extraction.';
		const error = Object.assign(
			new Error(
				`Request failed with status code 400 (https://api.webscraping.ai/data?api_key=${API_KEY})`,
			),
			{ response: { status: 400, body: JSON.stringify({ message }) } },
		);
		const http = jest.fn().mockRejectedValue(error);
		const [items] = await new WebScrapingAi().execute.call(
			context({ operation: 'data', url: 'https://example.com/' }, http),
		);

		expect(items).toEqual([{ json: { error: message }, pairedItem: { item: 0 } }]);
		expect(JSON.stringify(items)).not.toContain(API_KEY);
	});

	test('redacts the API key from a transport error that quotes the request URL', async () => {
		const error = new Error(
			`getaddrinfo ENOTFOUND api.webscraping.ai (https://api.webscraping.ai/data?url=https%3A%2F%2Fexample.com%2F&from_n8n=true&api_key=${API_KEY})`,
		);
		const http = jest.fn().mockRejectedValue(error);
		const [items] = await new WebScrapingAi().execute.call(
			context({ operation: 'data', url: 'https://example.com/' }, http),
		);

		expect(JSON.stringify(items)).not.toContain(API_KEY);
		expect(JSON.stringify(items)).toContain('api_key=[REDACTED]');
	});

	test('a blank URL fails before any request', async () => {
		const http = jest.fn();
		await expect(
			new WebScrapingAi().execute.call(context({ operation: 'data', url: '  ' }, http, false)),
		).rejects.toThrow(/URL is required/);
		expect(http).not.toHaveBeenCalled();
	});
});
