# Skill: Linear Plugin

**Name:** LinearIssuesNode  
**Version:** 1.0.0  
**npm package:** linear-issues-plugin-flow-requests  
**CDN (browser, after publishing):** https://unpkg.com/linear-issues-plugin-flow-requests@1.0.0/dist/bundle.js  
**CDN (server, after publishing):** https://unpkg.com/linear-issues-plugin-flow-requests@1.0.0/dist/deno-bundle.js  
**Library name:** LinearIssuesNode

---

## Description

Uses Linear's GraphQL API to list projects and issue labels, as well as list or search issues. Every operation returns a paginated collection for downstream Flow Requests nodes.

## When to use this plugin

- List issues for a Linear team or workflow status.
- Find issues matching a text query.
- Fetch issues assigned to a particular Linear user's email address.
- List Linear projects with their status, dates, and teams.
- List workspace issue labels with their color and team.
- Pass issue identifiers, URLs, or issue data into later workflow steps.

## Node properties (settings)

| Property name | Type | Required | Description |
|---|---|---:|---|
| `operation` | select | yes | Select `issues`, `projects`, or `labels`; defaults to `issues`. |
| `apiKey` | text | yes | Linear personal API key. Prefer `{{ this.state.envData.LINEAR_API_KEY }}`. |
| `query` | text | no | Issue text search; selects Linear's `issueSearch` operation when non-empty. Applies only to `issues`. |
| `teamKey` | text | no | Issue team-key filter, for example `ENG`. Applies only to `issues`. |
| `statusName` | text | no | Issue workflow status name filter, for example `In Progress`. |
| `assigneeEmail` | text | no | Issue assignee email filter. |
| `limit` | text | no | Page size for any operation, from 1 through 250. Defaults to `50`. |
| `after` | text | no | Optional cursor for any operation, from the previous result's `data.pageInfo.endCursor`. |

All string settings support `{{ }}` expressions.

## Output shape

Success for issue listing:

```json
{
  "ok": true,
  "data": {
    "issues": [],
    "pageInfo": { "hasNextPage": false, "endCursor": null }
  }
}
```

Each issue includes `id`, `identifier`, `title`, `description`, `url`, `priority`, `estimate`, `createdAt`, `updatedAt`, `dueDate`, `state`, `assignee`, `team`, `project`, and `labels`.

Project listing returns `data.projects`; each project includes `id`, `name`, `description`, `url`, `state`, `progress`, `startDate`, `targetDate`, timestamps, and `teams`. Label listing returns `data.labels`; each label includes `id`, `name`, `color`, `description`, and `team`. Both also include the same `data.pageInfo` pagination fields.

Failure:

```json
{ "ok": false, "error": "Linear API error: ..." }
```

## How to reference output in downstream nodes

- `{{ this.state.steps.<nodeName>.output.data.issues }}` — returned issue array.
- `{{ this.state.steps.<nodeName>.output.data.projects }}` — returned project array when `operation` is `projects`.
- `{{ this.state.steps.<nodeName>.output.data.labels }}` — returned label array when `operation` is `labels`.
- `{{ this.state.steps.<nodeName>.output.data.issues[0].identifier }}` — first issue identifier.
- `{{ this.state.steps.<nodeName>.output.data.pageInfo.endCursor }}` — cursor for the next page.
- `{{ this.state.steps.<nodeName>.output.data.pageInfo.hasNextPage }}` — whether another page is available.

## Example flow snippet

```json
{
  "type": "LinearIssuesNode",
  "name": "listEngineeringIssues",
  "setting": {
    "apiKey": "{{ this.state.envData.LINEAR_API_KEY }}",
    "operation": "issues",
    "teamKey": "ENG",
    "statusName": "In Progress",
    "limit": "25"
  }
}
```

To retrieve another page, set `after` to `{{ this.state.steps.listEngineeringIssues.output.data.pageInfo.endCursor }}`.

Set `operation` to `projects` or `labels` to retrieve those collections instead. Issue search and its team, status, and assignee filters do not apply to projects or labels.

## Constraints and caveats

- The Linear API key is sent in the `Authorization` header. Store it in environment data rather than hard-coding it in the flow.
- A request returns no more than 250 records; use the cursor for subsequent requests.
- `teamKey`, `statusName`, and `assigneeEmail` are exact-match filters for the `issues` operation only.
- The package and CDN URLs above become usable after the plugin is published or its bundles are hosted.
