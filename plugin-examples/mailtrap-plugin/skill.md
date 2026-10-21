# Skill: Mailtrap Plugin

**Name:** MailtrapNode
**Version:** 2.0.0
**npm package:** mailtrap-plugin
**CDN (browser):** https://unpkg.com/mailtrap-plugin@2.0.0/dist/bundle.js
**CDN (server):** https://unpkg.com/mailtrap-plugin@2.0.0/dist/deno-bundle.js
**Library name:** MailtrapNode

---

## Description

Sends an email through the [Mailtrap](https://mailtrap.io) API using an
HTTP POST request.

Mailtrap is an email delivery platform with a safe testing inbox (Email
Sandbox) and a production sending service (Email Sending). This plugin works
with both: point the `api` property to the appropriate Mailtrap endpoint and
supply the corresponding API token.

Use this node whenever a flow needs to send a transactional or notification
email — account alerts, report delivery, workflow completion summaries, or
any automated message that should land in an inbox.

---

## When to use this plugin

- Send a confirmation email after a form submission or webhook trigger.
- Deliver a workflow summary report to a team inbox when a flow completes.
- Forward an AI-generated response or summary to a recipient via email.
- Test email delivery pipelines safely using Mailtrap's Email Sandbox.
- Send error notifications to an engineering team when a flow fails.

---

## Node properties (settings)

| Property name | Type | Required | Default | Description |
|---------------|------|----------|---------|-------------|
| `token`       | text | yes      | —       | Mailtrap API token. Store in env and reference with `{{ state.envData.MAILTRAP_TOKEN }}`. |
| `api`         | text | yes      | —       | Full Mailtrap API endpoint URL. See options below. |
| `subject`     | text | yes      | —       | Email subject line. Supports `{{ }}` expressions. |
| `text`        | text | yes      | —       | Plain-text email body. Supports `{{ }}` expressions. |
| `from`        | text | yes      | —       | Sender email address (must be a verified domain in Mailtrap). |
| `to`          | text | yes      | —       | Recipient email address. Supports `{{ }}` expressions. |

### `api` endpoint options

| Environment        | URL |
|--------------------|-----|
| Email Sandbox      | `https://sandbox.api.mailtrap.io/api/send/<inbox_id>` |
| Email Sending (production) | `https://send.api.mailtrap.io/api/send` |

Replace `<inbox_id>` with your sandbox inbox ID from the Mailtrap dashboard.

---

## Output shape

Success:
```json
{
  "ok": true
}
```

The plugin does not return Mailtrap's response body. It returns `{ ok: true }`
when the request completes successfully.

Failure (throws before sending — missing required fields):

The node throws with one of:
- `"You need to provide a Mailtrap token"`
- `"You need to provide the Mailtrap API url"`
- `"You need to provide a subject"`
- `"You need to provide a text"`
- `"You need to provide a 'from' email"`
- `"You need to provide a 'to' email"`

Failure (API-level error):
```json
{
  "ok": false,
  "error": "Request failed with status code 401"
}
```

An HTTP error from the Mailtrap API is caught and returned as
`{ ok: false, error }`, so downstream nodes can branch on
`{{ steps.sendEmail.output.ok }}` without the flow aborting.

---

## How to reference output in downstream nodes

```
{{ steps.sendEmail.output.ok }}    — true on success
```

---

## Example flow snippets

Send a notification email via sandbox:

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

Send an AI-generated summary to a recipient:

```json
{
  "type": "MailtrapNode",
  "name": "deliverSummary",
  "setting": {
    "token": "{{ state.envData.MAILTRAP_TOKEN }}",
    "api": "https://send.api.mailtrap.io/api/send",
    "subject": "Daily Summary - {{ steps.formatDate.output.data }}",
    "text": "{{ steps.aiNode.output.data.choices[0].message.content }}",
    "from": "reports@yourdomain.com",
    "to": "{{ steps.inputNode.output.data.recipientEmail }}"
  }
}
```

Alert on error:

```json
{
  "type": "MailtrapNode",
  "name": "errorAlert",
  "setting": {
    "token": "{{ state.envData.MAILTRAP_TOKEN }}",
    "api": "https://send.api.mailtrap.io/api/send",
    "subject": "Flow Error Detected",
    "text": "An error occurred: {{ steps.prevNode.output.error }}",
    "from": "alerts@yourdomain.com",
    "to": "oncall@yourcompany.com"
  }
}
```

---

## Constraints and caveats

- **API token is sensitive** — always store it as `MAILTRAP_TOKEN` in the
  flow's environment variables. Never hardcode it in the node settings.
- **Sender domain must be verified** — in production mode (`send.api.mailtrap.io`),
  the `from` address must belong to a domain you have verified in Mailtrap.
  Unverified domains will cause a 422 error.
- **Sandbox vs. production** — use the sandbox endpoint during development to
  avoid sending real emails. Switch to the production endpoint only when the
  flow is ready to go live.
- **Plain text only** — this plugin sends emails with a `text` body only. HTML
  email templates are not supported without modifying the plugin to add an
  `html` field.
- **No delivery confirmation** — the plugin returns `{ ok: true }` when the
  request succeeds at the HTTP level. Mailtrap may still queue, delay, or
  reject the email; check the Mailtrap dashboard for delivery status.
- **API errors are not caught** — if the Mailtrap API returns a 4xx or 5xx
  response, axios will throw and the flow will stop at this node. Add error
  handling downstream if resilience is required.
- **Single recipient** — the plugin sends to one email address per execution.
  To send to multiple recipients, either loop over the node or extend the plugin
  to accept an array for the `to` field.
