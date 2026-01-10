import {
  LinkedList,
  NodeBase,
  NodeConfig,
  NodeInput,
  NodeReturn,
} from "core-package-mini-n8n";

export default class StartNode extends NodeBase {
  constructor(state: any) {
    super(state);
  }

  getConfig(): NodeConfig {
    return {
      name: "Start",
      type: "start",
      description: "Start node",
      properties: [],
    };
  }

  execute(node: NodeInput): Promise<NodeReturn | LinkedList> {
    return Promise.resolve({});
  }
}
