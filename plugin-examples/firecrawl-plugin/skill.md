# Skill: Firecrawl Scraper Plugin

**Name:** FirecrawlPlugin
**Version:** 1.0.0
**npm package:** firecrawl-plugin-flow-requests
**CDN (browser):** https://unpkg.com/firecrawl-plugin-flow-requests@1.0.0/dist/bundle.js
**CDN (server):** https://unpkg.com/firecrawl-plugin-flow-requests@1.0.0/dist/deno-bundle.js
**Library name:** FirecrawlPlugin

---

## Description

Scrapes the content of any publicly accessible web page using the
[Firecrawl v2 API](https://docs.firecrawl.dev/api-reference/endpoint/scrape)
(`POST https://api.firecrawl.dev/v2/scrape`).

Firecrawl handles JavaScript rendering, anti-bot proxies, and content
extraction automatically. The plugin supports five output formats:
**markdown** (clean text, ideal for LLM pipelines), **html** (cleaned HTML),
**rawHtml** (unmodified page HTML), **links** (all hrefs on the page), and
**screenshot** (base64 PNG). Page metadata (title, description, status code,
etc.) is always returned alongside the main content.

Use this node whenever a flow needs to read the content of a web page —
monitoring pages for changes, feeding scraped text into an AI node, extracting
links for crawling, or archiving page snapshots.

---

## When to use this plugin

- Extract article text or documentation from a URL and pass it to an AI node
  for summarisation or question-answering.
- Collect all links on a page to feed into a loop node for recursive crawling.
- Take a visual screenshot of a page as part of an automated QA workflow.
- Monitor a competitor page for content changes (combine with a Condition node
  checking `data.warning`).
- Scrape structured metadata (title, description, OG tags) from any URL.

---

## Node properties (settings)

| Property name    | Type     | Required | Default    | Description |
|------------------|----------|----------|------------|-------------|
| `apiKey`         | text     | yes      | —          | Firecrawl API key. Always use `{{ state.envData.FIRECRAWL_API_KEY }}`. |
| `url`            | text     | yes      | —          | URL to scrape. Supports `{{ }}` expressions. |
| `format`         | select   | yes      | `markdown` | Output format (see options below). |
| `onlyMainContent`| select   | no       | `true`     | Strip headers, navs, footers from the output. |
| `waitFor`        | text     | no       | `0`        | Extra milliseconds to wait before scraping (0–60000). |
| `timeout`        | text     | no       | `60000`    | Request timeout in milliseconds (1000–300000). |
| `proxy`          | select   | no       | `auto`     | Proxy strategy (`auto`, `basic`, `enhanced`). |
| `mobile`         | select   | no       | `false`    | Emulate a mobile device. |
| `excludeTags`    | text     | no       | —          | Comma-separated HTML tags to strip, e.g. `script,style,img`. |

### `format` options

| Value        | Description |
|--------------|-------------|
| `markdown`   | LLM-friendly markdown extracted from the page. |
| `html`       | Cleaned, parsed HTML. |
| `rawHtml`    | The raw, unmodified HTML of the page. |
| `links`      | Array of all URLs (`<a href>`) found on the page. |
| `screenshot` | Base64-encoded PNG screenshot of the visible viewport. |

### `proxy` options

| Value      | Description |
|------------|-------------|
| `auto`     | Firecrawl tries basic first; falls back to enhanced at no extra cost. |
| `basic`    | Fast proxy. Works for most standard sites. |
| `enhanced` | Slower but more reliable on sites with advanced anti-bot protection. |

---

## Output shape

Success:
```json
{
  "ok": true,
  "data": {
    "result": "<scraped content — string or array depending on format>",
    "metadata": {
      "title": "Page Title",
      "description": "Meta description",
      "sourceURL": "https://example.com",
      "statusCode": 200,
      "language": "en"
    },
    "warning": null
  }
}
```

When `format` is `"links"`, `data.result` is a `string[]` of URLs.
For all other formats, `data.result` is a `string`.

Failure:
```json
{
  "ok": false,
  "error": "Payment required to access this resource.",
  "code": "insufficient_credits"
}
```

Common error codes from Firecrawl:

| Code | Meaning |
|------|---------|
| `insufficient_credits` | API key has no remaining credits. |
| `THIRD_PARTY_DATA_TERMS_REQUIRED` | Terms of service must be accepted. |
| `duplicate_request` | Identical request submitted twice. |
| `request_unresolved` | Firecrawl could not resolve the page (503). |

---

## How to reference output in downstream nodes

```
{{ steps.scrapeNode.output.ok }}               — boolean, true on success
{{ steps.scrapeNode.output.data.result }}      — the scraped content
{{ steps.scrapeNode.output.data.metadata.title }}  — page title
{{ steps.scrapeNode.output.data.metadata.statusCode }} — HTTP status of scraped page
{{ steps.scrapeNode.output.error }}            — error message on failure
{{ steps.scrapeNode.output.code }}             — Firecrawl error code on failure
```

When using `format: "links"`, iterate with a Loop node over
`{{ steps.scrapeNode.output.data.result }}`.

---

## Example flow snippet

Scrape a URL stored in an environment variable and pass the markdown to an
AI node:

```json
{
  "type": "FirecrawlPlugin",
  "name": "scrapePage",
  "setting": {
    "apiKey": "{{ state.envData.FIRECRAWL_API_KEY }}",
    "url": "{{ state.envData.TARGET_URL }}",
    "format": "markdown",
    "onlyMainContent": "true",
    "proxy": "auto"
  }
}
```

Extract all links from a page for further processing:

```json
{
  "type": "FirecrawlPlugin",
  "name": "collectLinks",
  "setting": {
    "apiKey": "{{ state.envData.FIRECRAWL_API_KEY }}",
    "url": "https://example.com",
    "format": "links"
  }
}
```

Scrape a URL from a previous node's output:

```json
{
  "type": "FirecrawlPlugin",
  "name": "scrapeResult",
  "setting": {
    "apiKey": "{{ state.envData.FIRECRAWL_API_KEY }}",
    "url": "{{ steps.fetchUrl.output.data.url }}",
    "format": "markdown"
  }
}
```

---

## Constraints and caveats

- **API key is sensitive** — always store it as `FIRECRAWL_API_KEY` in the
  flow's environment variables and reference it with
  `{{ state.envData.FIRECRAWL_API_KEY }}`. Never hardcode it in the node
  settings.
- **Credits** — each scrape consumes Firecrawl credits. PDF scraping costs
  1 credit per page. Screenshots and enhanced proxies may cost more.
- **`waitFor` max** — the maximum allowed value is 60 000 ms (60 seconds).
  Values above this will cause the node to throw before making any request.
- **`timeout` range** — must be between 1 000 and 300 000 ms.
- **`links` format** — `data.result` is an array, not a string. Use a Loop
  node to iterate over it rather than passing it directly to a text field.
- **`screenshot` format** — `data.result` is a base64-encoded PNG string.
  Downstream nodes that expect plain text will need to handle this explicitly.
- **Only one format per call** — this plugin sends a single format per
  request. To get both markdown and links from the same page, add two
  FirecrawlPlugin nodes.
- **`onlyMainContent`** is a deterministic HTML-level filter — no LLM is
  involved. It removes headers, navs, and footers but may occasionally strip
  relevant content on unusual page layouts.
