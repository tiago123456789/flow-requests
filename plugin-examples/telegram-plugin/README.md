# Telegram Plugin

Sends messages to a Telegram chat through the Telegram Bot API.

## What it is

This plugin posts a text message to a chat, group, or channel using a bot
token from [@BotFather](https://t.me/BotFather). Messages longer than 2000
characters are automatically split into multiple chunks and sent in order. If
any chunk fails, the node reports the error instead of silently succeeding.

Use it to notify a person or a team about events, results, or failures in a
flow.

## Library name

Use this exact value as the **Library Name** when installing the plugin in
Flow Requests:

```
TelegramNode
```

- npm package: `telegram-plugin-flow-requests`
- CDN (browser): https://unpkg.com/telegram-plugin-flow-requests@2.0.0/dist/bundle.js
- CDN (server): https://unpkg.com/telegram-plugin-flow-requests@2.0.0/dist/deno-bundle.js

## Installation

1. Build the plugin: `npm install && npm run build`
2. In Flow Requests, open **Install Custom Plugins**.
3. Paste the CDN URL to `dist/bundle.js`.
4. Enter the library name `TelegramNode`.
5. Click **Install**.

## Configuration

| Setting | Type | Required | Description |
|---|---|---|---|
| `botToken` | text | yes | Telegram Bot API token from @BotFather. Store in env and use `{{ state.envData.TELEGRAM_BOT_TOKEN }}`. |
| `chatId` | text | yes | Target chat id (group, channel, or private chat). |
| `message` | text | yes | The text to send. Supports `{{ }}` expressions. Long messages are split automatically. |

## Output

Success:
```json
{ "ok": true }
```

Failure (API-level error):
```json
{ "ok": false, "error": "Bad Request: chat not found" }
```

## Example

```json
{
  "type": "TelegramNode",
  "name": "notifyTeam",
  "setting": {
    "botToken": "{{ state.envData.TELEGRAM_BOT_TOKEN }}",
    "chatId": "{{ state.envData.TELEGRAM_CHAT_ID }}",
    "message": "New order received: {{ steps.fetchOrder.output.data.id }}"
  }
}
```

## Development

- `npm install` — install dependencies
- `npm test` — run unit tests
- `npm run build` — produce `dist/bundle.js` and `dist/deno-bundle.js`

## Caveats

- The bot token is sensitive — keep it in an environment variable.
- The bot must be a member of the target chat and have permission to post.
- Telegram applies its own rate limits to messages sent per chat.

See `skill.md` for the machine-readable description used by AI agents.
