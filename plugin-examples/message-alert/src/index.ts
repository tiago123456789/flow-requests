import {
  NodeBase,
  NodeConfig,
  NodeInput,
  NodeReturn,
} from "core-package-mini-n8n";

class AlertMessageNode extends NodeBase {
  constructor(state: any) {
    super(state);
  }

  getConfig(): NodeConfig {
    return {
      name: "AlertMessageNode", // name === type === output.library in webpack.config.cjs
      type: "AlertMessageNode", // name === type === output.library in webpack.config.cjs
      description: "Show alert message when execute the node",
      properties: [
        {
          label: "Message",
          name: "message",
          type: "text",
          required: true,
          default: null,
        },
      ],
    };
  }

  async execute(node: NodeInput): Promise<NodeReturn> {
    const setting = node.settings;

    if (!setting.message) {
      throw new Error("Invalid settings. You need to provide a message");
    }

    const message = this.parseExpression(setting.message);

    try {
      if (typeof window !== "undefined") {
        alert(message);
      } else {
        console.log(message);
      }
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }
}

export default AlertMessageNode;
