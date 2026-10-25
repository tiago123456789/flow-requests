# SerpApi Plugin

Search through SerpApi and return structured search results in a Flow Requests
workflow. The node supports SerpApi's different engines through an engine
identifier and accepts additional engine-specific parameters as JSON.

## Library name

Use this exact value as the **Library Name** when installing the plugin in Flow
Requests:

```
SerpApiPlugin
```

- npm package: `serpapi-plugin-flow-requests`
- CDN (browser): https://unpkg.com/serpapi-plugin-flow-requests@1.0.0/dist/bundle.js
- CDN (server): https://unpkg.com/serpapi-plugin-flow-requests@1.0.0/dist/deno-bundle.js

The package is not published yet; build the bundles locally or publish it before
using these CDN URLs.

## Installation

1. Build the plugin: `npm install && npm run build`
2. Host `dist/bundle.js` at a URL accessible to Flow Requests.
3. In Flow Requests, open **Install Custom Plugins**.
4. Paste the browser bundle URL and enter the library name `SerpApiPlugin`.
5. Click **Install**.

## Configuration

| Setting | Type | Required | Default | Description |
|---|---|---|---|---|
| `apiKey` | text | yes | — | SerpApi API key. Store it in an environment variable and use `{{ state.envData.SERPAPI_API_KEY }}`. |
| `query` | text | yes | — | Search query (`q` parameter). Supports Flow Requests expressions. |
| `engine` | text | no | `google` | SerpApi engine identifier, such as `google`, `bing`, `youtube`, or `google_news`. |
| `parameters` | textarea | no | — | Optional JSON object of additional parameters supported by the selected engine. |

Example additional parameters for Google:

```json
{
  "location": "Austin, Texas",
  "hl": "en",
  "gl": "us",
  "start": 10
}
```

The node manages `api_key`, `engine`, `q`, and `output`; these fields cannot be
overridden in `parameters`. Additional parameter values must be strings,
numbers, booleans, or `null` (null values are omitted). String values support
Flow Requests expressions.

## Output

On success, `data` contains the full SerpApi JSON response. Depending on the
engine, fields may include `organic_results`, `search_information`, and
`pagination`.

```json
{ "ok": true, "data": { "organic_results": [] } }
```

On API, HTTP, or network failure:

```json
{ "ok": false, "error": "Invalid API key", "status": 401 }
```

Reference results in downstream nodes, for example:
`{{ steps.search.output.data.organic_results }}`.

## Example

```json
{
  "type": "SerpApiPlugin",
  "name": "searchWeb",
  "setting": {
    "apiKey": "{{ state.envData.SERPAPI_API_KEY }}",
    "query": "Flow Requests workflow automation",
    "engine": "google",
    "parameters": "{\"hl\":\"en\",\"gl\":\"us\"}"
  }
}
```

## Development

- `npm install` — install dependencies
- `npm test` — run unit tests
- `npm run build` — produce `dist/bundle.js` and `dist/deno-bundle.js`

## Caveats

- SerpApi usage is subject to your account's plan, credits, and rate limits.
- Keep the API key in an environment variable. SerpApi requires it as a query
  parameter for API requests.
- Supported parameters vary by engine; see the [SerpApi search API
  documentation](https://serpapi.com/search-api) for the selected engine.

See `skill.md` for the machine-readable description used by AI agents.
