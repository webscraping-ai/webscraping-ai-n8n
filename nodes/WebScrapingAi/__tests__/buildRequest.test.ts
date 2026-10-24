import { INode, INodeProperties, validateFieldType } from 'n8n-workflow';

import { buildRequest, formatCoordinate, GetParam } from '../buildRequest';
import { WebScrapingAi } from '../WebScrapingAi.node';

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
			['serpLocations', '/serp/locations'],
			['data', '/data'],
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
			'serpLocations',
			'data',
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

		test('asks n8n to encode arrays as repeated keys (selectors=a&selectors=b)', () => {
			const req = buildRequest(fakeNode, 
				'selectedMultiple',
				getParamFrom({ url: 'https://example.com', selectors: '["h1", ".price"]' }),
			);
			expect(req.arrayFormat).toBe('repeat');
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
		test.each([0, -1, 1.5, NaN, '2'])('rejects invalid page %p', (page) => {
			expect(() =>
				buildRequest(fakeNode, 'serp', getParamFrom({ q: 'coffee', serpOptions: { page } })),
			).toThrow('Page must be a whole number of 1 or more');
		});

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

		test('maps location, pages and radius', () => {
			const req = buildRequest(
				fakeNode,
				'serp',
				getParamFrom({
					q: 'coffee machines',
					serpOptions: { location: 'Austin, TX', pages: 2, radius: 500 },
				}),
			);
			expect(req.qs).toEqual({
				q: 'coffee machines',
				location: 'Austin, TX',
				pages: 2,
				radius: 500,
				from_n8n: true,
			});
		});

		test('sends location and uule as typed (not trimmed)', () => {
			const req = buildRequest(
				fakeNode,
				'serp',
				getParamFrom({ q: 'coffee', serpOptions: { location: ' Москва ', uule: 'w+CAIQICI' } }),
			);
			expect(req.qs).toMatchObject({ location: ' Москва ', uule: 'w+CAIQICI' });
		});

		test('sends lat/lon as plain decimal strings', () => {
			const req = buildRequest(
				fakeNode,
				'serp',
				getParamFrom({ q: 'coffee', serpOptions: { lat: 30.2672, lon: -97.7431 } }),
			);
			expect(req.qs).toMatchObject({ lat: '30.2672', lon: '-97.7431' });
		});

		test('sends a latitude of 0, but nothing for an option that was not added', () => {
			const withZero = buildRequest(
				fakeNode,
				'serp',
				getParamFrom({ q: 'coffee', serpOptions: { lat: 0, lon: 1e-7 } }),
			);
			expect(withZero.qs).toMatchObject({ lat: '0', lon: '0.0000001' });

			const unset = buildRequest(fakeNode, 'serp', getParamFrom({ q: 'coffee', serpOptions: {} }));
			expect(unset.qs).not.toHaveProperty('lat');
			expect(unset.qs).not.toHaveProperty('lon');
		});

		test.each([0, -1, 1.5, NaN, '2'])('rejects invalid pages %p', (pages) => {
			expect(() =>
				buildRequest(fakeNode, 'serp', getParamFrom({ q: 'coffee', serpOptions: { pages } })),
			).toThrow('Pages must be a whole number of 1 or more');
		});

		test.each([0, -5, 2.5, Infinity])('rejects invalid radius %p', (radius) => {
			expect(() =>
				buildRequest(fakeNode, 'serp', getParamFrom({ q: 'coffee', serpOptions: { radius } })),
			).toThrow('Radius must be a whole number of 1 or more');
		});

		test.each([
			['lat', 'Latitude', NaN],
			['lat', 'Latitude', Infinity],
			['lon', 'Longitude', -Infinity],
			['lat', 'Latitude', ''],
			['lat', 'Latitude', '   '],
			['lon', 'Longitude', null],
			['lat', 'Latitude', 'north'],
			['lat', 'Latitude', '1e5'],
			['lon', 'Longitude', '30,1'],
			['lon', 'Longitude', true],
		])('rejects %s %p', (key, label, value) => {
			expect(() =>
				buildRequest(
					fakeNode,
					'serp',
					getParamFrom({ q: 'coffee', serpOptions: { [key]: value } }),
				),
			).toThrow(`${label} must be a number (leave the option out when there is no value)`);
		});

		test.each([
			['30.2672', '30.2672'],
			[' -97.7431 ', '-97.7431'],
			['+5', '5'],
			['.5', '0.5'],
			['48.', '48'],
			['0', '0'],
		])('accepts the expression string %p for lat/lon', (value, wire) => {
			const req = buildRequest(
				fakeNode,
				'serp',
				getParamFrom({ q: 'coffee', serpOptions: { lat: value, lon: value } }),
			);
			expect(req.qs).toMatchObject({ lat: wire, lon: wire });
		});

		test('leaves location/lat/lon/radius combinations to the server', () => {
			const req = buildRequest(
				fakeNode,
				'serp',
				getParamFrom({
					q: 'coffee',
					serpOptions: { location: 'Austin', uule: 'a+x', lat: 1, radius: 10 },
				}),
			);
			expect(req.qs).toMatchObject({ location: 'Austin', uule: 'a+x', lat: '1', radius: 10 });
		});
	});

	describe('numeric fields coerce expression strings', () => {
		const properties = new WebScrapingAi().description.properties;
		const serpOptions = properties.find((p) => p.name === 'serpOptions')!
			.options as INodeProperties[];
		const option = (name: string) => serpOptions.find((p) => p.name === name)!;
		const limitField = properties.find(
			(p) => p.name === 'limit' && p.displayOptions?.show?.operation?.includes('serpLocations'),
		)!;

		// n8n validates (and coerces) each field with validateType before the node
		// sees it; mirror that with the same n8n-workflow helper.
		const coerce = (field: INodeProperties, value: unknown) => {
			expect(field.validateType).toBe('number');
			const result = validateFieldType(field.name, value, field.validateType!);
			if (!result.valid) throw new Error(result.errorMessage);
			return result.newValue;
		};

		test('Latitude/Longitude have no validateType (a blank cell must not become 0)', () => {
			expect(option('lat').validateType).toBeUndefined();
			expect(option('lon').validateType).toBeUndefined();
		});

		test('Search Options strings from Sheets/CSV become numbers on the wire', () => {
			const raw = { page: '2', pages: '3', radius: '500' };
			const coerced = Object.fromEntries(
				Object.entries(raw).map(([k, v]) => [k, coerce(option(k), v)]),
			);
			const req = buildRequest(
				fakeNode,
				'serp',
				getParamFrom({ q: 'coffee', serpOptions: { ...coerced, lat: '30.2672', lon: '-97.7431' } }),
			);
			expect(req.qs).toMatchObject({
				lat: '30.2672',
				lon: '-97.7431',
				page: 2,
				pages: 3,
				radius: 500,
			});
		});

		test('Search Locations limit string becomes a number', () => {
			const req = buildRequest(
				fakeNode,
				'serpLocations',
				getParamFrom({ limit: coerce(limitField, '3') }),
			);
			expect(req.qs).toEqual({ limit: 3, from_n8n: true });
		});

		test('a non-numeric string is still rejected by n8n', () => {
			expect(validateFieldType('page', 'two', 'number').valid).toBe(false);
		});
	});

	describe('formatCoordinate', () => {
		test.each([
			[30.2672, '30.2672'],
			[-97.7431, '-97.7431'],
			[48, '48'],
			[-180, '-180'],
			[1e-7, '0.0000001'],
			[-1e-7, '-0.0000001'],
			[1e-9, '0'],
			[-1e-9, '0'],
			[0, '0'],
			[-0, '0'],
			[1.00000004, '1'],
			[12.345678951, '12.345679'],
			[1e21, '1000000000000000000000'],
		])('%p -> %p', (value, wire) => {
			const out = formatCoordinate(value);
			expect(out).toBe(wire);
			expect(out).toMatch(/^-?\d+(\.\d+)?$/);
		});
	});

	describe('serpLocations', () => {
		test('sends nothing but from_n8n without a query or limit', () => {
			const req = buildRequest(fakeNode, 'serpLocations', getParamFrom({}));
			expect(req.url).toBe('https://api.webscraping.ai/serp/locations');
			expect(req.qs).toEqual({ from_n8n: true });
		});

		test('sends a trimmed q and the limit', () => {
			const req = buildRequest(
				fakeNode,
				'serpLocations',
				getParamFrom({ q: ' austin\n', limit: 3 }),
			);
			expect(req.qs).toEqual({ q: 'austin', limit: 3, from_n8n: true });
		});

		test('drops a blank q', () => {
			const req = buildRequest(fakeNode, 'serpLocations', getParamFrom({ q: '   ', limit: 10 }));
			expect(req.qs).toEqual({ limit: 10, from_n8n: true });
		});

		test.each([0, -1, 2.5, NaN, '3'])('rejects invalid limit %p', (limit) => {
			expect(() =>
				buildRequest(fakeNode, 'serpLocations', getParamFrom({ limit })),
			).toThrow('Limit must be a whole number of 1 or more');
		});

		test('ignores serp and scraping options', () => {
			const req = buildRequest(
				fakeNode,
				'serpLocations',
				getParamFrom({
					q: 'austin',
					serpOptions: { location: 'Austin' },
					additionalOptions: { js: true },
				}),
			);
			expect(req.qs).toEqual({ q: 'austin', from_n8n: true });
		});
	});

	describe('data', () => {
		const yt = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

		test('sends only url (plus from_n8n) with UI defaults', () => {
			const req = buildRequest(
				fakeNode,
				'data',
				getParamFrom({
					url: yt,
					country: '',
					transcript: false,
					transcript_language: '',
					extraParams: {},
				}),
			);
			expect(req.url).toBe('https://api.webscraping.ai/data');
			expect(req.qs).toEqual({ url: yt, from_n8n: true });
		});

		test('maps country, transcript, transcript_language and extra params', () => {
			const req = buildRequest(
				fakeNode,
				'data',
				getParamFrom({
					url: yt,
					country: 'de',
					transcript: true,
					transcript_language: 'en',
					extraParams: {
						parameter: [
							{ name: 'future_flag', value: 'yes' },
							{ name: 'a&b', value: 'c=d&e' },
							{ name: '', value: 'ignored' },
						],
					},
				}),
			);
			expect(req.qs).toEqual({
				url: yt,
				country: 'de',
				transcript: true,
				transcript_language: 'en',
				future_flag: 'yes',
				'a&b': 'c=d&e',
				from_n8n: true,
			});
		});

		test.each([
			['country', 'gb'],
			['country', ''],
			['transcript', 'gb'],
			['transcript', ''],
			['transcript_language', 'gb'],
			['transcript_language', ''],
		])(
			'rejects an extra parameter repeating the named field %s (field value %p)',
			(name, fieldValue) => {
				expect(() =>
					buildRequest(
						fakeNode,
						'data',
						getParamFrom({
							url: yt,
							[name]: fieldValue,
							extraParams: { parameter: [{ name, value: 'fr' }] },
						}),
					),
				).toThrow(`Extra Parameters must not contain "${name}": use the ${name} field instead`);
			},
		);

		test('rejects a name repeated across two Extra Parameters rows', () => {
			expect(() =>
				buildRequest(
					fakeNode,
					'data',
					getParamFrom({
						url: yt,
						extraParams: {
							parameter: [
								{ name: 'future', value: 'a' },
								{ name: ' future ', value: 'b' },
							],
						},
					}),
				),
			).toThrow('Extra Parameters contain "future" more than once');
		});

		test.each([42, true, { a: 1 }, ['x']])('rejects a non-string URL (%p)', (url) => {
			expect(() => buildRequest(fakeNode, 'data', getParamFrom({ url }))).toThrow(
				'URL must be a string',
			);
		});

		test('sends an arbitrary unknown-site URL unmodified, with no client-side error', () => {
			// Surrounding whitespace is trimmed (like serp's q); nothing else changes:
			// no lower-casing, decoding, re-encoding or fragment dropping.
			const target = '  https://Example.COM/A%2Fb/ünï?x=1&y=a b#Frag  ';
			const req = buildRequest(fakeNode, 'data', getParamFrom({ url: target }));
			expect((req.qs as Record<string, unknown>).url).toBe('https://Example.COM/A%2Fb/ünï?x=1&y=a b#Frag');
		});

		test.each([undefined, '', '   '])('rejects empty url (%p)', (url) => {
			const inputs = url === undefined ? {} : { url };
			expect(() => buildRequest(fakeNode, 'data', getParamFrom(inputs))).toThrow(/URL is required/);
		});

		test.each(['api_key', 'url'])('rejects %s in Extra Parameters', (name) => {
			const secret = 'super-secret-value';
			let error: Error | undefined;
			try {
				buildRequest(
					fakeNode,
					'data',
					getParamFrom({ url: yt, extraParams: { parameter: [{ name, value: secret }] } }),
				);
			} catch (e) {
				error = e as Error;
			}
			expect(error?.message).toBe(`Extra Parameters must not contain "${name}"`);
			// The rejected value (possibly an API key) is never echoed.
			expect(error?.message).not.toContain(secret);
		});

		test('rejects an object-valued extra parameter', () => {
			expect(() =>
				buildRequest(
					fakeNode,
					'data',
					getParamFrom({ url: yt, extraParams: { parameter: [{ name: 'x', value: { a: 1 } }] } }),
				),
			).toThrow(/must be a string, number or boolean/);
		});

		test('ignores scraping additionalOptions', () => {
			const req = buildRequest(
				fakeNode,
				'data',
				getParamFrom({
					url: yt,
					additionalOptions: { js: true, proxy: 'residential', timeout: 5000, country: 'gb' },
				}),
			);
			expect(req.qs).toEqual({ url: yt, from_n8n: true });
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
