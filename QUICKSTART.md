# Quick Start Guide - WebScraping.AI n8n Node

## Prerequisites

- n8n installed (local or cloud)
- WebScraping.AI API key ([Get one here](https://webscraping.ai/dashboard))

## Installation

### Option 1: From npm (After Publishing)

```bash
npm install n8n-nodes-webscraping-ai
```

### Option 2: Local Development

```bash
cd /Users/drakula2k/projects/webscraping-ai-n8n
npm install
npm run build
npm link
cd ~/.n8n
npm link n8n-nodes-webscraping-ai
```

Restart n8n after installation.

## Setup Credentials

1. In n8n, go to **Settings** → **Credentials**
2. Click **Add Credential**
3. Search for **WebScraping.AI API**
4. Enter your API key from https://webscraping.ai/dashboard
5. Click **Save**

## Basic Examples

### Example 1: Get HTML from a Website

1. Add **WebScraping.AI** node to your workflow
2. Select **Get HTML** operation
3. Enter URL: `https://example.com`
4. Connect credentials
5. Execute

### Example 2: Extract Product Data with AI

1. Add **WebScraping.AI** node
2. Select **AI Extract Fields** operation
3. Enter product URL
4. Set Fields to Extract:
```json
{
  "title": "Product name",
  "price": "Current price",
  "rating": "Product rating out of 5",
  "availability": "In stock or out of stock"
}
```
5. Execute

### Example 3: Ask AI About a Webpage

1. Add **WebScraping.AI** node
2. Select **AI Question** operation
3. Enter URL: `https://news.ycombinator.com`
4. Enter Question: `What are the top 3 trending topics?`
5. Execute

### Example 4: Extract Specific Elements

1. Add **WebScraping.AI** node
2. Select **Get Selected HTML** operation
3. Enter URL
4. Enter CSS Selector: `.article-title`
5. Execute

### Example 5: Monitor Content Changes

1. Add **Schedule Trigger** node (every hour)
2. Add **WebScraping.AI** node with Get Text operation
3. Add **Compare** node to check if content changed
4. Add **Send Email** node to notify on changes

## Workflow Ideas

### E-commerce Price Monitoring
```
Schedule Trigger → WebScraping.AI (AI Extract Fields) →
Compare with Database → Send Alert if Price Changed
```

### Content Aggregator
```
RSS Trigger → Loop over Items → WebScraping.AI (Get Text) →
Filter by Keywords → Save to Database
```

### Competitor Analysis
```
Schedule Trigger → WebScraping.AI (AI Question: "What features does this product have?") →
Store in Google Sheets → Send Weekly Report
```

### SEO Monitoring
```
Schedule Trigger → WebScraping.AI (Get Selected HTML for meta tags) →
Check Changes → Log to Database → Alert on Issues
```

## Advanced Options

### Enable JavaScript Rendering

In **Additional Options**:
- Enable JavaScript: `true`
- JavaScript Timeout: `5000` (for slow sites)

### Use Residential Proxies

In **Additional Options**:
- Proxy Type: `Residential`
- Country: `United States`

### Wait for Dynamic Content

In **Additional Options**:
- Wait For Selector: `.dynamic-content`

### Custom Headers

In **Additional Options**:
- Headers: `{"Cookie": "session_id=abc123", "User-Agent": "MyBot/1.0"}`

## Troubleshooting

### Error: "Invalid API Key"
- Check credentials are saved correctly
- Verify API key from dashboard
- Test credentials in n8n

### Error: "Timeout"
- Increase Timeout in Additional Options
- Increase JavaScript Timeout if using JS rendering
- Try residential proxy for better reliability

### Error: "Invalid JSON"
- Check Fields parameter is valid JSON
- Use JSON validator to verify format
- Don't include trailing commas

### Empty Response
- Check URL is accessible
- Enable JavaScript if page uses JS
- Add Wait For Selector for dynamic content
- Verify CSS selectors are correct

## Tips & Best Practices

1. **Start Simple**: Test with Get HTML first, then move to AI features
2. **Use Wait For Selector**: For reliable scraping of dynamic content
3. **Check Account Quota**: Use Get Account Info to monitor usage
4. **Handle Errors**: Enable "Continue on Fail" for production workflows
5. **Test Selectors**: Use browser DevTools to verify CSS selectors
6. **Optimize Costs**:
   - Use datacenter proxies when possible (cheaper)
   - Disable JS rendering if not needed
   - Cache results when appropriate

## Rate Limits

- Check your plan limits at https://webscraping.ai/pricing
- Use Get Account Info operation to monitor remaining credits
- Add delays between requests in loops to avoid rate limiting

## Support

- **n8n Node Issues**: Open issue on GitHub
- **API Questions**: support@webscraping.ai
- **Documentation**: https://webscraping.ai/docs

## Next Steps

1. Explore all 7 operations
2. Combine with other n8n nodes (databases, APIs, notifications)
3. Build production workflows
4. Monitor quota and adjust plan as needed

Happy scraping! 🚀
