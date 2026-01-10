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
      name: "AlertMessage", // Name e type needs to be the same
      type: "AlertMessage", // Name e type needs to be the same
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

    if (typeof window !== "undefined") {
      alert(this.parseExpression(setting.message));
    } else {
      console.log(this.parseExpression(setting.message));
    }
    return { ok: true };
  }
}

export default AlertMessageNode;
