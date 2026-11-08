import {
  NodeBase,
  NodeConfig,
  NodeInput,
  NodeReturn,
} from "core-package-mini-n8n";

class CodeNode extends NodeBase {
  constructor(state: any) {
    super(state);
  }

  getConfig(): NodeConfig {
    return {
      name: "CodeNode",
      type: "CodeNode",
      description:
        "Execute custom JavaScript against the provided data in an isolated node:vm sandbox",
      properties: [
        {
          label: "Code",
          name: "code",
          type: "textarea",
          required: true,
          default: null,
          // @ts-ignore
          info: "JavaScript expression to run in the isolated VM sandbox. Its result is returned as the node output.",
        },
        {
          label: "Data (JSON)",
          name: "data",
          type: "textarea",
          required: false,
          default: null,
          // @ts-ignore
          info: "Optional JSON object whose fields are available to the JavaScript code as variables.",
        },
      ],
    };
  }

  async execute(node: NodeInput): Promise<NodeReturn> {
    const setting = node.settings;

    if (!setting.code) {
      throw new Error("Invalid settings. You need to provide a code");
    }

    const hasFunctionCodeDeclared = /function code\(([a-zA-Z]{1,})?\)/.test(setting.code)
    if (!hasFunctionCodeDeclared) {
      throw new Error("You need to declare the function code() { // code here } or function code(data) { // code here }");
    }

    const code = this.parseExpression(setting.code);

    let data: any = {};
    if (setting.data) {
      const rawData = this.parseExpression(setting.data);
      try {
        data = JSON.parse(rawData);
      } catch {
        throw new Error("Invalid settings. data must be a valid JSON");
      }
    }

    const { createContext, runInContext } = await import(/* webpackIgnore: true */ "node:vm");

    const context: { output: any; data: any } = { output: {}, data: {...data} };
    createContext(context);

    try {
      runInContext(`
        ${code.trim()}
        output = code(data)`, context);
    } catch (error: any) {
      return { ok: false, error: error.message };
    }

    return { ok: true, data: context.output };
  }
}



export default CodeNode;
