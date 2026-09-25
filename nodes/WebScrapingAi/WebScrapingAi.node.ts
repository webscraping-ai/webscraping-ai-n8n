import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	NodeConnectionType,
	INodeInputConfiguration,
	INodeOutputConfiguration,
	IHttpRequestOptions,
} from 'n8n-workflow';

import { buildRequest, GetParam } from './buildRequest';

export class WebScrapingAi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WebScraping.AI',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-name-miscased
		name: 'webScrapingAi',
		icon: { light: 'file:webscrapingai.svg', dark: 'file:webscrapingai.dark.svg' },
		group: ['transform'],
		version: 1,
		usableAsTool: true,
		subtitle: '={{$parameter["operation"]}}',
		description: 'AI-powered web scraping with JavaScript rendering and proxies',
		defaults: {
			name: 'WebScraping.AI',
		},
		inputs: ['main'] as (NodeConnectionType | INodeInputConfiguration)[],
		outputs: ['main'] as (NodeConnectionType | INodeOutputConfiguration)[],
		credentials: [
			{
				name: 'webScrapingAiApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'AI Extract Fields',
						value: 'aiFields',
						action: 'Extract structured data using AI',
						description: 'Extract structured data fields from a webpage using AI',
					},
					{
						name: 'AI Question',
						value: 'aiQuestion',
						action: 'Ask AI a question about a webpage',
						description: 'Get an answer to a question about a webpage using AI',
					},
					{
						name: 'Get Account Info',
						value: 'account',
						action: 'Get account information',
						description: 'Get your API account quota and usage information',
					},
					{
						name: 'Get HTML',
						value: 'html',
						action: 'Get full HTML of webpage',
						description: 'Get the full HTML content of a webpage',
					},
					{
						name: 'Get Multiple Selections',
						value: 'selectedMultiple',
						action: 'Get HTML of multiple selections',
						description: 'Get HTML content of multiple page areas by CSS selectors',
					},
					{
						name: 'Get Selected HTML',
						value: 'selected',
						action: 'Get HTML of selected elements',
						description: 'Get HTML content of selected page areas by CSS selector',
					},
					{
						name: 'Get Text',
						value: 'text',
						action: 'Get text content of webpage',
						description: 'Get the visible text content of a webpage',
					},
					{
						name: 'Search (SERP)',
						value: 'serp',
						action: 'Get search engine results for a query',
						description:
							'Get parsed search engine results (organic results, related searches, pagination) for a query',
					},
				],
				default: 'html',
			},
			// URL parameter (used by most operations)
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				required: true,
				default: 'https://example.com',
				description: 'URL of the target webpage to scrape',
				displayOptions: {
					show: {
						operation: ['aiQuestion', 'aiFields', 'html', 'text', 'selected', 'selectedMultiple'],
					},
				},
			},
			// Search (SERP) query
			{
				displayName: 'Query',
				name: 'q',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'e.g. coffee machines',
				description: 'Search query',
				displayOptions: {
					show: {
						operation: ['serp'],
					},
				},
			},
			// Search (SERP) options — separate from the scraping additionalOptions,
			// which don't apply to /serp
			{
				displayName: 'Search Options',
				name: 'serpOptions',
				type: 'collection',
				default: {},
				placeholder: 'Add Option',
				displayOptions: {
					show: {
						operation: ['serp'],
					},
				},
				options: [
					{
						displayName: 'Country',
						name: 'gl',
						type: 'string',
						default: 'us',
						description: 'Two-letter country code for geolocation of the search (Google gl parameter)',
					},
					{
						displayName: 'Engine',
						name: 'engine',
						type: 'options',
						options: [{ name: 'Google', value: 'google' }],
						default: 'google',
						description: 'Search engine to query',
					},
					{
						displayName: 'Language',
						name: 'hl',
						type: 'string',
						default: 'en',
						description: 'Two-letter language code for the results (Google hl parameter)',
					},
					{
						displayName: 'Page',
						name: 'page',
						type: 'number',
						typeOptions: {
							minValue: 1,
						},
						default: 1,
						description: 'Results page number (10 results per page)',
					},
				],
			},
			// AI Question specific field
			{
				displayName: 'Question',
				name: 'question',
				type: 'string',
				required: true,
				default: '',
				description: 'Question or instructions to ask the LLM model about the target page',
				displayOptions: {
					show: {
						operation: ['aiQuestion'],
					},
				},
			},
			// AI Fields specific field
			{
				displayName: 'Fields to Extract',
				name: 'fields',
				type: 'json',
				required: true,
				default: '{"title":"Main product title","price":"Current product price"}',
				description:
					'JSON object defining fields to extract with descriptions. Example: {"title":"Main product title","price":"Current product price"}.',
				displayOptions: {
					show: {
						operation: ['aiFields'],
					},
				},
			},
			// Selector for Get Selected HTML
			{
				displayName: 'CSS Selector',
				name: 'selector',
				type: 'string',
				default: 'h1',
				description: 'CSS selector for target elements',
				displayOptions: {
					show: {
						operation: ['selected'],
					},
				},
			},
			// Selectors for Get Multiple Selections
			{
				displayName: 'CSS Selectors',
				name: 'selectors',
				type: 'json',
				default: '["h1", ".price"]',
				description: 'Array of CSS selectors. Example: ["h1", ".price", "#description"].',
				displayOptions: {
					show: {
						operation: ['selectedMultiple'],
					},
				},
			},
			// Advanced options (common across operations)
			{
				displayName: 'Additional Options',
				name: 'additionalOptions',
				type: 'collection',
				default: {},
				placeholder: 'Add Option',
				displayOptions: {
					show: {
						operation: ['aiQuestion', 'aiFields', 'html', 'text', 'selected', 'selectedMultiple'],
					},
				},
				options: [
					{
						displayName: 'Country',
						name: 'country',
						type: 'options',
						options: [
							{ name: 'Canada', value: 'ca' },
							{ name: 'France', value: 'fr' },
							{ name: 'Germany', value: 'de' },
							{ name: 'Hong Kong', value: 'hk' },
							{ name: 'India', value: 'in' },
							{ name: 'Italy', value: 'it' },
							{ name: 'Japan', value: 'jp' },
							{ name: 'Russia', value: 'ru' },
							{ name: 'South Korea', value: 'kr' },
							{ name: 'Spain', value: 'es' },
							{ name: 'Turkey', value: 'tr' },
							{ name: 'United Kingdom', value: 'gb' },
							{ name: 'United States', value: 'us' },
						],
						default: 'us',
						description: 'Country of the proxy to use',
					},
					{
						displayName: 'Custom JavaScript',
						name: 'js_script',
						type: 'string',
						typeOptions: {
							alwaysOpenEditWindow: true,
						},
						default: '',
						description: 'Custom JavaScript code to execute on the target page',
					},
					{
						displayName: 'Custom Proxy',
						name: 'custom_proxy',
						type: 'string',
						default: '',
						description: 'Your own proxy URL in "http://user:password@host:port" format',
					},
					{
						displayName: 'Device',
						name: 'device',
						type: 'options',
						options: [
							{ name: 'Desktop', value: 'desktop' },
							{ name: 'Mobile', value: 'mobile' },
							{ name: 'Tablet', value: 'tablet' },
						],
						default: 'desktop',
						description: 'Type of device emulation',
					},
					{
						displayName: 'Enable JavaScript',
						name: 'js',
						type: 'boolean',
						default: true,
						description: 'Whether to execute on-page JavaScript using a headless browser',
					},
					{
						displayName: 'Error on 404',
						name: 'error_on_404',
						type: 'boolean',
						default: false,
						description: 'Whether to return error on 404 HTTP status',
					},
					{
						displayName: 'Error on Redirect',
						name: 'error_on_redirect',
						type: 'boolean',
						default: false,
						description: 'Whether to return error on redirect',
					},
					{
						displayName: 'Headers',
						name: 'headers',
						type: 'json',
						default: '',
						description:
							'HTTP headers to pass to the target page as JSON object. Example: {"Cookie":"session=some_id"}.',
					},
					{
						displayName: 'JavaScript Timeout (Ms)',
						name: 'js_timeout',
						type: 'number',
						default: 2000,
						description: 'Maximum JavaScript rendering time in milliseconds (1-20000)',
					},
					{
						displayName: 'Proxy Type',
						name: 'proxy',
						type: 'options',
						options: [
							{ name: 'Datacenter', value: 'datacenter' },
							{ name: 'Residential', value: 'residential' },
							{ name: 'Stealth', value: 'stealth' },
						],
						default: 'residential',
						description:
							'Type of proxy to use. Use residential for sites that restrict datacenter traffic, or stealth for the most heavily protected sites with advanced anti-bot detection. Residential and stealth requests cost more than datacenter.',
					},
					{
						displayName: 'Timeout (Ms)',
						name: 'timeout',
						type: 'number',
						default: 10000,
						description: 'Maximum web page retrieval time in milliseconds (1-30000)',
					},
					{
						displayName: 'Wait For Selector',
						name: 'wait_for',
						type: 'string',
						default: '',
						description: 'CSS selector to wait for before returning the page content',
					},
				],
			},
			// Format option for specific operations
			{
				displayName: 'Response Format',
				name: 'format',
				type: 'options',
				options: [
					{ name: 'JSON', value: 'json' },
					{ name: 'Text', value: 'text' },
				],
				default: 'json',
				description: 'Format of the response',
				displayOptions: {
					show: {
						operation: ['aiQuestion', 'html', 'selected'],
					},
				},
			},
			// Return script result for HTML operation
			{
				displayName: 'Return Script Result',
				name: 'return_script_result',
				type: 'boolean',
				default: false,
				description: 'Whether to return result of custom JavaScript execution instead of HTML',
				displayOptions: {
					show: {
						operation: ['html'],
					},
				},
			},
			// Text format options
			{
				displayName: 'Text Format',
				name: 'text_format',
				type: 'options',
				options: [
					{ name: 'Plain', value: 'plain' },
					{ name: 'JSON', value: 'json' },
					{ name: 'XML', value: 'xml' },
				],
				default: 'plain',
				description: 'Format of the text response',
				displayOptions: {
					show: {
						operation: ['text'],
					},
				},
			},
			// Return links for text operation
			{
				displayName: 'Return Links',
				name: 'return_links',
				type: 'boolean',
				default: false,
				description:
					'Whether to return links from the page body text (works only with text_format=JSON)',
				displayOptions: {
					show: {
						operation: ['text'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				const getParam: GetParam = (name, fallback) =>
					this.getNodeParameter(name, i, fallback);

				const requestOptions: IHttpRequestOptions = buildRequest(
					this.getNode(),
					operation,
					getParam,
				);

				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'webScrapingAiApi',
					requestOptions,
				);

				const contentType = (response.headers['content-type'] || '').split(';')[0];

				if (contentType.includes('application/json')) {
					try {
						const jsonData =
							typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
						returnData.push({ json: jsonData, pairedItem: { item: i } });
					} catch (parseError) {
						returnData.push({ json: { raw: response.body }, pairedItem: { item: i } });
					}
				} else if (
					contentType.startsWith('text/') ||
					contentType.includes('html') ||
					contentType.includes('xml')
				) {
					const textData =
						typeof response.body === 'string' ? response.body : response.body.toString();
					returnData.push({ json: { data: textData }, pairedItem: { item: i } });
				} else {
					returnData.push({ json: { data: response.body }, pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					let errorMessage = (error as Error).message;
					const apiBody = (error as { response?: { body?: unknown } }).response?.body;
					if (apiBody) {
						try {
							const apiError =
								typeof apiBody === 'string' ? JSON.parse(apiBody) : (apiBody as Record<string, unknown>);
							errorMessage =
								(apiError.message as string) ||
								(apiError.detail as string) ||
								JSON.stringify(apiError);
						} catch (e) {
							errorMessage = String(apiBody);
						}
					}
					returnData.push({ json: { error: errorMessage }, pairedItem: { item: i } });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error);
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
