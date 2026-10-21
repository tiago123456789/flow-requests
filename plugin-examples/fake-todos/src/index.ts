import axios from "axios";
import {
  NodeBase,
  NodeConfig,
  NodeInput,
  NodeReturn,
} from "core-package-mini-n8n";

class FakeTodosNode extends NodeBase {
  constructor(state: any) {
    super(state);
  }

  getConfig(): NodeConfig {
    return {
      name: "FakeTodosNode", // name === type === output.library in webpack.config.cjs
      type: "FakeTodosNode", // name === type === output.library in webpack.config.cjs
      description: "fake todos plugin",
      ai_description: "Node to make api or http request to get fake todos",
      properties: [
        {
          label: "Operation",
          name: "operation",
          type: "select",
          required: true,
          default: "getAll",
          options: [
            {
              label: "Get all",
              value: "getAll",
            },
            {
              label: "Get by id",
              value: "getById",
            },
            {
              label: "Delete by id",
              value: "deleteById",
            },
            {
              label: "Create todo",
              value: "createTodo",
            },
          ],
        },
        {
          label: "Id",
          name: "id",
          type: "text",
          required: false,
          default: null,
          conditionShow: [
            {
              keyCheck: "operation",
              valueExpected: "getById",
            },
          ],
        },
        {
          label: "Id",
          name: "id",
          type: "text",
          required: false,
          default: null,
          conditionShow: [
            {
              keyCheck: "operation",
              valueExpected: "deleteById",
            },
          ],
        },
        {
          label: "Description",
          name: "todo",
          type: "text",
          required: false,
          default: null,
          conditionShow: [
            {
              keyCheck: "operation",
              valueExpected: "createTodo",
            },
          ],
        },
        {
          label: "Is done?",
          name: "completed",
          type: "select",
          required: false,
          default: "false",
          options: [
            {
              label: "Yes",
              value: "true",
            },
            {
              label: "No",
              value: "false",
            },
          ],
          conditionShow: [
            {
              keyCheck: "operation",
              valueExpected: "createTodo",
            },
          ],
        },
        {
          label: "User id",
          name: "userId",
          type: "text",
          required: false,
          default: null,
          conditionShow: [
            {
              keyCheck: "operation",
              valueExpected: "createTodo",
            },
          ],
        },
      ],
    };
  }

  async execute(node: NodeInput): Promise<NodeReturn> {
    const setting = node.settings;
    const operation = this.parseExpression(String(setting.operation ?? ""));

    if (operation == "getAll") {
      try {
        const { data } = await axios.get("https://dummyjson.com/todos");
        return { ok: true, data };
      } catch (error: any) {
        return { ok: false, error: error.message };
      }
    } else if (operation == "getById") {
      if (!setting.id) {
        throw new Error("You need to provide the id");
      }

      try {
        const { data } = await axios.get(
          `https://dummyjson.com/todos/${this.parseExpression(setting.id)}`
        );
        return { ok: true, data };
      } catch (error: any) {
        return { ok: false, error: error.message };
      }
    } else if (operation == "deleteById") {
      if (!setting.id) {
        throw new Error("You need to provide the id");
      }

      try {
        await axios.delete(
          `https://dummyjson.com/todos/${this.parseExpression(setting.id)}`
        );
        return { ok: true, data: { removed: true } };
      } catch (error: any) {
        return { ok: false, error: error.message };
      }
    } else if (operation == "createTodo") {
      if (!setting.todo) {
        throw new Error("You need to provide the todo description");
      }
      if (!setting.userId) {
        throw new Error("You need to provide the userId");
      }

      const completed =
        this.parseExpression(String(setting.completed ?? "false")) === "true";

      try {
        const { data } = await axios.post(`https://dummyjson.com/todos`, {
          todo: this.parseExpression(setting.todo),
          completed,
          userId: Number(this.parseExpression(String(setting.userId))),
        });
        return { ok: true, data: { created: true, ...data } };
      } catch (error: any) {
        return { ok: false, error: error.message };
      }
    }

    return { ok: false, error: `Unknown operation: ${operation}` };
  }
}

export default FakeTodosNode;
