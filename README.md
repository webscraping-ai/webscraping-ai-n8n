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

You need to have an account with [WebScraping.AI](https://webscraping.ai) and obtain an API key from your [dashboard](https://webscraping.ai/dashboard). [Sign up](https://webscraping.ai/auth/sign_up) to get started — the free trial includes 2,000 credits, no credit card required.

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

## Advanced Options

All scraping operations support these advanced options:

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

1. Use "Get Selected HTML" operation
2. Enter Google search URL
3. Use CSS selector for search results (e.g., ".g")
4. Extract and process the results

## Error Handling

The node handles the following error scenarios:

- **400**: Parameter validation errors - Check your input parameters
- **402**: Billing/quota exceeded - Check your account balance
- **403**: Invalid API key - Verify your credentials
- **429**: Rate limiting - Reduce request frequency
- **500**: Target page errors - The target website returned an error
- **504**: Timeout errors - Increase timeout parameter

Enable "Continue on Fail" in the node settings to handle errors gracefully in your workflow.

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
