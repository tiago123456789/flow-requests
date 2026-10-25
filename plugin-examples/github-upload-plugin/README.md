# GitHub Upload Plugin

Uploads a Base64 data URL received in a Flow Requests request to a public GitHub repository and returns a direct download URL. Repositories that do not exist are created; existing private repositories are made public before the upload so the resulting link can be accessed publicly.

## Library name

Use this exact value as the **Library Name** when installing the plugin in Flow Requests:

```
GitHubUploadPlugin
```

- npm package: `github-upload-plugin-flow-requests`
- CDN (browser): `https://unpkg.com/github-upload-plugin-flow-requests@1.0.0/dist/bundle.js`
- CDN (server): `https://unpkg.com/github-upload-plugin-flow-requests@1.0.0/dist/deno-bundle.js`

The package/CDN URLs become available after publishing the package.

## Installation

1. Build the plugin with `npm install && npm run build`.
2. Publish the package or host its generated `dist` bundles at a public URL.
3. In Flow Requests, open **Install Custom Plugins**.
4. Enter the browser bundle URL and library name `GitHubUploadPlugin`.

## Configuration

| Setting | Type | Required | Description |
|---|---|---:|---|
| `token` | text | yes | GitHub personal access token. Use an environment variable expression rather than entering a token directly. |
| `repositoryName` | text | yes | Repository to upload to. Created as public if it does not exist. |
| `owner` | text | no | GitHub user or organization that owns the repository. Defaults to the account associated with the token. |
| `attachment` | text | yes | Base64 data URL. Defaults to `{{ this.state.request.body.attachment }}`. |

Example request body:

```json
{
  "fullName": "Ana Silva",
  "attachment": "data:text/plain;base64,SGVsbG8gV29ybGQh"
}
```

The plugin uses the attachment’s MIME type to infer the extension (`text/plain` becomes `.txt`, `image/jpeg` becomes `.jpg`, etc.). It names the file with the UTC timestamp at upload time, including milliseconds, for example `2026-10-24T12-30-45-123Z.txt`. `fullName` is not used as the filename.

The attachment can use standard Base64 or URL-safe Base64 (`-` and `_` characters). It must be a Base64 data URL containing a `;base64` marker.

### GitHub permissions

The token needs permission to read the authenticated account, create repositories, change repository visibility, and write repository contents. For fine-grained tokens, grant the required repository administration and contents permissions and ensure the token can create repositories under the selected owner.

> **Visibility:** An existing private repository is changed to public by this plugin. Its existing contents will then be publicly accessible. A token entered into a client-side workflow may be visible to users who can inspect that runtime; use the server-side runner when the token must remain private.

## Output

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

Use `{{ steps.githubUpload.output.data.downloadUrl }}` in downstream nodes. GitHub may take a short time to serve a newly uploaded file through its raw-content URL.

Failure:

```json
{ "ok": false, "error": "GitHub file upload failed: ..." }
```

## Example

Configure `attachment` as `{{ this.state.request.body.attachment }}` and set the repository name in the node settings. Store the GitHub token in an environment variable, such as `GITHUB_TOKEN`, and use:

```text
{{ this.state.envData.GITHUB_TOKEN }}
```

## Development

- `npm install` — install dependencies
- `npm test` — run unit tests
- `npm run build` — create browser and Deno bundles

## Caveats

- Uploading to an existing private repository changes its visibility to public.
- GitHub applies API rate and file-size limits.
- Public download URLs do not require GitHub authentication.

See `skill.md` for the machine-readable description used by AI agents.
