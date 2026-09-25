# Changelog

## 1.1.0

- New **Search (SERP)** operation calling the `/serp` endpoint: required Query plus Country (`gl`), Engine (`google`), Language (`hl`), and Page options. Returns parsed Google results as JSON. The scraping Additional Options (JS, proxy, country, headers, etc.) are not shown for this operation.
- Fix **Selected Multiple** always returning `[[]]`: n8n's default query encoding sent `selectors[0]=h1&selectors[1]=p`, which the API silently ignores. Arrays are now sent as repeated keys (`selectors=h1&selectors=p`).
- Dev smoke script (`npm run smoke`, not shipped): validates `WEBSCRAPING_AI_API_URL` up front (a scheme-less URL used to make fetch print the full request URL, API key included), redacts the key and any `api_key=...` from every printed line, and checks results: SERP needs non-empty `organic_results` and a matching `search_parameters.q`, AI Fields a non-empty object. Cost estimate corrected to ~31 credits.

## 1.0.3

- Distinct dark-theme icon variant (community-node scanner requirement).

## 1.0.2

- Fixes for n8n community-node scanner verification: themed credential/node icons, `usableAsTool: true`, `NodeOperationError` for user-input errors.

## 1.0.0

- Initial release: AI Question, AI Extract Fields, Get HTML, Get Text, Get Selected HTML, Get Multiple Selections, Get Account Info.
