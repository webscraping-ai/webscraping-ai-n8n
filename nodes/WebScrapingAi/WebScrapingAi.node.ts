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
		name: 'webScrapingAi',
		icon: { light: 'file:webscrapingai.svg', dark: 'file:webscrapingai.dark.svg' },
		group: ['transform'],
		// v2 groups the operations under resources. Operation values stay unique
		// across resources, so every field below and buildRequest key on the
		// operation alone and work unchanged for v1 workflows.
		version: [1, 2],
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
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Account', value: 'account' },
					{ name: 'AI', value: 'ai' },
					{ name: 'Search', value: 'search' },
					{ name: 'Structured Data', value: 'structuredData' },
					{ name: 'Web Page', value: 'webPage' },
				],
				default: 'webPage',
				displayOptions: {
					show: {
						'@version': [2],
					},
				},
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Get HTML',
						value: 'html',
						action: 'Get full HTML of a web page',
						description: 'Get the full HTML content of a web page',
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
						action: 'Get text content of a web page',
						description: 'Get the visible text content of a web page',
					},
				],
				default: 'html',
				displayOptions: {
					show: {
						'@version': [2],
						resource: ['webPage'],
					},
				},
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Ask Question',
						value: 'aiQuestion',
						action: 'Ask a question about a web page',
						description: 'Get an answer to a question about a web page using AI',
					},
					{
						name: 'Extract Fields',
						value: 'aiFields',
						action: 'Extract fields from a web page',
						description: 'Extract structured data fields from a web page using AI',
					},
				],
				default: 'aiQuestion',
				displayOptions: {
					show: {
						'@version': [2],
						resource: ['ai'],
					},
				},
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Get Locations',
						value: 'serpLocations',
						action: 'Get search locations',
						description:
							'Look up names for the Location option of Search Google. Free, no credits used.',
					},
					{
						name: 'Search Google',
						value: 'serp',
						action: 'Search google',
						description:
							'Get parsed search engine results (organic results, related searches, pagination) for a query',
					},
				],
				default: 'serp',
				displayOptions: {
					show: {
						'@version': [2],
						resource: ['search'],
					},
				},
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Get',
						value: 'data',
						action: 'Get structured data for a web page',
						description: 'Get structured JSON for any public web page from its normal URL',
					},
				],
				default: 'data',
				displayOptions: {
					show: {
						'@version': [2],
						resource: ['structuredData'],
					},
				},
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Get',
						value: 'account',
						action: 'Get account information',
						description: 'Get your API account quota and usage information',
					},
				],
				default: 'account',
				displayOptions: {
					show: {
						'@version': [2],
						resource: ['account'],
					},
				},
			},
			// v1: one flat operation list, no resources
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						'@version': [1],
					},
				},
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
						name: 'Get Structured Data',
						value: 'data',
						action: 'Get structured data for any public web page',
						description: 'Get structured JSON for any public web page from its normal URL',
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
					{
						name: 'Search Locations',
						value: 'serpLocations',
						action: 'Look up search locations',
						description:
							'Look up names for the Location option of Search (SERP). Free, no credits used.',
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
			// Get Structured Data (/data) — own fields; the scraping additionalOptions don't apply
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				required: true,
				default: '',
				placeholder:
					'e.g. https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html',
				description:
					'Normal URL of any public web page. The first request for a new kind of page on a site also learns its structure and can take up to about 45 seconds; if learning takes longer, the API returns a 503 (structure_processing, not charged) and the node fails, so run it again after about 30 seconds. If no structured data can be found, a 422 (structure_unavailable, not charged) is returned: use AI Extract Fields instead. See https://webscraping.ai/docs#data for pricing.',
				displayOptions: {
					show: {
						operation: ['data'],
					},
				},
			},
			{
				displayName: 'Country',
				name: 'country',
				type: 'string',
				default: '',
				placeholder: 'e.g. us',
				description: 'Two-letter country code of the proxy used to fetch the page, us by default',
				displayOptions: {
					show: {
						operation: ['data'],
					},
				},
			},
			{
				displayName: 'Transcript',
				name: 'transcript',
				type: 'boolean',
				default: false,
				description:
					"Whether to also fetch the video's transcript into data.transcript (video pages on sites with a dedicated parser only). It's null when no matching captions are available. If the transcript fetch itself fails, the whole request fails with a 500 and is not charged.",
				displayOptions: {
					show: {
						operation: ['data'],
					},
				},
			},
			{
				displayName: 'Transcript Language',
				name: 'transcript_language',
				type: 'string',
				default: '',
				placeholder: 'e.g. en',
				description:
					'Caption language to pick, e.g. en or de (with Transcript on). Without it, English is preferred, then the first available track. If the video has no captions in that language, data.transcript is null.',
				displayOptions: {
					show: {
						operation: ['data'],
					},
				},
			},
			{
				displayName: 'Extra Parameters',
				name: 'extraParams',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				placeholder: 'Add Parameter',
				description:
					'Additional query parameters sent to the API as-is, e.g. timeout, js_timeout, wait_for or device for pages without a dedicated parser, or parameters added after this node version. There is no js or proxy option: /data renders pages with JavaScript where the site needs it and always uses proxy=auto. Cannot override the page URL, the API key or the fields above, and each name can be used once.',
				displayOptions: {
					show: {
						operation: ['data'],
					},
				},
				options: [
					{
						displayName: 'Parameter',
						name: 'parameter',
						values: [
							{
								displayName: 'Name',
								name: 'name',
								type: 'string',
								default: '',
								description: 'Query parameter name',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Query parameter value',
							},
						],
					},
				],
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
						description:
							'Two-letter country code for the search, e.g. us, gb, de. Defaults to the country of location, lat/lon or uule, otherwise us.',
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
						displayName: 'Latitude',
						name: 'lat',
						type: 'number',
						typeOptions: {
							minValue: -90,
							maxValue: 90,
							numberPrecision: 7,
						},
						default: 0,
						description:
							'Latitude of the search origin in decimal degrees, from -90 to 90. Requires Longitude; cannot be combined with Location or UULE.',
					},
					{
						displayName: 'Location',
						name: 'location',
						type: 'string',
						default: '',
						placeholder: 'e.g. Austin, TX',
						description:
							'Where the search runs from: a location name such as Austin,Texas,United States or Austin, TX, or an ID from Get Locations (Search Locations in node version 1). Large cities also match local names, e.g. Москва. An unknown name returns an error and is not charged. Cannot be combined with UULE, Latitude or Longitude.',
					},
					{
						displayName: 'Longitude',
						name: 'lon',
						type: 'number',
						typeOptions: {
							minValue: -180,
							maxValue: 180,
							numberPrecision: 7,
						},
						default: 0,
						description:
							'Longitude of the search origin in decimal degrees, from -180 to 180. Requires Latitude; cannot be combined with Location or UULE.',
					},
					{
						displayName: 'Page',
						name: 'page',
						type: 'number',
						// Expressions (Sheets, CSV) often yield numeric strings; n8n coerces them.
						validateType: 'number',
						typeOptions: {
							minValue: 1,
						},
						default: 1,
						description: 'Results page number (10 results per page)',
					},
					{
						displayName: 'Pages',
						name: 'pages',
						type: 'number',
						validateType: 'number',
						typeOptions: {
							minValue: 1,
						},
						default: 1,
						description:
							'Number of consecutive results pages to fetch in one call, starting at Page, from 1 to 5. Duplicates across pages are removed, position counts through the combined list and each result gets a page field. Billed per results page returned.',
					},
					{
						displayName: 'Radius (Meters)',
						name: 'radius',
						type: 'number',
						validateType: 'number',
						typeOptions: {
							minValue: 1,
						},
						default: 1000,
						description: 'Radius in meters around Location or Latitude/Longitude, from 1 to 1000',
					},
					{
						displayName: 'UULE',
						name: 'uule',
						type: 'string',
						default: '',
						description:
							'Google-encoded location (w+CAIQICI… or a+…). Cannot be combined with Location, Latitude or Longitude.',
					},
				],
			},
			// Search Locations (/serp/locations)
			{
				displayName: 'Query',
				name: 'q',
				type: 'string',
				default: '',
				placeholder: 'e.g. austin',
				description:
					'Part of a location name in English, e.g. austin. Without it, the most populous locations are returned.',
				displayOptions: {
					show: {
						operation: ['serpLocations'],
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				validateType: 'number',
				typeOptions: {
					minValue: 1,
				},
				// n8n's lint requires 50 for a Limit. The API returns at most 10 locations
				// and answers a larger limit with a 400, so buildRequest caps it at 10.
				default: 50,
				description: 'Max number of results to return',
				hint: 'At most 10 locations are returned',
				displayOptions: {
					show: {
						operation: ['serpLocations'],
					},
				},
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
				required: true,
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

				const getParam: GetParam = (name, fallback) => this.getNodeParameter(name, i, fallback);

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
						if (operation === 'serpLocations' && Array.isArray(jsonData)) {
							// One output item per location, ready for the next node.
							for (const location of jsonData) {
								returnData.push({ json: location, pairedItem: { item: i } });
							}
						} else {
							returnData.push({ json: jsonData, pairedItem: { item: i } });
						}
					} catch {
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
								typeof apiBody === 'string'
									? JSON.parse(apiBody)
									: (apiBody as Record<string, unknown>);
							errorMessage =
								(apiError.message as string) ||
								(apiError.detail as string) ||
								JSON.stringify(apiError);
						} catch {
							errorMessage = String(apiBody);
						}
					}
					// The API key rides in the query string; a transport error can quote the URL.
					errorMessage = String(errorMessage).replace(/(api_key=)[^&\s"'<>]*/gi, '$1[REDACTED]');
					returnData.push({ json: { error: errorMessage }, pairedItem: { item: i } });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error);
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
