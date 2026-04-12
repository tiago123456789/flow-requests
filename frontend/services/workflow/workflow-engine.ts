import {
  Node,
  LinkedList,
  NodeBase,
  NodeInput,
  NodeReturn,
} from "core-package-mini-n8n";
import CustomNodeManager from "../../utils/custom-node-manager.util";
import { faker } from "@faker-js/faker";

import CodeNode from "./nodes/CodeNode";
import ConditionNode from "./nodes/ConditionNode";
import HttpRequestNode from "./nodes/HttpRequestNode";
import LoopNode from "./nodes/LoopNode";
import StartNode from "./nodes/StartNode";

class WorkflowEngine {
  private state: any;
  private customNodeManager: CustomNodeManager;

  constructor(customNodeManager: CustomNodeManager) {
    this.state;
    this.customNodeManager = customNodeManager;
  }

  getState() {
    return this.state;
  }

  private getWorkflowAsLinkedList(workflow: {
    nodes: Array<{ [key: string]: any }>;
  }): LinkedList {
    const wLinkedList = new LinkedList();
    if (workflow.nodes instanceof LinkedList) {
      return workflow.nodes;
    }

    for (let index = 0; index < workflow.nodes.length; index += 1) {
      const item = workflow.nodes[index];
      if (item?.type == "condition") {
        const lSuccess = new LinkedList();
        item.setting.success.forEach((item: NodeBase) => lSuccess.add(item));
        item.setting.success = lSuccess;

        const lFail = new LinkedList();
        item.setting.fail.forEach((item: NodeBase) => lFail.add(item));
        item.setting.fail = lFail;

        wLinkedList.add(item as NodeBase);
      } else if (item?.type == "loop") {
        const lNodes = new LinkedList();
        item.setting.nodes.forEach((item: NodeBase) => lNodes.add(item));
        item.setting.nodes = lNodes;

        wLinkedList.add(item as NodeBase);
      } else {
        wLinkedList.add(item as NodeBase);
      }
    }

    return wLinkedList;
  }

  getStepName(stepName: string, loopIndex: string) {
    if (loopIndex.trim().length > 0) {
      return `${stepName}_${loopIndex}`;
    }
    return stepName;
  }

  async process(
    workflowToProcess: {
      nodes: Array<{ [key: string]: any }>;
      envData: Array<{ [key: string]: any }>;
    },
    requestData: any,
    loopIndex: string = "",
  ) {
    this.state = { ...workflowToProcess };
    this.state.nodes = this.getWorkflowAsLinkedList(workflowToProcess);
    this.state.envData = {};

    if (workflowToProcess.envData.length > 0) {
      workflowToProcess.envData.forEach((item) => {
        this.state.envData[item.key] = item.value;
      });
    }

    this.state.request = requestData;
    this.state.steps = { ...this.state.steps };
    this.state.faker = faker;

    const instanceByType: { [key: string]: (state: any) => NodeBase } = {
      start: (state: any) => new StartNode(state),
      api: (state: any) => new HttpRequestNode(state),
      condition: (state: any) => new ConditionNode(state),
      code: (state: any) => new CodeNode(state),
      loop: (state: any) =>
        new LoopNode(state, new WorkflowEngine(this.customNodeManager)),
    };

    let start: { [key: string]: any } | LinkedList | null =
      this.state.nodes.head;

    while (start != null) {
      // @ts-ignore
      const item: { type: string; name: string; [key: string]: any } =
        // @ts-ignore
        start?.value;
      let instance: NodeBase | undefined;
      let name: string | undefined = item.name;

      if (!instanceByType[item.type]) {
        instance = await this.customNodeManager.getCustomNodeByType(
          item.type,
          this.state,
        );
      } else {
        // @ts-ignore
        instance = instanceByType[item.type](this.state);
      }

      let output: NodeReturn | LinkedList;
      try {
        output = await instance.execute({
          ...item,
          settings: item.setting || {},
          steps: this.state.steps,
        });
      } catch (error: any) {
        if (error.response) {
          output = {
            error: {
              status: error.response.status,
              data: error.response.data,
            },
          };
        } else {
          console.log(error);
          output = {
            error: {
              message: error.message,
            },
          };
        }
      }

      if (output instanceof LinkedList) {
        // @ts-ignore
        start = output.head;
        this.state.steps[this.getStepName(name, loopIndex)] = {
          output: {},
          input: this.state.request || {},
        };
        continue;
      }

      this.state.steps[this.getStepName(name, loopIndex)] = {
        output,
        input: this.state.request || {},
      };
      // @ts-ignore
      start = start.next;
    }
  }
}

export default WorkflowEngine;
