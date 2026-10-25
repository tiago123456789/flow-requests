# Linear Plugin

Lists and searches Linear issues, and lists projects and issue labels, in a Flow Requests workflow using Linear's GraphQL API.

## Library name

Use this exact value as the **Library Name** when installing the plugin:

```text
LinearIssuesNode
```

- npm package: `linear-issues-plugin-flow-requests`
- Browser bundle after publishing: `https://unpkg.com/linear-issues-plugin-flow-requests@1.0.0/dist/bundle.js`
- Server bundle after publishing: `https://unpkg.com/linear-issues-plugin-flow-requests@1.0.0/dist/deno-bundle.js`

This plugin is currently an unpublished example in this repository. Build and host the bundles yourself, or publish the package before using these unpkg URLs.

## Installation

1. Build the plugin with `npm install && npm run build`.
2. Host `dist/bundle.js` at a URL accessible to Flow Requests.
3. In Flow Requests, open **Install Custom Plugins**.
4. Paste the hosted bundle URL and enter the library name `LinearIssuesNode`.

## Configuration

| Setting | Type | Required | Default | Description |
|---|---|---:|---|---|
| `operation` | select | yes | `issues` | Choose `issues`, `projects`, or `labels`. |
| `apiKey` | text | yes | — | Linear personal API key. Store it as an environment variable and reference it with `{{ this.state.envData.LINEAR_API_KEY }}`. |
| `query` | text | no | — | Optional text search across issues; applies only when `operation` is `issues`. |
| `teamKey` | text | no | — | Restrict issue results to a team key, such as `ENG`; applies only to issues. |
| `statusName` | text | no | — | Restrict issue results to a workflow state name, such as `In Progress`. |
| `assigneeEmail` | text | no | — | Restrict issue results to the assignee's email address. |
| `limit` | text | no | `50` | Number of results to request for any operation, from 1 to 250. |
| `after` | text | no | — | Cursor from `data.pageInfo.endCursor` to request the next page for any operation. |

All string settings support Flow Requests expressions.

## Output

Success returns an operation-specific collection and Linear's pagination metadata. For example, issue listing returns:

```json
{
  "ok": true,
  "data": {
    "issues": [
      {
        "id": "issue-id",
        "identifier": "ENG-42",
        "title": "Fix pagination",
        "url": "https://linear.app/example/issue/ENG-42"
      }
    ],
    "pageInfo": {
      "hasNextPage": true,
      "endCursor": "cursor-value"
    }
  }
}
```

Project listing returns `data.projects`, with each project including its ID, name, description, URL, state, progress, dates, timestamps, and teams. Label listing returns `data.labels`, with each label including its ID, name, color, description, and team. All three operations return `data.pageInfo`; when `hasNextPage` is true, pass the returned `endCursor` into `after` to continue listing. Issue records include description, priority, estimate, timestamps, due date, state, assignee, team, project, and labels.

Failures return `{ "ok": false, "error": "..." }`. Missing or invalid API-key settings and an invalid result limit throw a descriptive validation error.

## Example

```json
{
  "type": "LinearIssuesNode",
  "name": "listOpenEngineeringIssues",
  "setting": {
    "apiKey": "{{ this.state.envData.LINEAR_API_KEY }}",
    "operation": "issues",
    "teamKey": "ENG",
    "statusName": "In Progress",
    "limit": "25"
  }
}
```

Use `{{ this.state.steps.listOpenEngineeringIssues.output.data.issues }}` in downstream nodes to access the issue list.

To list projects or labels, set `operation` to `projects` or `labels`. The corresponding output collections are available at `data.projects` and `data.labels`.

## Development

- `npm install` — install dependencies
- `npm test` — run unit tests
- `npm run build` — produce `dist/bundle.js` and `dist/deno-bundle.js`

See `skill.md` for the machine-readable plugin description.

## Caveats

- The API key grants access according to the Linear user's permissions. Keep it in a Flow Requests environment variable.
- Each request returns at most 250 records. Use `after` with `data.pageInfo.endCursor` to fetch another page.
- `query`, `teamKey`, `statusName`, and `assigneeEmail` apply only to issue listing; projects and labels are listed without filters.
- Team and status filters use the Linear team key and workflow state name respectively; the assignee filter uses an email address.
