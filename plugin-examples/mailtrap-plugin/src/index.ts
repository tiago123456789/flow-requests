import axios from "axios";
import {
  NodeBase,
  NodeConfig,
  NodeInput,
  NodeReturn,
} from "core-package-mini-n8n";

class MailtrapNode extends NodeBase {
  constructor(state: any) {
    super(state);
  }

  getConfig(): NodeConfig {
    return {
      name: "MailtrapNode", // name === type === output.library in webpack.config.cjs
      type: "MailtrapNode", // name === type === output.library in webpack.config.cjs
      description: "Mailtrap plugin to allow send email fake inbox",
      properties: [
        {
          label: "Token",
          name: "token",
          type: "text",
          required: true,
          default: null,
          // @ts-ignore
          info: "Your Mailtrap API token, used to authenticate the email request.",
        },
        {
          label: "Api url",
          name: "api",
          type: "text",
          required: true,
          default: null,
          // @ts-ignore
          info: "The Mailtrap API endpoint URL that accepts the email request.",
        },
        {
          label: "Subject",
          name: "subject",
          type: "text",
          required: true,
          default: null,
          // @ts-ignore
          info: "The subject line of the email to send.",
        },
        {
          label: "Email text",
          name: "text",
          type: "text",
          required: true,
          default: null,
          // @ts-ignore
          info: "The plain-text body content of the email.",
        },
        {
          label: "From",
          name: "from",
          type: "text",
          required: true,
          default: null,
          // @ts-ignore
          info: "The sender email address for the message.",
        },
        {
          label: "To",
          name: "to",
          type: "text",
          required: true,
          default: null,
          // @ts-ignore
          info: "The recipient email address for the message.",
        },
      ],
    };
  }

  async execute(node: NodeInput): Promise<NodeReturn> {
    const setting = node.settings;
    if (!setting.token) {
      throw new Error("You need to provide a Mailtrap token");
    }

    if (!setting.api) {
      throw new Error("You need to provide the Mailtrap API url");
    }

    if (!setting.subject) {
      throw new Error("You need to provide a subject");
    }

    if (!setting.text) {
      throw new Error("You need to provide a text");
    }

    if (!setting.from) {
      throw new Error("You need to provide a 'from' email");
    }

    if (!setting.to) {
      throw new Error("You need to provide a 'to' email");
    }

    try {
      await axios.post(
        this.parseExpression(setting.api),
        {
          from: {
            email: this.parseExpression(setting.from),
            name: "test",
          },
          to: [
            {
              email: this.parseExpression(setting.to),
            },
          ],
          subject: this.parseExpression(setting.subject),
          text: this.parseExpression(setting.text),
        },
        {
          headers: {
            Authorization: `Bearer ${this.parseExpression(setting.token)}`,
          },
        }
      );

      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }
}

export default MailtrapNode;
