import { Box, type Runtime } from "@upstash/box";
import {
  NodeBase,
  NodeConfig,
  NodeInput,
  NodeReturn,
} from "core-package-mini-n8n";

const BOX_NAME = "code-plugin-box";

const RUNTIME_MAP: Record<string, Runtime> = {
  js: "node",
  py: "python",
};

const FILE_EXT: Record<string, string> = {
  js: "js",
  py: "py",
};

const FILE_RUNNER: Record<string, string> = {
  js: "node",
  py: "python3",
};

class CodeNode extends NodeBase {
  constructor(state: any) {
    super(state);
  }

  getConfig(): NodeConfig {
    return {
      name: "CodeNode",
      type: "CodeNode",
      description: "Execute code in an isolated Upstash Box sandbox",
      properties: [
        {
          label: "API Key",
          name: "apiKey",
          type: "text",
          required: true,
          default: null,
        },
        {
          label: "Runtime",
          name: "runtime",
          type: "select",
          required: true,
          default: "js",
          options: [
            {
              label: "JavaScript",
              value: "js",
            },
          ],
        },
        {
          label: "Code",
          name: "code",
          type: "textarea",
          required: true,
          default: null,
        },
      ],
    };
  }

  async execute(node: NodeInput): Promise<NodeReturn> {
    const setting = node.settings;

    if (!setting.apiKey) {
      throw new Error("You need to provide an Upstash Box API Key");
    }

    if (!setting.runtime) {
      throw new Error("You need to provide a runtime");
    }

    if (!setting.code) {
      throw new Error("You need to provide code to execute");
    }

    const apiKey = this.parseExpression(setting.apiKey);
    const runtime = this.parseExpression(setting.runtime);
    const code = this.parseExpression(setting.code);

    const boxRuntime = RUNTIME_MAP[runtime];
    if (!boxRuntime) {
      throw new Error(`Unsupported runtime: ${runtime}`);
    }

    const fileExt = FILE_EXT[runtime];
    const runner = FILE_RUNNER[runtime];
    const filePath = `/workspace/home/work/script.${fileExt}`;

    let box: Box = await Box.create({
      apiKey,
      runtime: boxRuntime,
    });

    await box.files.write({
      path: filePath, content: `
        (async () => {
          ${code}
        })()
          .then((data) => console.log('#', JSON.stringify(data)) )  
          .catch((error) => console.log('#', error.message) )  
    ` });

    const result = await box.exec.command(`${runner} ${filePath}`);
    const output: string | undefined = result.result.trim().replaceAll("\n", "").split("#")[1]
    if (!output) {
      return {
        ok: true,
      }
    }
    await box.delete()
    try {
      // @ts-ignore
      const outputObj: { [key: string]: any } = JSON.parse(output)
      return { ok: true, data: outputObj };
    } catch (error: any) {
      return {
        ok: false,
        error: output.trim(),
      };
    }
  }
}

export default CodeNode;
