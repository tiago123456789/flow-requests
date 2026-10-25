# Skill: GitHub Upload Plugin

**Name:** GitHubUploadPlugin  
**Version:** 1.0.0  
**npm package:** github-upload-plugin-flow-requests  
**CDN (browser):** https://unpkg.com/github-upload-plugin-flow-requests@1.0.0/dist/bundle.js  
**CDN (server):** https://unpkg.com/github-upload-plugin-flow-requests@1.0.0/dist/deno-bundle.js  
**Library name:** GitHubUploadPlugin

---

## Description

Uploads a Base64 data URL attachment to a GitHub repository. It creates a missing repository as public and changes an existing private repository to public so the resulting raw download link is accessible without GitHub authentication. The file is named using the UTC upload timestamp and an extension inferred from the data URL MIME type.

## When to use this plugin

- Store a file received by a Flow Requests webhook in a GitHub repository.
- Return a public direct download URL for a request attachment.

## Node properties (settings)

| Property name | Type | Required | Description |
|---|---|---:|---|
| `token` | text | yes | GitHub personal access token with account read, repository creation/administration, and contents write permissions. Prefer `{{ this.state.envData.GITHUB_TOKEN }}`. |
| `repositoryName` | text | yes | Repository name to create or use. |
| `owner` | text | no | User or organization owner. Defaults to the authenticated user. |
| `attachment` | text | yes | Base64 data URL, defaults to `{{ this.state.request.body.attachment }}`. Accepts standard or URL-safe Base64 payload characters. |

The request may look like:

```json
{
  "fullName": "Ana Silva",
  "attachment": "data:text/plain;base64,SGVsbG8gV29ybGQh"
}
```

`fullName` is not used for the uploaded filename. The filename is a UTC timestamp with milliseconds and an inferred extension, e.g. `2026-10-24T12-30-45-123Z.txt`.

## Output shape

Success:

```json
{
  "ok": true,
  "data": {
    "owner": "ana",
    "repositoryName": "customer-files",
    "repositoryUrl": "https://github.com/ana/customer-files",
    "fileName": "2026-10-24T12-30-45-123Z.txt",
    "branch": "main",
    "downloadUrl": "https://raw.githubusercontent.com/ana/customer-files/main/2026-10-24T12-30-45-123Z.txt",
    "fileUrl": "https://github.com/ana/customer-files/blob/main/2026-10-24T12-30-45-123Z.txt",
    "repositoryCreated": true,
    "repositoryMadePublic": false
  }
}
```

Failure: `{ "ok": false, "error": "..." }`.

## How to reference output in downstream nodes

- `{{ steps.githubUpload.output.data.downloadUrl }}` — direct public download URL.
- `{{ steps.githubUpload.output.data.fileName }}` — generated timestamped filename.
- `{{ steps.githubUpload.output.data.repositoryUrl }}` — repository URL.

## Example flow snippet

```json
{
  "type": "GitHubUploadPlugin",
  "name": "githubUpload",
  "setting": {
    "token": "{{ this.state.envData.GITHUB_TOKEN }}",
    "repositoryName": "customer-files",
    "attachment": "{{ this.state.request.body.attachment }}"
  }
}
```

## Constraints and caveats

- The token needs permission to read the authenticated account, create repositories, change repository visibility, and write file contents.
- A private repository is made public when this plugin uses it. Existing repository contents become public too.
- Public download links do not require GitHub authentication; newly uploaded content may take a short time to become available via raw.githubusercontent.com.
- Keep GitHub credentials on the server-side runner when they must not be exposed to browser users.
