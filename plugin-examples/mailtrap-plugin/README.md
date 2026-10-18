# Mailtrap Plugin

Sends transactional email through the [Mailtrap](https://mailtrap.io) API,
typically to a sandbox inbox for testing.

## What it is

This plugin posts an email message to a Mailtrap sending endpoint. You provide
the API url, the sender and recipient addresses, a subject, and a plain-text
body. It is most useful in development and QA flows where you want to inspect
outgoing mail in a Mailtrap inbox instead of delivering it to real recipients.

## Library name

Use this exact value as the **Library Name** when installing the plugin in
Flow Requests:

```
MailtrapNode
```

- npm package: `mailtrap-plugin`
- CDN (browser): https://unpkg.com/mailtrap-plugin@2.0.0/dist/bundle.js
- CDN (server): https://unpkg.com/mailtrap-plugin@2.0.0/dist/deno-bundle.js

## Installation

1. Build the plugin: `npm install && npm run build`
2. In Flow Requests, open **Install Custom Plugins**.
3. Paste the CDN URL to `dist/bundle.js`.
4. Enter the library name `MailtrapNode`.
5. Click **Install**.

## Configuration

| Setting | Type | Required | Description |
|---|---|---|---|
| `token` | text | yes | Mailtrap API token. Store in env and use `{{ state.envData.MAILTRAP_TOKEN }}`. |
| `api` | text | yes | Full Mailtrap API endpoint URL, e.g. `https://sandbox.api.mailtrap.io/api/send/<inbox_id>`. |
| `subject` | text | yes | Email subject. Supports `{{ }}` expressions. |
| `text` | text | yes | Plain-text email body. Supports `{{ }}` expressions. |
| `from` | text | yes | Sender email address (must be a verified domain in Mailtrap). |
| `to` | text | yes | Recipient email address. Supports `{{ }}` expressions. |

## Output

The plugin does not return Mailtrap's response body.

Success:
```json
{ "ok": true }
```

Failure (API-level error):
```json
{ "ok": false, "error": "Request failed with status code 401" }
```

## Example

```json
{
  "type": "MailtrapNode",
  "name": "sendEmail",
  "setting": {
    "token": "{{ state.envData.MAILTRAP_TOKEN }}",
    "api": "https://sandbox.api.mailtrap.io/api/send/{{ state.envData.MAILTRAP_INBOX_ID }}",
    "subject": "Workflow Completed",
    "text": "The flow finished successfully.",
    "from": "noreply@yourdomain.com",
    "to": "team@yourcompany.com"
  }
}
```

## Development

- `npm install` — install dependencies
- `npm test` — run unit tests
- `npm run build` — produce `dist/bundle.js` and `dist/deno-bundle.js`

## Caveats

- The API token is sensitive — keep it in an environment variable.
- Missing required fields throw before any request is made; HTTP errors are
  returned as `{ ok: false, error }`.
- Sending is subject to Mailtrap's plan limits and rate limits.

See `skill.md` for the machine-readable description used by AI agents.
