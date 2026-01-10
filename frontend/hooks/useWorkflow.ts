import { useState } from "react";
import Workflow from "../types/workflow";
import { AxiosError } from "axios";
import { toast } from "react-toastify";
import LogEntry from "../types/log-entry";
import EnvData from "@/types/env-data";
import WorkflowEngine from "@/services/workflow/workflow-engine";
import CustomNodeManager from "@/utils/custom-node-manager.util";
import PackageUtil from "@/utils/package.util";
import WorkflowAssistantService from "@/services/workflow/workflow-assistant.service";
import * as workflowRepository from "@/repositories/workflow.repository";
import * as pluginRepository from "@/repositories/plugins.repository";

const packageUtil = new PackageUtil();

function useWorkflow() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [isRunningWorkflow, setIsRunningWorkflow] = useState(false);

  const getWorkflows = async () => {
    try {
      const results = await workflowRepository.getAll();
      setWorkflows(results);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch workflows");
    }
  };

  const deleteWorkflow = async (workflowId: string) => {
    await workflowRepository.removeById(workflowId);
    getWorkflows();
  };

  function getLogs(steps: any) {
    const logs: Array<{ step: string; output: any; input: any }> = [];
    Object.keys(steps).forEach((key) => {
      logs.push({
        step: key,
        output: steps[key].output,
        input: steps[key].input,
      });
    });
    return logs;
  }

  const runWorkflow = async (data: {
    isEditMode: boolean;
    workflowId: string;
    contextVariables: [];
    envData: EnvData[];
    name: string;
    originalWorkflow: {
      nodes: any[];
      edges: any[];
    };
    [key: string]: any;
  }) => {
    setIsRunningWorkflow(true);
    setIsLogsModalOpen(true);
    try {
      const results = await pluginRepository.getAll();
      const customNodeManager = new CustomNodeManager(results, packageUtil);
      const workflowEngine = new WorkflowEngine(customNodeManager);

      await workflowEngine.process(
        {
          nodes: data.nodes || [],
          envData: data.envData,
        },
        {},
      );

      const states = workflowEngine.getState();
      setLogs(getLogs(states.steps));
      toast.success("Workflow executed successfully");
    } catch (error: any) {
      if (error.response instanceof AxiosError) {
        toast.error(error.response.data.error);
      }
      setLogs([]);
    } finally {
      setIsRunningWorkflow(false);
    }
  };

  const getWorkflowById = async (id: string) => {
    const data = await workflowRepository.findById(id);
    console.log(JSON.parse(data.data))
    setWorkflow(JSON.parse(data.data));
  };

  const updateWorkflow = async (data: {
    workflowId: string;
    contextVariables: [];
    envData: EnvData[];
    name: string;
    originalWorkflow: {
      nodes: any[];
      edges: any[];
    };
    [key: string]: any;
  }) => {
    await workflowRepository.update(data.workflowId, {
      data: JSON.stringify(data),
    });
    toast.success("Workflow updated with success");
  };

  const getCustomNodes = async () => {
    const results = await pluginRepository.getAll();
    const plugins = await packageUtil.load(results, {});
    return plugins.map((item) => item.getConfig());
  };

  const createWorkflow = async (data: {
    envData: EnvData[];
    name: string;
    nodes: Array<any>;
    originalWorkflow: {
      nodes: any[];
      edges: any[];
    };
    [key: string]: any;
  }) => {
    const workflowCreatedId = await workflowRepository.insert({
      data: JSON.stringify(data),
    });

    toast.success("Workflow created successfully");
    return { id: workflowCreatedId };
  };

  const getCustomPluginToUseAiAssistant = async () => {
    const results = await pluginRepository.getAll();
    return packageUtil.load(results, {});
  };

  const handleUserChatMessage = async (content: string, nodes: Array<any>) => {
    try {
      const customNodes = await getCustomPluginToUseAiAssistant();
      const workflowAssistant = new WorkflowAssistantService(customNodes);
      const answer = await workflowAssistant.processUserMessage(nodes, content);

      return {
        data: {
          result: answer,
        },
      };
    } catch (error: any) {
      console.log(error);
      return {
        data: {
          result: error.message || error.response.data.error.messa,
        },
      };
    }
  };

  const exportFlows = async () => {
    const workflowsResults = await workflowRepository.getAll();
    const pluginsResults = await pluginRepository.getAll();
    const exportData = {
      plugins: pluginsResults.map((item: any) => ({
        enabled: item.enabled,
        libraryName: item.libraryName,
        url: item.url,
      })),
      flows: workflowsResults.map((item: any) => ({
        id: item.id.toString(),
        data: item.data,
      })),
    };
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flows.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importFlows = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        if (
          !data.plugins ||
          !Array.isArray(data.plugins) ||
          !data.flows ||
          !Array.isArray(data.flows)
        )
          throw new Error(
            "Invalid format: expected { plugins: [...], flows: [...] }",
          );

        for (const plugin of data.plugins) {
          if (
            typeof plugin.enabled !== "boolean" ||
            typeof plugin.libraryName !== "string" ||
            typeof plugin.url !== "string"
          ) {
            throw new Error("Invalid plugin format");
          }

          await pluginRepository.insert({
            enabled: plugin.enabled,
            libraryName: plugin.libraryName,
            url: plugin.url,
          });
        }

        for (const flow of data.flows) {
          if (typeof flow.id !== "string" || typeof flow.data !== "object") {
            throw new Error("Invalid flow format");
          }

          await workflowRepository.insert({ data: JSON.stringify(flow.data) });
        }
        getWorkflows();
        toast.success("Flows and plugins imported successfully");
      } catch (error: any) {
        console.log(error);
        toast.error(error.message || "Failed to import");
      }
    };
    input.click();
  };

  return {
    workflows,
    getWorkflows,
    deleteWorkflow,
    getWorkflowById,
    workflow,
    runWorkflow,
    logs,
    isLogsModalOpen,
    setIsLogsModalOpen,
    isRunningWorkflow,
    updateWorkflow,
    getCustomNodes,
    createWorkflow,
    handleUserChatMessage,
    exportFlows,
    importFlows,
  };
}

export default useWorkflow;
