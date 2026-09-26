# Changelog

## 1.2.1 — 2026-09-26
- Dev dependencies updated for open Dependabot alerts (`js-yaml`, `brace-expansion`, `browserslist`, `@babel/core`, and `form-data`/`lodash`/`uuid` pinned by `n8n-workflow`). No node or credential changes; the node is now built and tested against `n8n-workflow` 2.x.

## 1.2.0 — 2026-09-25
- New **Get Structured Data** operation calling the `/data` endpoint: required URL of a page on a supported site (e.g. YouTube, TikTok, X, LinkedIn, Instagram, Reddit) plus Country, Transcript and Transcript Language, and an **Extra Parameters** list of name/value pairs sent as-is for future site-specific parameters (`url`/`api_key`, a name repeating Country/Transcript/Transcript Language, or a name used twice is an error). Returns `request_parameters` (`provider`, `type`), `parse_status` and `data` as JSON. The URL is never checked against a site list in the node: sites are added on the server, An unsupported URL or page type returns a 400 that is not charged. Its message lists what is supported. The scraping Additional Options are not shown for this operation. 15 credits per request.
- Dev smoke script: one Get Structured Data call on a YouTube video (checks `parse_status` `ok`, provider `youtube`, non-empty `data.title`) and one on `https://example.com/` that must return the server's 400 with a message containing `Unsupported URL`.
- Continue On Fail error messages now redact any `api_key=...` a transport error quotes. Cost estimate now ~46 credits.

## 1.1.0

- New **Search (SERP)** operation calling the `/serp` endpoint: required Query plus Country (`gl`), Engine (`google`), Language (`hl`), and Page options. Returns parsed Google results as JSON. The scraping Additional Options (JS, proxy, country, headers, etc.) are not shown for this operation.
- Fix **Selected Multiple** always returning `[[]]`: n8n's default query encoding sent `selectors[0]=h1&selectors[1]=p`, which the API silently ignores. Arrays are now sent as repeated keys (`selectors=h1&selectors=p`).
- Dev smoke script (`npm run smoke`, not shipped): validates `WEBSCRAPING_AI_API_URL` up front (a scheme-less URL used to make fetch print the full request URL, API key included), redacts the key and any `api_key=...` from every printed line, and checks results: SERP needs non-empty `organic_results` and a matching `search_parameters.q`, AI Fields a non-empty object. Cost estimate corrected to ~31 credits.
- Search (SERP) rejects a Page that isn't a whole number of 1 or more (expressions bypass the UI's minimum; the API would silently serve and bill page 1).

## 1.0.3

- Distinct dark-theme icon variant (community-node scanner requirement).

## 1.0.2

- Fixes for n8n community-node scanner verification: themed credential/node icons, `usableAsTool: true`, `NodeOperationError` for user-input errors.

## 1.0.0

- Initial release: AI Question, AI Extract Fields, Get HTML, Get Text, Get Selected HTML, Get Multiple Selections, Get Account Info.
