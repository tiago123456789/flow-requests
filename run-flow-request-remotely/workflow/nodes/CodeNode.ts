import { NodeBase, NodeInput, NodeReturn } from "core-package-mini-n8n";

class CodeNode extends NodeBase {
  constructor(state: any) {
    super(state);
  }

  getConfig() {
    return {
      name: "Code",
      type: "code",
      description: "Code node",
      ai_description: "Focus to run custom js or javascript code logic",
      properties: [
        {
          label: "Code",
          name: "code",
          type: "string",
          required: true,
          default: "function node() { console.log('Hello World') }",
          description:
            "Any code need to be inside the function node(). For example: code 'function node() { // code logic here }' ",
        },
      ],
    };
  }

  async execute(node: NodeInput): Promise<NodeReturn> {
    // const setting = node.settings;
    // let code = `
    // ${Buffer.from(setting.code, "base64").toString('utf-8')}

    // node()
    // `

    // code = this.parseExpression(code)
    // const result = vm.runInThisContext(code)
    // return result

    return { ok: true };
  }
}

export default CodeNode;
