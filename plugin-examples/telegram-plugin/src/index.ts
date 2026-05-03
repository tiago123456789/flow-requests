import {
  NodeBase,
  NodeConfig,
  NodeInput,
  NodeReturn,
} from "core-package-mini-n8n";

class TelegramNode extends NodeBase {
  constructor(state: any) {
    super(state);
  }

  getConfig(): NodeConfig {
    return {
      name: "telegram",
      type: "telegram",
      description: "Send messages via Telegram Bot API",
      ai_description: "Send a message to a Telegram chat using a bot token",
      properties: [
        {
          label: "Bot Token",
          name: "botToken",
          type: "text",
          required: true,
          default: null,
          ai_description: "Telegram Bot API token from @BotFather",
        },
        {
          label: "Chat ID",
          name: "chatId",
          type: "text",
          required: true,
          default: null,
          ai_description: "The target chat ID to send the message to",
        },
        {
          label: "Message",
          name: "message",
          type: "text",
          required: true,
          default: null,
          ai_description: "The message content to send",
        },
      ],
    };
  }

  private async sendMessage(url: string, chatId: string, message: string) {

    const body: Record<string, any> = {
      chat_id: chatId,
      text: message,
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        return {
          ok: false,
          error: data.description || `Failed to send message: ${response.statusText}`,
        };
      }

      return {
        ok: true,
        data,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: error.message,
      };
    }
  }

  async execute(node: NodeInput): Promise<NodeReturn> {
    const setting = node.settings;

    if (!setting.botToken) {
      throw new Error("Invalid settings. You need to provide a bot token");
    }
    if (!setting.chatId) {
      throw new Error("Invalid settings. You need to provide a chat ID");
    }
    if (!setting.message) {
      throw new Error("Invalid settings. You need to provide a message");
    }

    const botToken = this.parseExpression(setting.botToken);
    const chatId = this.parseExpression(setting.chatId);
    const message = this.parseExpression(setting.message);

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const hasMoreThan4000digits = message.length > 2000
    let texts = [message];

    console.log(hasMoreThan4000digits)
    if (hasMoreThan4000digits) {
      texts = []

      for (let index = 0; index < message.length; index += 2000) {
        const text = message.substring(index, 2000)
        if (text.trim().length == 0) {
          continue;
        }
        texts.push(message.substring(index, 2000))
      }

      const lastChunk = texts[texts.length - 1]
      if (lastChunk && !message.endsWith(lastChunk)) {
        const totalChunks = texts.length
        const lastPosition = (totalChunks) * 2000
        const text = message.substring(lastPosition, 2000)
        if (text.trim().length >= 1) {
          texts.push(text)
        }
      }
    }

    for (let index = 0; index < texts.length; index += 1) {
      await this.sendMessage(url, chatId, texts[index] as string)
    }

    return { ok: true }
  }
}

export default TelegramNode;