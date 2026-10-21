import {
  LinkedList,
  NodeBase,
  NodeInput,
  NodeReturn,
} from "core-package-mini-n8n";
export default class LoopNode extends NodeBase {
  private engine: any;

  constructor(state: any, engine: any) {
    super(state);
    this.engine = engine;
  }

  override getConfig() {
    return {
      name: "Loop",
      type: "loop",
      description: "Loop node",
      ai_description: "Node focus on execute repetitive actions",
      properties: [
        {
          label: "Loop",
          type: "text",
          name: "source",
          default: "[1,2,3]",
          required: true,
        },
      ],
    };
  }

  override async execute(node: NodeInput): Promise<NodeReturn | LinkedList> {
    const setting = node.settings;
    let source = this.parseExpression(setting.source);

    try {
      source = JSON.parse(source);
    } catch (error) {}

    const stepName = node.name;
    const steps: { [key: string]: any } = {
      [stepName]: {
        currentItem: null,
      },
    };

    const workflowToRun = {
      nodes: setting.nodes,
      steps: steps,
      envData: Object.entries(this.state.envData || {}).map(([key, value]) => ({
        key,
        value,
      })),
    };

    console.log();

    for (let index = 0; index < source.length; index += 1) {
      const item = source[index];
      steps[node.name].currentItem = item;
      this.state.steps = {
        ...this.state.steps,
        ...steps,
      };

      await this.engine.process(
        workflowToRun,
        this.state.request || {},
        `${stepName}_${index}`,
      );
      this.state.steps = {
        ...this.state.steps,
        ...steps,
        ...this.engine.getState().steps,
      };
    }

    this.state.steps = { ...this.state.steps, ...steps };
    return {};
  }
}
