import {
  LinkedList,
  NodeBase,
  NodeInput,
  NodeReturn,
} from "core-package-mini-n8n";

export default class ConditionNode extends NodeBase {
  constructor(state: any) {
    super(state);
  }

  getConfig() {
    return {
      name: "Condition",
      type: "condition",
      description: "Condition node",
      ai_description:
        "Use this node when you can compare values or check something",
      properties: [
        {
          label: "Condition on left side",
          name: "left",
          type: "text",
          required: false,
          default: "",
        },
        {
          label: "Condition on right side",
          name: "right",
          type: "text",
          required: false,
          default: "",
        },
        {
          label: "Condition to compare the left and right data",
          name: "operator",
          ai_description: `
            Valid operators: 
              "==" => means compare if left and right is equal
              "===" => means compare if left and rigth is equal and has same data type
              "!=" => means compare if left and rigth is not equal or if left and right are different
              ">" => means compare if left is greater than rigth
              "<" => means compare if left is less than rigth
              ">=" => means compare if left is greater than or equal to rigth
              "<=" => means compare if left is less than or equal to rigth
          `,
          default: "==",
          required: false,
          type: "text",
        },
      ],
    };
  }

  execute(node: NodeInput): Promise<NodeReturn | LinkedList> {
    const setting = node.settings;
    let leftValue: string | number = this.parseExpression(
      setting.condition.left.value
    );
    let rightValue: string | number = this.parseExpression(
      setting.condition.right.value
    );

    if (!isNaN(parseFloat(leftValue))) {
      leftValue = parseFloat(leftValue);
    }

    if (!isNaN(parseFloat(rightValue))) {
      rightValue = parseFloat(rightValue);
    }

    const operatorMap: {
      [key: string]: (left: any, right: any) => boolean;
    } = {
      "==": (left: string, right: string) => left == right,
      "===": (left: string, right: string) => left === right,
      "!=": (left: string, right: string) => left != right,
      ">": (left: string, right: string) => left > right,
      "<": (left: string, right: string) => left < right,
      ">=": (left: string, right: string) => left >= right,
      "<=": (left: string, right: string) => left <= right,
    };

    const operator = setting?.condition?.operator;
    if (!operatorMap[operator]) {
      throw new Error("Invalid operator");
    }

    console.log(operatorMap[operator](leftValue, rightValue));
    if (operatorMap[operator](leftValue, rightValue)) {
      return setting.success;
    } else {
      return setting.fail;
    }
  }
}
