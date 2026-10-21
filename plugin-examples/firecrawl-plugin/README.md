# Firecrawl Plugin

Scrapes any URL with the [Firecrawl](https://firecrawl.dev) v2 API and returns
its content as markdown, HTML, raw HTML, links, or a screenshot.

## What it is

This plugin turns a web page into structured, LLM-friendly content. You give it
a URL and pick an output format; Firecrawl handles rendering, JavaScript-heavy
pages, anti-bot protection, and extraction. The scraped content is returned in
`data.result` together with page metadata, so downstream nodes can consume it.

Use it whenever a flow needs to read a web page, extract links, or capture a
screenshot.

## Library name

Use this exact value as the **Library Name** when installing the plugin in
Flow Requests:

```
FirecrawlPlugin
```

- npm package: `firecrawl-plugin-flow-requests`
- CDN (browser): https://unpkg.com/firecrawl-plugin-flow-requests@1.1.0/dist/bundle.js
- CDN (server): https://unpkg.com/firecrawl-plugin-flow-requests@1.1.0/dist/deno-bundle.js

## Installation

1. Build the plugin: `npm install && npm run build`
2. In Flow Requests, open **Install Custom Plugins**.
3. Paste the CDN URL to `dist/bundle.js`.
4. Enter the library name `FirecrawlPlugin`.
5. Click **Install**.

## Configuration

| Setting | Type | Required | Default | Description |
|---|---|---|---|---|
| `apiKey` | text | yes | — | Firecrawl API key. Store in env and use `{{ state.envData.FIRECRAWL_API_KEY }}`. |
| `url` | text | yes | — | The URL to scrape. Supports `{{ }}` expressions. |
| `format` | select | yes | `markdown` | Output format: `markdown`, `html`, `rawHtml`, `links`, or `screenshot`. |
| `onlyMainContent` | select | no | `true` | When yes, strips headers, nav bars, and footers. |
| `waitFor` | text | no | `0` | Extra milliseconds to wait before fetching (max 60000). Useful for SPAs. |
| `timeout` | text | no | `60000` | Request timeout in ms (1000–300000). |
| `proxy` | select | no | `auto` | Proxy strategy: `auto`, `basic`, or `enhanced`. |
| `mobile` | select | no | `false` | Emulate a mobile device. |
| `excludeTags` | text | no | — | Comma-separated HTML tags to exclude, e.g. `script,style,img`. |

## Output

Success — the requested format is in `data.result`, page info in
`data.metadata`, and any warning in `data.warning`:

```json
{ "ok": true, "data": { "result": "...", "metadata": { "title": "..." }, "warning": null } }
```

Failure:
```json
{ "ok": false, "error": "Unauthorized", "code": "UNAUTHORIZED" }
```

## Example

Scrape a page as markdown:

```json
{
  "type": "FirecrawlPlugin",
  "name": "scrapePage",
  "setting": {
    "apiKey": "{{ state.envData.FIRECRAWL_API_KEY }}",
    "url": "https://example.com",
    "format": "markdown",
    "onlyMainContent": "true"
  }
}
```

## Development

- `npm install` — install dependencies
- `npm test` — run unit tests
- `npm run build` — produce `dist/bundle.js` and `dist/deno-bundle.js`

## Caveats

- Usage is billed and rate-limited by Firecrawl.
- Keep the API key in an environment variable.
- `screenshot` returns an image URL/reference, not text — handle it accordingly.

See `skill.md` for the machine-readable description used by AI agents.
