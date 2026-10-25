# Skill: SerpApi Search Plugin

**Name:** SerpApiPlugin  
**Version:** 1.0.0  
**npm package:** serpapi-plugin-flow-requests  
**CDN (browser):** https://unpkg.com/serpapi-plugin-flow-requests@1.0.0/dist/bundle.js  
**CDN (server):** https://unpkg.com/serpapi-plugin-flow-requests@1.0.0/dist/deno-bundle.js  
**Library name:** SerpApiPlugin

---

## Description

Search the web and other supported sources through SerpApi. The node uses the
selected SerpApi engine (Google by default), accepts additional engine-specific
parameters, and returns the complete JSON result for use by later flow nodes.

## When to use this plugin

- Search web results as part of an automated research or monitoring flow.
- Search a SerpApi-supported engine such as Google, Bing, YouTube, or Google
  News.
- Pass search results into later nodes for filtering, summarization, or alerts.

## Node properties (settings)

| Property name | Type | Required | Description |
|---|---|---|---|
| `apiKey` | text | yes | SerpApi private API key. Prefer `{{ state.envData.SERPAPI_API_KEY }}`. |
| `query` | text | yes | Search query (`q`). Supports `{{ }}` expressions. |
| `engine` | text | no | SerpApi engine identifier. Defaults to `google`. |
| `parameters` | textarea | no | JSON object of additional engine-supported parameters. Values may be strings, numbers, booleans, or null; null values are omitted. String values support `{{ }}` expressions. |

`api_key`, `engine`, `q`, and `output` are managed by the node and cannot be
overridden in `parameters`.

## Output shape

Success returns the full SerpApi JSON response in `data`:

```json
{
  "ok": true,
  "data": {
    "organic_results": [],
    "search_information": {}
  }
}
```

The response fields depend on the chosen engine. API, HTTP, and network errors
return `{ "ok": false, "error": "..." }`; HTTP/API responses also include
`status`.

## How to reference output in downstream nodes

- `{{ steps.searchWeb.output.data.organic_results }}` — organic results when
  returned by the selected engine.
- `{{ steps.searchWeb.output.data.search_information }}` — search metadata when
  returned by the selected engine.
- `{{ steps.searchWeb.output.ok }}` — success flag.

## Example flow snippet

```json
{
  "type": "SerpApiPlugin",
  "name": "searchWeb",
  "setting": {
    "apiKey": "{{ state.envData.SERPAPI_API_KEY }}",
    "query": "Flow Requests workflow automation",
    "engine": "google",
    "parameters": "{\"hl\":\"en\",\"gl\":\"us\",\"start\":0}"
  }
}
```

## Constraints and caveats

- Set `engine` to an engine identifier supported by SerpApi. Parameter support
  differs across engines; check SerpApi's search API documentation.
- `parameters` must be valid JSON whose top-level value is an object.
- SerpApi requires the API key in the request query string. Use a Flow Requests
  environment variable rather than hard-coding it in a flow.
- Usage is subject to the SerpApi account's plan, credits, and rate limits.
