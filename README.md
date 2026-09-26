# n8n-nodes-webscraping-ai

[![npm](https://img.shields.io/npm/v/n8n-nodes-webscraping-ai.svg)](https://www.npmjs.com/package/n8n-nodes-webscraping-ai)
[![CI](https://github.com/webscraping-ai/webscraping-ai-n8n/actions/workflows/ci.yml/badge.svg)](https://github.com/webscraping-ai/webscraping-ai-n8n/actions/workflows/ci.yml)

This is an n8n community node that integrates [WebScraping.AI](https://webscraping.ai) into your n8n workflows.

WebScraping.AI provides AI-powered web scraping with Chromium JavaScript rendering, rotating datacenter/residential/stealth proxies, and built-in HTML parsing — plus LLM-powered question answering and structured field extraction on any page. This node allows you to leverage these capabilities directly in your n8n automations.

## Features

- **AI Question**: Ask questions about web page content using LLM
- **AI Extract Fields**: Extract structured data fields using AI
- **Get HTML**: Retrieve full HTML content of web pages
- **Get Text**: Extract visible text content
- **Get Selected HTML**: Extract HTML from specific CSS selectors
- **Get Multiple Selections**: Extract HTML from multiple CSS selectors
- **Get Account Info**: Retrieve account quota and usage information
- **Search (SERP)**: Get parsed Google search results for a query
- **Get Structured Data**: Get structured JSON for a page on a supported site (e.g. YouTube, TikTok, X, LinkedIn, Instagram, Reddit) from its normal URL

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### Install from npm

```bash
npm install n8n-nodes-webscraping-ai
```

### Manual Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the node
4. Copy the `dist` folder to your n8n custom nodes directory

## Prerequisites

You need to have an account with [WebScraping.AI](https://webscraping.ai) and obtain an API key from your [dashboard](https://webscraping.ai/dashboard). [Sign up](https://webscraping.ai/auth/sign_up) to get started — a free trial, no credit card required.

## Credentials

Create a new credential of type "WebScraping.AI API" in n8n and enter your API key.

## Operations

### AI Question
Ask AI a question about a webpage. The LLM will analyze the page content and provide an answer.

**Parameters:**
- URL (required): The webpage to analyze
- Question (required): The question to ask about the page
- Response Format: JSON or Text

### AI Extract Fields
Extract structured data from a webpage using AI.

**Parameters:**
- URL (required): The webpage to scrape
- Fields to Extract (required): JSON object defining fields and their descriptions
  - Example: `{"title":"Main product title","price":"Current product price"}`

### Get HTML
Get the full HTML content of a webpage.

**Parameters:**
- URL (required): The webpage to retrieve
- Response Format: JSON or Text
- Return Script Result: Return result of custom JavaScript execution instead of HTML

### Get Text
Get the visible text content of a webpage.

**Parameters:**
- URL (required): The webpage to retrieve
- Text Format: Plain, JSON, or XML
- Return Links: Include links in JSON response (works only with JSON format)

### Get Selected HTML
Get HTML content of selected page areas by CSS selector.

**Parameters:**
- URL (required): The webpage to retrieve
- CSS Selector: The selector for target elements
- Response Format: JSON or Text

### Get Multiple Selections
Get HTML content of multiple page areas by CSS selectors.

**Parameters:**
- URL (required): The webpage to retrieve
- CSS Selectors: Array of CSS selectors in JSON format
  - Example: `["h1", ".price", "#description"]`

### Get Account Info
Get your API account quota and usage information.

Returns:
- Email address
- Remaining API credits
- Next billing cycle reset time
- Remaining concurrent requests

### Search (SERP)
Get parsed search engine results for a query. Query-shaped rather than URL-shaped: WebScraping.AI handles proxy routing and parsing, so the scraping Advanced Options below don't apply. Priced per search (see [pricing](https://webscraping.ai/docs#serp)); failed searches are not charged.

**Parameters:**
- Query (required): The search query, e.g. `coffee machines`
- Search Options:
  - Country: Two-letter country code for search geolocation (Google `gl`, default `us`)
  - Engine: Search engine to query (currently `google`, the default)
  - Language: Two-letter language code for the results (Google `hl`, default `en`)
  - Page: Results page number, 10 results per page (default `1`)

Returns JSON with `search_parameters`, `search_information`, `organic_results` (each with `position`, `title`, `link`, `domain`, `displayed_link`, and optional `snippet`/`date`), optional `related_searches`, and `pagination`.

### Get Structured Data
Get structured JSON for a public page on a supported site from its normal URL: for example a YouTube video, channel or playlist, a TikTok video or profile, an X post or profile, a LinkedIn company, job or profile, an Instagram post, reel or profile, or a Reddit post, subreddit or user. The site (`provider`) and page kind (`type`) are detected from the URL. These are examples: more sites are added on the server over time and work with this node without an update, so the node never checks the URL itself. An unsupported URL or page type returns a 400 that is not charged. Its message lists what is supported. For other sites, use AI Extract Fields. Priced per site (see [pricing](https://webscraping.ai/docs#data)), including pages that parse empty (`parse_failed`) or no longer exist (`not_found`); unsupported URLs and failed fetches are not charged. The scraping Advanced Options below don't apply.

**Parameters:**
- URL (required): The page's normal URL, e.g. `https://www.youtube.com/watch?v=dQw4w9WgXcQ`. Surrounding whitespace is trimmed; otherwise it is sent unchanged.
- Country: Two-letter country code of the proxy used to fetch the page, `us` by default.
- Transcript: YouTube videos only. Also fetch the video's transcript into `data.transcript`. It's null when no matching captions are available. If the transcript fetch itself fails, the whole request fails with a 500 and is not charged.
- Transcript Language: Caption language to pick, e.g. `en` or `de`. Without it, English is preferred, then the first available track. If the video has no captions in that language, `data.transcript` is null.
- Extra Parameters: Name/value pairs sent to the API as-is, for site-specific parameters added after this node version. `url`, `api_key`, a name that repeats one of the fields above, or a name used in two rows is an error.

Returns JSON with `request_parameters` (`url`, `provider`, `type`), `parse_status` (`ok`, `parse_failed` or `not_found`) and `data`, whose snake_case fields depend on `provider` and `type` (`data` can be `null`).

## Advanced Options

All URL-based scraping operations support these advanced options:

### Browser & Rendering
- **Enable JavaScript**: Execute on-page JavaScript (default: true)
- **JavaScript Timeout**: Max JS rendering time in ms (default: 2000)
- **Wait For Selector**: CSS selector to wait for before returning content
- **Custom JavaScript**: Execute custom JavaScript code on the page
- **Device**: Desktop, Mobile, or Tablet emulation

### Proxy Settings
- **Proxy Type**: Datacenter or Residential
- **Country**: Select proxy country (US, GB, DE, IT, FR, CA, ES, RU, JP, KR, IN)
- **Custom Proxy**: Use your own proxy in "http://user:password@host:port" format

### Request Configuration
- **Headers**: Custom HTTP headers as JSON object
- **Timeout**: Max page retrieval time in ms (default: 10000, max: 30000)
- **Error on 404**: Return error on 404 status
- **Error on Redirect**: Return error on redirects

## Usage Examples

### Extract Product Data from E-commerce Site

1. Add WebScraping.AI node to your workflow
2. Select "AI Extract Fields" operation
3. Enter product URL
4. Set Fields to Extract:
```json
{
  "title": "Product title",
  "price": "Current price",
  "description": "Product description",
  "rating": "Product rating",
  "availability": "In stock or out of stock"
}
```

### Monitor Website Content Changes

1. Use "Get Text" operation with JSON format
2. Store the result in a database
3. Schedule the workflow to run periodically
4. Compare new results with previous ones to detect changes

### Scrape Google Search Results

1. Use "Search (SERP)" operation
2. Enter the search query (e.g., `coffee machines`)
3. Optionally set Country, Language, and Page under Search Options
4. Split out `organic_results` to process each result (`position`, `title`, `link`, `snippet`)

### Get YouTube Video Details and Transcript

1. Use "Get Structured Data" operation
2. Enter the video URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
3. Turn on Transcript to also get `data.transcript`
4. Read `data.title`, `data.views`, `data.channel` and so on from the output

## Error Handling

The node handles the following error scenarios:

- **400**: Parameter validation errors - Check your input parameters
- **402**: Billing/quota exceeded - Check your account balance
- **403**: Invalid API key - Verify your credentials
- **429**: Rate limiting - Reduce request frequency
- **500**: Target page errors - The target website returned an error
- **504**: Timeout errors - Increase timeout parameter

Enable "Continue on Fail" in the node settings to handle errors gracefully in your workflow.

## Live smoke test (development)

`scripts/smoke.ts` sends one live API request for each of the 9 operations on `https://example.com` (the SERP operation searches for "coffee machines"; Get Structured Data fetches `https://www.youtube.com/watch?v=dQw4w9WgXcQ`), plus one Get Structured Data request on `https://example.com/` that must come back as the server's 400 with a message containing `Unsupported URL`, proving the node has no client-side site filter. Each request is built by the node's real `buildRequest` helper. The script then adds `api_key` to the query string, as the credential does, and encodes the query string the way n8n's `httpRequest` helper does with the `arrayFormat: 'repeat'` that `buildRequest` sets: arrays go out as repeated keys (`selectors=h1&selectors=p`; the API ignores bracketed `selectors[0]=` arrays), objects as bracketed keys (`fields[title]=...`, `headers[X-Foo]=...`). It checks results, not just status codes: SERP must return non-empty `organic_results` with `search_parameters.q` matching the query, Get Structured Data must return `parse_status` `ok`, `request_parameters.provider` `youtube` and a non-empty `data.title`, Selected Multiple must return at least one non-empty inner array (the API answers mis-encoded selectors with `[[]]`), AI Fields a non-empty object, and the rest a non-empty body. It prints `ok`/`FAIL` for each operation (never the API key) and exits non-zero if any operation fails. An optional `WEBSCRAPING_AI_API_URL` overrides the base URL and must include the scheme (`http://` or `https://`).

```bash
WEBSCRAPING_AI_API_KEY=your-key npm run smoke
```

It uses real credits: about 46 per run (page operations run with `js: false` and the `datacenter` proxy, so HTML/Text/Selected/Selected Multiple cost 1 each, AI Question/AI Fields 6 each, and the SERP and YouTube structured-data calls 15 each; the unsupported-URL call is free). The script is compiled with `tsc -p tsconfig.smoke.json` into `.smoke/`, which is gitignored. It isn't part of `dist/` or the npm package, and it sits outside the `nodes/` and `credentials/` paths that lint and the n8n community-package scanner check.

## Resources

- [WebScraping.AI](https://webscraping.ai) — features, pricing, signup
- [WebScraping.AI Documentation](https://webscraping.ai/docs)
- [API Reference](https://webscraping.ai/api)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)
- Other official clients: [Python](https://github.com/webscraping-ai/webscraping-ai-python) · [JavaScript](https://github.com/webscraping-ai/webscraping-ai-js) · [Ruby](https://github.com/webscraping-ai/webscraping-ai-ruby) · [PHP](https://github.com/webscraping-ai/webscraping-ai-php) · [Go](https://github.com/webscraping-ai/webscraping-ai-go) · [Java](https://github.com/webscraping-ai/webscraping-ai-java) · [.NET](https://github.com/webscraping-ai/webscraping-ai-dotnet) · [CLI](https://github.com/webscraping-ai/webscraping-ai-cli) · [MCP server](https://github.com/webscraping-ai/webscraping-ai-mcp-server)

## License

[MIT](LICENSE.md)

## Support

For issues related to this n8n node, please open an issue on [GitHub](https://github.com/webscraping-ai/webscraping-ai-n8n/issues).

For WebScraping.AI API issues, contact [support@webscraping.ai](mailto:support@webscraping.ai).
