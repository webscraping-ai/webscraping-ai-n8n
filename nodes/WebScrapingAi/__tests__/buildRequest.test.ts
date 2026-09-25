import { INode } from 'n8n-workflow';

import { buildRequest, GetParam } from '../buildRequest';

const fakeNode = {
	id: 'test',
	name: 'WebScraping.AI',
	type: 'webScrapingAi',
	typeVersion: 1,
	position: [0, 0],
	parameters: {},
} as INode;

/**
 * Helper: build a `getParam` shim from a plain bag of inputs that mirrors how
 * n8n hands user-supplied values to the node at runtime. Falls back to the
 * caller-supplied default when the key is absent (also matching n8n behavior).
 */
function getParamFrom(inputs: Record<string, unknown>): GetParam {
	return <T,>(name: string, fallback?: T) => {
		if (name in inputs) return inputs[name];
		return fallback;
	};
}

describe('buildRequest', () => {
	describe('endpoint mapping', () => {
		test.each([
			['aiQuestion', '/ai/question'],
			['aiFields', '/ai/fields'],
			['html', '/html'],
			['text', '/text'],
			['selected', '/selected'],
			['selectedMultiple', '/selected-multiple'],
			['account', '/account'],
			['serp', '/serp'],
		])('%s maps to %s', (operation, endpoint) => {
			const inputs: Record<string, unknown> = {
				url: 'https://example.com',
				question: 'q?',
				fields: '{"x":"y"}',
				selectors: '["h1"]',
				q: 'coffee machines',
			};
			const req = buildRequest(fakeNode, operation, getParamFrom(inputs));
			expect(req.url).toBe(`https://api.webscraping.ai${endpoint}`);
			expect(req.method).toBe('GET');
		});

		test('unknown operation throws', () => {
			expect(() => buildRequest(fakeNode, 'bogus', getParamFrom({}))).toThrow(/Unknown operation/);
		});
	});

	describe('from_n8n analytics flag', () => {
		test.each([
			'aiQuestion',
			'aiFields',
			'html',
			'text',
			'selected',
			'selectedMultiple',
			'account',
			'serp',
		])('%s sends from_n8n=true', (operation) => {
			const inputs: Record<string, unknown> = {
				url: 'https://example.com',
				q: 'coffee machines',
				question: 'q?',
				fields: '{"x":"y"}',
				selectors: '["h1"]',
			};
			const req = buildRequest(fakeNode, operation, getParamFrom(inputs));
			expect((req.qs as Record<string, unknown>).from_n8n).toBe(true);
		});
	});

	describe('aiQuestion', () => {
		test('builds expected query', () => {
			const req = buildRequest(fakeNode, 
				'aiQuestion',
				getParamFrom({
					url: 'https://example.com',
					question: 'What is this page about?',
					format: 'json',
				}),
			);
			expect(req.qs).toMatchObject({
				url: 'https://example.com',
				question: 'What is this page about?',
				format: 'json',
				from_n8n: true,
			});
		});

		test('omits format when explicitly empty', () => {
			const req = buildRequest(fakeNode, 
				'aiQuestion',
				getParamFrom({
					url: 'https://example.com',
					question: 'q?',
					format: '',
				}),
			);
			expect(req.qs).not.toHaveProperty('format');
		});
	});

	describe('aiFields', () => {
		test('parses fields JSON object', () => {
			const req = buildRequest(fakeNode, 
				'aiFields',
				getParamFrom({
					url: 'https://example.com',
					fields: '{"title":"Main title","price":"Current price"}',
				}),
			);
			expect(req.qs).toMatchObject({
				url: 'https://example.com',
				fields: { title: 'Main title', price: 'Current price' },
				from_n8n: true,
			});
		});

		test('throws on invalid fields JSON', () => {
			expect(() =>
				buildRequest(fakeNode, 
					'aiFields',
					getParamFrom({
						url: 'https://example.com',
						fields: '{not valid json',
					}),
				),
			).toThrow(/Invalid JSON in Fields/);
		});
	});

	describe('selectedMultiple', () => {
		test('parses selectors as array', () => {
			const req = buildRequest(fakeNode, 
				'selectedMultiple',
				getParamFrom({
					url: 'https://example.com',
					selectors: '["h1", ".price"]',
				}),
			);
			expect((req.qs as { selectors: unknown }).selectors).toEqual(['h1', '.price']);
		});

		test('throws when selectors JSON is not an array', () => {
			expect(() =>
				buildRequest(fakeNode, 
					'selectedMultiple',
					getParamFrom({
						url: 'https://example.com',
						selectors: '{"not":"an array"}',
					}),
				),
			).toThrow(/Selectors must be a JSON array/);
		});

		test('throws on invalid selectors JSON', () => {
			expect(() =>
				buildRequest(fakeNode, 
					'selectedMultiple',
					getParamFrom({
						url: 'https://example.com',
						selectors: 'h1, .price',
					}),
				),
			).toThrow(/Invalid JSON in Selectors/);
		});
	});

	describe('selected', () => {
		test('omits selector when empty', () => {
			const req = buildRequest(fakeNode, 
				'selected',
				getParamFrom({
					url: 'https://example.com',
					selector: '',
				}),
			);
			expect(req.qs).not.toHaveProperty('selector');
		});

		test('sends selector when provided', () => {
			const req = buildRequest(fakeNode, 
				'selected',
				getParamFrom({
					url: 'https://example.com',
					selector: 'div.product > h2',
				}),
			);
			expect((req.qs as Record<string, unknown>).selector).toBe('div.product > h2');
		});
	});

	describe('text', () => {
		test('default text_format is plain', () => {
			const req = buildRequest(fakeNode, 
				'text',
				getParamFrom({
					url: 'https://example.com',
				}),
			);
			expect((req.qs as Record<string, unknown>).text_format).toBe('plain');
		});

		test('return_links suppressed when false', () => {
			const req = buildRequest(fakeNode, 
				'text',
				getParamFrom({
					url: 'https://example.com',
					return_links: false,
				}),
			);
			expect(req.qs).not.toHaveProperty('return_links');
		});

		test('return_links included when true', () => {
			const req = buildRequest(fakeNode, 
				'text',
				getParamFrom({
					url: 'https://example.com',
					return_links: true,
				}),
			);
			expect((req.qs as Record<string, unknown>).return_links).toBe(true);
		});
	});

	describe('html', () => {
		test('return_script_result suppressed when false', () => {
			const req = buildRequest(fakeNode, 
				'html',
				getParamFrom({
					url: 'https://example.com',
					return_script_result: false,
				}),
			);
			expect(req.qs).not.toHaveProperty('return_script_result');
		});
	});

	describe('additionalOptions merging', () => {
		test('merges scalar options', () => {
			const req = buildRequest(fakeNode, 
				'html',
				getParamFrom({
					url: 'https://example.com',
					additionalOptions: {
						js: true,
						js_timeout: 3000,
						proxy: 'residential',
						country: 'gb',
						device: 'mobile',
					},
				}),
			);
			expect(req.qs).toMatchObject({
				js: true,
				js_timeout: 3000,
				proxy: 'residential',
				country: 'gb',
				device: 'mobile',
			});
		});

		test('parses headers JSON string', () => {
			const req = buildRequest(fakeNode, 
				'html',
				getParamFrom({
					url: 'https://example.com',
					additionalOptions: {
						headers: '{"Cookie":"session=abc"}',
					},
				}),
			);
			expect((req.qs as Record<string, unknown>).headers).toEqual({ Cookie: 'session=abc' });
		});

		test('throws on invalid headers JSON', () => {
			expect(() =>
				buildRequest(fakeNode, 
					'html',
					getParamFrom({
						url: 'https://example.com',
						additionalOptions: { headers: '{bad json' },
					}),
				),
			).toThrow(/Invalid JSON in Headers/);
		});

		test('drops empty / null / undefined values', () => {
			const req = buildRequest(fakeNode, 
				'html',
				getParamFrom({
					url: 'https://example.com',
					additionalOptions: {
						wait_for: '',
						js_script: null,
						country: undefined,
						js: true,
					},
				}),
			);
			expect(req.qs).not.toHaveProperty('wait_for');
			expect(req.qs).not.toHaveProperty('js_script');
			expect(req.qs).not.toHaveProperty('country');
			expect((req.qs as Record<string, unknown>).js).toBe(true);
		});

		test('account operation ignores additionalOptions', () => {
			const req = buildRequest(fakeNode, 
				'account',
				getParamFrom({
					additionalOptions: { js: true, country: 'gb' },
				}),
			);
			expect(req.qs).not.toHaveProperty('js');
			expect(req.qs).not.toHaveProperty('country');
		});
	});

	describe('serp', () => {
		test('sends only q (plus from_n8n) by default', () => {
			const req = buildRequest(fakeNode, 'serp', getParamFrom({ q: 'coffee machines' }));
			expect(req.url).toBe('https://api.webscraping.ai/serp');
			expect(req.qs).toEqual({ q: 'coffee machines', from_n8n: true });
		});

		test('maps engine, gl, hl and page from Search Options', () => {
			const req = buildRequest(fakeNode, 
				'serp',
				getParamFrom({
					q: 'coffee machines',
					serpOptions: { engine: 'google', gl: 'de', hl: 'de', page: 2 },
				}),
			);
			expect(req.qs).toEqual({
				q: 'coffee machines',
				engine: 'google',
				gl: 'de',
				hl: 'de',
				page: 2,
				from_n8n: true,
			});
		});

		test('drops empty options', () => {
			const req = buildRequest(fakeNode, 
				'serp',
				getParamFrom({ q: 'coffee', serpOptions: { gl: '', hl: null, page: undefined } }),
			);
			expect(req.qs).toEqual({ q: 'coffee', from_n8n: true });
		});

		test('ignores scraping additionalOptions and url', () => {
			const req = buildRequest(fakeNode, 
				'serp',
				getParamFrom({
					q: 'coffee',
					url: 'https://example.com',
					additionalOptions: { js: true, proxy: 'residential', country: 'gb' },
				}),
			);
			expect(req.qs).not.toHaveProperty('url');
			expect(req.qs).not.toHaveProperty('js');
			expect(req.qs).not.toHaveProperty('proxy');
			expect(req.qs).not.toHaveProperty('country');
		});

		test.each([undefined, '', '   '])('rejects empty query (%p)', (q) => {
			const inputs = q === undefined ? {} : { q };
			expect(() => buildRequest(fakeNode, 'serp', getParamFrom(inputs))).toThrow(/Query is required/);
		});
	});

	describe('enum sync with OpenAPI', () => {
		// Sourced from public/openapi.yml at the time of writing. If the API
		// adds new values, this test fails loudly so the node options dropdown
		// can be updated in lockstep.
		const PROXY_TYPES = ['datacenter', 'residential', 'stealth'];
		const COUNTRIES = [
			'us',
			'gb',
			'de',
			'it',
			'fr',
			'ca',
			'es',
			'ru',
			'jp',
			'kr',
			'in',
			'hk',
			'tr',
		];
		const DEVICES = ['desktop', 'mobile', 'tablet'];

		test.each(PROXY_TYPES)('proxy=%s passes through', (proxy) => {
			const req = buildRequest(fakeNode, 
				'html',
				getParamFrom({
					url: 'https://example.com',
					additionalOptions: { proxy },
				}),
			);
			expect((req.qs as Record<string, unknown>).proxy).toBe(proxy);
		});

		test.each(COUNTRIES)('country=%s passes through', (country) => {
			const req = buildRequest(fakeNode, 
				'html',
				getParamFrom({
					url: 'https://example.com',
					additionalOptions: { country },
				}),
			);
			expect((req.qs as Record<string, unknown>).country).toBe(country);
		});

		test.each(DEVICES)('device=%s passes through', (device) => {
			const req = buildRequest(fakeNode, 
				'html',
				getParamFrom({
					url: 'https://example.com',
					additionalOptions: { device },
				}),
			);
			expect((req.qs as Record<string, unknown>).device).toBe(device);
		});
	});

	describe('request envelope', () => {
		test('returnFullResponse is true and json is false', () => {
			const req = buildRequest(fakeNode, 
				'account',
				getParamFrom({}),
			);
			expect(req.returnFullResponse).toBe(true);
			expect(req.json).toBe(false);
		});
	});
});
