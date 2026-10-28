# Changelog

## 1.4.0 — 2026-10-28
- **Node version 2** groups the 10 operations under resources: Web Page (Get HTML, Get Text, Get Selected HTML, Get Multiple Selections), AI (Ask Question, Extract Fields), Search (Search Google, Get Locations), Structured Data (Get) and Account (Get). New nodes get version 2. Existing workflows stay on version 1 and behave exactly as before. Fields, options and output are the same in both versions.
- Search Locations' Limit now defaults to 50, per n8n's convention for Limit fields, and a value above 10 is sent as 10, the API's maximum (it used to return a 400). Workflows that left Limit at its old default of 10 still get up to 10 locations.
- Get Multiple Selections' CSS Selectors is now marked required (it always was for the API).
- Tooling: built and linted with n8n's `@n8n/node-cli` (`n8n-node build/lint/dev/release`) in strict mode, replacing the gulp/ESLint 8 starter setup; passes n8n's community-package scanner. Releases still publish from GitHub Actions with npm provenance, now through `n8n-node release`. Tests moved to `test/`. Dev tooling needs Node.js 24; the published package still has no dependencies. Removed the `form-data` override: n8n's scanner rejects `overrides` in community packages, and it only patched the dev tree.
- Dev smoke script: Get Selected HTML selects `p`, because https://example.com no longer has an `h1`.

## 1.3.0 — 2026-10-24
- **Search (SERP)** gains Location, Latitude, Longitude, UULE, Radius (Meters) and Pages options. Every search runs from one fixed location (Location, Latitude and Longitude, or UULE; otherwise the capital of the Country), so repeats and later pages stay consistent, and Country now defaults to the location's country. Pages fetches up to 5 consecutive pages as one de-duplicated list (`position` counts through it, each result gets `page`), billed per results page returned (see https://webscraping.ai/docs#serp). Pages and Radius must be whole numbers of 1 or more. Latitude/Longitude must be a number or a plain decimal string from an expression (e.g. `"30.2672"` from a sheet); a blank or non-numeric value is an error rather than a search from 0, so leave the option out when there is no value. Latitude/Longitude go out as plain decimals with at most 7 fraction digits (`0.0000001`, never `1e-7`). Combinations and ranges are checked by the API (a 400 that is not charged). Page, Pages, Radius and Search Locations' Limit accept numeric strings from expressions (e.g. `"2"`), which n8n converts to numbers.
- New **Search Locations** operation calling `/serp/locations`: optional Query (part of an English location name, e.g. `austin`) and Limit (1–10). Returns one item per location (`id`, `name`, `canonical_name`, `country_code`, `target_type`, `reach`, `gps` as `[longitude, latitude]`); pass `canonical_name` or `id` as Search (SERP)'s Location. Free, no credits used.
- Docs: stop stating credit prices (they're set server-side and change); link to https://webscraping.ai/docs pricing instead.
- Dev smoke script: one Search (SERP) call with Location `Austin, TX` and Pages 2 (checks `search_parameters.location_used` contains `Austin` and non-empty `organic_results`) and one Search Locations call for `austin` (checks the first `canonical_name` contains `Austin`).

## 1.2.1 — 2026-09-26
- Dev dependencies updated for open Dependabot alerts (`js-yaml`, `brace-expansion`, `browserslist`, `@babel/core`, and the `form-data` that `n8n-workflow` pins). No node or credential changes. The dev copy of `n8n-workflow` is now pinned to 1.120.14: newer versions pull in `isolated-vm`, a native module that needs Node 24 to build.

## 1.2.0 — 2026-09-25
- New **Get Structured Data** operation calling the `/data` endpoint: required URL of a page on a supported site (e.g. YouTube, TikTok, X, LinkedIn, Instagram, Reddit) plus Country, Transcript and Transcript Language, and an **Extra Parameters** list of name/value pairs sent as-is for future site-specific parameters (`url`/`api_key`, a name repeating Country/Transcript/Transcript Language, or a name used twice is an error). Returns `request_parameters` (`provider`, `type`), `parse_status` and `data` as JSON. The URL is never checked against a site list in the node: sites are added on the server, An unsupported URL or page type returns a 400 that is not charged. Its message lists what is supported. The scraping Additional Options are not shown for this operation. Priced per site (see https://webscraping.ai/docs#data).
- Dev smoke script: one Get Structured Data call on a YouTube video (checks `parse_status` `ok`, provider `youtube`, non-empty `data.title`) and one on `https://example.com/` that must return the server's 400 with a message containing `Unsupported URL`.
- Continue On Fail error messages now redact any `api_key=...` a transport error quotes.

## 1.1.0

- New **Search (SERP)** operation calling the `/serp` endpoint: required Query plus Country (`gl`), Engine (`google`), Language (`hl`), and Page options. Returns parsed Google results as JSON. The scraping Additional Options (JS, proxy, country, headers, etc.) are not shown for this operation.
- Fix **Selected Multiple** always returning `[[]]`: n8n's default query encoding sent `selectors[0]=h1&selectors[1]=p`, which the API silently ignores. Arrays are now sent as repeated keys (`selectors=h1&selectors=p`).
- Dev smoke script (`npm run smoke`, not shipped): validates `WEBSCRAPING_AI_API_URL` up front (a scheme-less URL used to make fetch print the full request URL, API key included), redacts the key and any `api_key=...` from every printed line, and checks results: SERP needs non-empty `organic_results` and a matching `search_parameters.q`, AI Fields a non-empty object.
- Search (SERP) rejects a Page that isn't a whole number of 1 or more (expressions bypass the UI's minimum; the API would silently serve and bill page 1).

## 1.0.3

- Distinct dark-theme icon variant (community-node scanner requirement).

## 1.0.2

- Fixes for n8n community-node scanner verification: themed credential/node icons, `usableAsTool: true`, `NodeOperationError` for user-input errors.

## 1.0.0

- Initial release: AI Question, AI Extract Fields, Get HTML, Get Text, Get Selected HTML, Get Multiple Selections, Get Account Info.
