"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Panel,
  type Connection,
  type Edge,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { ToastContainer, toast } from "react-toastify";

import { StartNode } from "./nodes/start-node";
import { ApiNode } from "./nodes/api-node";
import { ConditionNode } from "./nodes/condition-node";
import { LoopNode } from "./nodes/loop-node";
import NodeConfigPanel from "./node-config-panel";
import { Button } from "@/components/ui/button";
import {
  GitBranch,
  Save,
  Play,
  Upload,
  Globe,
  List,
  Settings,
} from "lucide-react";
import { z } from "zod";
import { CodeNode } from "./nodes/code-node";
import { EnvDataModal } from "./env-data-modal";
import { LogsModal } from "./logs-modal";
import { SettingsModal } from "./settings-modal";
import { AddCurlModal } from "./add-curl-modal";
import { FlowSidebar } from "./flow-sidebar";
import { CustomNode } from "./nodes/custom-node";
import { useRouter } from "next/navigation";
import useWorkflow from "@/hooks/useWorkflow";
import Message from "@/types/message";
import EnvData from "@/types/env-data";
import TYPE_OPTION_MENU from "@/types/type-option-menu";
import ChatComponent from "./chat-component";
import * as OptionMenuUtil from "@/utils/option-menu";
import { parse } from "@/utils/parse-insominia-file.util";
import {
  DEFAULT_VALUES,
  INITIAL_NODES,
  VALIDATION_BY_NODE_TYPES,
} from "@/utils/nodes";
import { parseBeforeRunOrSave } from "@/utils/workflow";

const validationDataNodeTypes: {
  [key: string]: z.ZodObject<{ [key: string]: any }>;
} = VALIDATION_BY_NODE_TYPES;
const initialNodes = INITIAL_NODES;
const initialEdges: Array<{ [key: string]: any }> = [];

interface FlowBuilderProps {
  flowName?: string;
  onFlowNameChange?: (name: string) => void;
  workflowToEdit: any;
  worlflowToEditId?: string;
}

export default function FlowBuilder({
  worlflowToEditId,
  workflowToEdit,
  flowName,
}: FlowBuilderProps) {
  const router = useRouter();
  const reactFlowWrapper = useRef(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [workflowId, setWorkflowId] = useState(null);
  const [defaultDataByNodeTypes, setDefaultDataByNodeTypes] = useState<{
    [key: string]: any;
  }>(DEFAULT_VALUES);

  const [nodeTypes, setNodeTypes] = useState<NodeTypes>({
    start: StartNode,
    api: ApiNode,
    condition: ConditionNode,
    code: CodeNode,
    loop: LoopNode,
  });
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] =
    // @ts-ignore
    useEdgesState<Array<{ [key: string]: any }>>(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [customNodes, setCustomNodes] = useState<any[]>([]);
  const [httpRequestNodes, setHttpRequestNodes] = useState<any[]>([]);
  const [envData, setenvData] = useState<EnvData[]>([]);
  const [isEnvDataModalOpen, setIsEnvDataModalOpen] = useState(false);
  const [settingsData, setSettingsData] = useState<any[]>([
    { id: "openRouterToken", key: "openRouterToken", value: "" },
  ]);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAddCurlModalOpen, setIsAddCurlModalOpen] = useState(false);
  const [optionsMenu, setOptionsMenu] = useState<Array<string>>(
    OptionMenuUtil.DEFAULT,
  );

  const {
    updateWorkflow,
    runWorkflow,
    logs,
    isLogsModalOpen,
    setIsLogsModalOpen,
    isRunningWorkflow,
    getCustomNodes,
    createWorkflow,
    handleUserChatMessage,
  } = useWorkflow();

  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hello! I'm your workflow assistant. Describe what workflow you'd like to create, and I'll help you build it step by step.",
      sender: "assistant",
      timestamp: new Date(),
    },
  ]);

  const addNewNode = (data: { [key: string]: any }) => {
    const httpRequestNodeItem: { [key: string]: any } = httpRequestNodes.find(
      (item) => {
        return item.label == data.label;
      },
    );

    if (httpRequestNodeItem) {
      addNode(data.type, { ...httpRequestNodeItem });
      return;
    }

    const customData: { [key: string]: any } = {};
    const nodeToAdd = data;
    if (nodeToAdd?.properties?.length > 0) {
      nodeToAdd.properties.forEach((item: any) => {
        customData[item.name] = item.default || "";
      });
    }

    if (nodeToAdd.type == "condition") {
      customData.condition = {
        ...customData,
      };
    }

    addNode(nodeToAdd.type, customData);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        let items: any[] = parse(content);
        items = items.map((item) => {
          return {
            type: "api",
            label: item.name,
            icon: Globe,
            name: item.name,
            endpoint: item.url,
            method: item.method,
            headers: item.headers,
            body: item.body,
            description: item.description,
            color: "text-blue-500",
            bgColor: "bg-blue-50",
            borderColor: "border-blue-200",
          };
        });

        setHttpRequestNodes([...items]);
        toast.success(`Uploaded ${items.length} API requests`);
      } catch (err) {
        console.error(err);
        toast.error("Error parsing YAML file");
      }
    };
    reader.readAsText(file);
  };

  const editNode = (data: { [key: string]: any }) => {
    let items: Array<any> = [...nodes];
    items = items.map((item) => {
      if (item.id == data?.id) {
        return data;
      }
      return item;
    });

    setNodes([...items]);
  };

  const handleSendMessage = async (content: string) => {
    try {
      const response = await handleUserChatMessage(content, [
        ...nodes,
        ...httpRequestNodes,
      ]);

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content,
          sender: "user",
          timestamp: new Date(),
        },
      ]);

      if (typeof response.data.result == "string") {
        setChatMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            content: `${response.data.result}`,
            sender: "assistant",
            timestamp: new Date(),
          },
        ]);

        return;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: `Node generated is: ${JSON.stringify(
            response.data.result,
            null,
            2,
          )}`,
          sender: "assistant",
          timestamp: new Date(),
        },
      ]);

      const hasEdit =
        nodes.find((item) => item?.id == response.data.result?.id) != null;
      if (!hasEdit) {
        addNewNode(response.data.result);
      } else {
        editNode(response.data.result);
      }
    } catch (error: any) {
      if (error?.response?.data?.error) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            content,
            sender: "user",
            timestamp: new Date(),
          },
        ]);

        setChatMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            content: `I'm sorry, but I couldn't generate the node. Error: ${error.response.data.error}`,
            sender: "assistant",
            timestamp: new Date(),
          },
        ]);
      }
    }
  };

  const onConnect = (params: Connection | Edge) => {
    const mapNodesById: { [key: string]: any } = {};

    for (let index = 0; index < nodes.length; index += 1) {
      const item = nodes[index];
      mapNodesById[item.id] = item;
    }

    // @ts-ignore
    const nodeByType = mapNodesById[params?.source];
    const isSourceConditionNode = nodeByType && nodeByType.type == "condition";
    const isSourceLoopNode = nodeByType && nodeByType.type == "loop";
    if (isSourceConditionNode || isSourceLoopNode) {
      // @ts-ignore
      params.parentId = params.source;
      // @ts-ignore
      params.pathCondition = params.sourceHandle;
    } else {
      const sourceEdge = edges.filter((edge) => edge.target == params.source);
      //@ts-ignore
      if (sourceEdge[0] && sourceEdge[0].parentId) {
        // @ts-ignore
        params.parentId = sourceEdge[0].parentId;
        // @ts-ignore
        params.pathCondition = sourceEdge[0].pathCondition;
      }
    }

    setEdges((eds) => addEdge(params, eds));
  };

  const onNodeClick = (_: any, node: any) => {
    setSelectedNode({ ...node });
  };

  const onNodeConfigChange = (nodeId: string, newData: any = {}) => {
    setNodes((nds) => [
      ...nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...newData,
            },
          };
        }
        return node;
      }),
    ]);
  };

  const addNode = (type: string, customData: { [key: string]: any }) => {
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
    const data = {
      ...defaultDataByNodeTypes[type],
      label: type.charAt(0).toUpperCase() + type.slice(1),
      name: `trigger_${typeLabel}_${nodes.length + 1}`.toLowerCase(),
      ...customData,
    };

    setOptionsOfMenu(TYPE_OPTION_MENU.NEW_NODE, data.name);

    const newNode = {
      id: `${nodes.length + 1}`,
      type,
      position: {
        x: 250,
        y: nodes.length > 0 ? nodes[nodes.length - 1].position.y + 150 : 100,
      },
      data,
    };

    setNodes((nds) => [...nds, { ...newNode }]);
  };

  const closeConfigPanel = () => {
    setSelectedNode(null);
  };

  const duplicateNode = (nodeId: string) => {
    const node = nodes.find((node) => node.id === nodeId);
    if (!node) {
      return;
    }

    // @ts-ignore
    const typeLabel = node.type.charAt(0).toUpperCase() + node.type.slice(1);
    const newNode = {
      id: `${nodes.length + 2}`,
      type: node.type,
      position: {
        x: 250,
        y: nodes.length > 0 ? nodes[nodes.length - 1].position.y + 150 : 100,
      },
      data: { ...node.data },
    };

    // @ts-ignore
    newNode.data.label = node.type.charAt(0).toUpperCase() + node.type.slice(1);
    newNode.data.name = `trigger_${typeLabel}_${
      nodes.length + 1
    }`.toLowerCase();
    setNodes((nds) => [...nds, { ...newNode }]);
  };

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      );
      // @ts-ignore
      if (selectedNode && selectedNode.id === nodeId) {
        setSelectedNode(null);
      }
    },
    [selectedNode, setNodes, setEdges],
  );

  const saveWorkflow = async (isTest: boolean = false) => {
    if (nodes.length == 0) {
      toast.error("You need at least one node to start the Worflow");
      return;
    }

    const triggerEvent = nodes[0].type;
    const workflow: { [key: string]: any } = {
      triggerEvent,
      nodes: [],
    };

    const mapNodesById: { [key: string]: any } = {};
    const nodesToProcess = [...nodes];
    for (let index = 0; index < nodesToProcess.length; index += 1) {
      const item = nodesToProcess[index];
      // @ts-ignore

      const isCustomNode = !validationDataNodeTypes[item.type];
      if (isCustomNode) {
        const schema = {};
        const config: { [key: string]: any } = item.data;
        config.properties
          .filter((property: any) => property.required)
          .forEach((property: { [key: string]: any }) => {
            if (property.name) {
              const isRequired = property.required;
              if (isRequired) {
                // @ts-ignore
                schema[property.name] = z.string();
              } else {
                // @ts-ignore
                schema[property.name] = z.string().optional();
              }
            }
          });

        const schemaValidation = z.object(schema);
        const result = schemaValidation.safeParse(item.data);
        if (!result.success) {
          toast.error(
            `You need to fill the information of the node ${item.data.name}`,
          );
          return;
        }
      } else {
        // @ts-ignore
        const schemaValidation = validationDataNodeTypes[item.type] as z.Schema;
        const result = schemaValidation.safeParse(item.data);

        if (!result.success) {
          toast.error(
            // @ts-ignore
            `You need to fill the information of the node ${item.data.name}`,
          );
          return;
        }
      }

      mapNodesById[item.id] = item;
    }

    const ignoreNodeById: { [key: string]: boolean } = {};
    for (let index = 0; index < nodesToProcess.length; index += 1) {
      const item = nodesToProcess[index];
      if (ignoreNodeById[item.id]) {
        continue;
      }

      workflow.nodes.push(
        parseBeforeRunOrSave(item, mapNodesById, ignoreNodeById, index, edges),
      );
    }

    if (isTest) {
      runWorkflow({
        isEditMode: worlflowToEditId != null,
        workflowId: worlflowToEditId,
        contextVariables: [],
        envData: [...envData],
        name: flowName || "",
        originalWorkflow: {
          nodes: [...nodes],
          edges: [...edges],
        },
        ...workflow,
      });
      return;
    }

    if (worlflowToEditId) {
      console.log({
        ...workflow,
        workflowId: worlflowToEditId,
        contextVariables: [],
        name: flowName || "",
        envData: [...envData],
        originalWorkflow: {
          nodes: [...nodes],
          edges: [...edges],
        },
      });
      await updateWorkflow({
        ...workflow,
        workflowId: worlflowToEditId,
        contextVariables: [],
        name: flowName || "",
        envData: [...envData],
        originalWorkflow: {
          nodes: [...nodes],
          edges: [...edges],
        },
      });
    } else {
      const workflowCreated = await createWorkflow({
        contextVariables: [],
        envData: [...envData],
        name: flowName || "",
        originalWorkflow: {
          nodes: [...nodes],
          edges: [...edges],
        },
        nodes: [...workflow.nodes],
      });

      setTimeout(() => {
        router.push(`/workflows/edit?id=${workflowCreated.id}`);
      }, 1000);
    }
  };

  const loadCustomNodes = async () => {
    const customNodes = await getCustomNodes();
    const items: any[] = [];
    const itemsTypes: any = {};
    const defaultDataByNodeTypesToCustomNodes: { [key: string]: any } = {};
    customNodes.forEach((node: any) => {
      itemsTypes[node.name] = CustomNode;
      const defaultData: { [key: string]: any } = {};
      node.properties.forEach((prop: any) => {
        defaultData[prop.name] = prop.default;
      });

      defaultDataByNodeTypesToCustomNodes[node.name] = {
        ...defaultData,
        properties: node.properties,
        isCustomNode: node.isCustomNode,
      };

      items.push({
        type: node.name,
        label: node.name,
        icon: GitBranch,
        description: node.description,
        color: "text-blue-500",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      });
    });

    setCustomNodes(items);
    setNodeTypes({ ...nodeTypes, ...itemsTypes });
    setDefaultDataByNodeTypes({
      ...defaultDataByNodeTypes,
      ...defaultDataByNodeTypesToCustomNodes,
    });
  };

  const setOptionsOfMenu = (
    type: string,
    values: Array<string> | string | EnvData[],
  ) => {
    if (type == TYPE_OPTION_MENU.ENV_DATA) {
      const items: EnvData[] = values as EnvData[];
      setOptionsMenu((oldOptionsMenu) => [
        ...oldOptionsMenu,
        ...items.map((item) => `{{this.state.envData.${item.key}}}`),
      ]);
    } else if (type == TYPE_OPTION_MENU.NEW_NODE) {
      const item: string = values as string;
      setOptionsMenu((oldOptionsMenu) => [
        ...oldOptionsMenu,
        `{{this.state.steps.${item}.output}}`,
      ]);
    } else if (type == TYPE_OPTION_MENU.NEW_MANY_NODES) {
      let items: Array<string> = values as Array<string>;
      items = items.map((item) => `{{this.state.steps.${item}.output}}`);
      setOptionsMenu((oldOptionsMenu) => [...oldOptionsMenu, ...items]);
    }
  };

  useEffect(() => {
    if (workflowToEdit) {
      loadCustomNodes().then(() => {
        workflowToEdit.originalWorkflow.nodes =
          workflowToEdit.originalWorkflow.nodes.map(
            (node: any, index: number) => {
              const type = node.type;
              const nodeDefaultData = defaultDataByNodeTypes[type];
              node.data.isCustomNode = nodeDefaultData.isCustomNode || false;
              const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
              node.data.name = `trigger_${typeLabel}_${
                index + 1
              }`.toLowerCase();
              return node;
            },
          );

        const nodesName: Array<string> =
          workflowToEdit.originalWorkflow.nodes.map(
            (item: { [key: string]: any }) => item?.data?.name,
          );

        setNodes(workflowToEdit.originalWorkflow.nodes);
        setEdges(workflowToEdit.originalWorkflow.edges);
        setWorkflowId(worlflowToEditId);
        setenvData([...workflowToEdit.envData]);
        setOptionsOfMenu(TYPE_OPTION_MENU.NEW_MANY_NODES, nodesName);
        setOptionsOfMenu(TYPE_OPTION_MENU.ENV_DATA, workflowToEdit.envData);
      });
    }
  }, [workflowToEdit]);

  useEffect(() => {
    document.title = `${flowName} - Flow Request Builder`;
  }, [flowName]);

  useEffect(() => {
    if (!workflowToEdit) {
      loadCustomNodes();
    }
  }, []);

  useEffect(() => {
    const savedSettings = localStorage.getItem("appSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettingsData(
          parsed.length > 0
            ? parsed
            : [{ id: "openRouterToken", key: "openRouterToken", value: "" }],
        );
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    }
  }, []);

  return (
    <div className="relative h-full">
      <ReactFlowProvider>
        <div ref={reactFlowWrapper} className="w-full h-[calc(100vh-4rem)]">
          <ReactFlow
            nodes={nodes.map((node) => ({
              ...node,
              data: {
                ...node.data,
                deleteNode: () => deleteNode(node.id),
                duplicateNode: () => duplicateNode(node.id),
              },
            }))}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className="w-full h-full"
          >
            <Controls />
            <Background />
            <Panel position="top-right" className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsSettingsModalOpen(true)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Collections
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => saveWorkflow(true)}
              >
                <Play className="mr-2 h-4 w-4" />
                Run Flow
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEnvDataModalOpen(true)}
              >
                <List className="mr-2 h-4 w-4" />
                Env Data
              </Button>
              <Button size="sm" onClick={() => saveWorkflow()}>
                <Save className="mr-2 h-4 w-4" />
                Save Flow
              </Button>
            </Panel>
            <Panel position="top-left" className="mt-4">
              <FlowSidebar
                onAddNode={addNode}
                httpRequestNodes={httpRequestNodes}
                customNodes={customNodes}
                onAddCurl={() => setIsAddCurlModalOpen(true)}
              />
            </Panel>
          </ReactFlow>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".yaml,.yml"
            style={{ display: "none" }}
          />

          <ChatComponent
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            placeholder="Need help with workflow creation?"
            maxHeight="300px"
            className="w-90 h-[400px]"
            title="Workflow Assistant"
            isFloating={true}
            defaultPosition={{ x: 350, y: 100 }}
            defaultMinimized={true}
          />
        </div>
        {selectedNode && (
          <NodeConfigPanel
            optionsMenu={optionsMenu}
            node={selectedNode}
            onChange={onNodeConfigChange}
            onClose={closeConfigPanel}
            isOpen={!!selectedNode}
          />
        )}
        <EnvDataModal
          isOpen={isEnvDataModalOpen}
          onClose={() => setIsEnvDataModalOpen(false)}
          envData={envData}
          onSave={(data) => {
            setOptionsOfMenu(TYPE_OPTION_MENU.ENV_DATA, data);
            setenvData(data);
          }}
        />
        <LogsModal
          isOpen={isLogsModalOpen}
          onClose={() => setIsLogsModalOpen(false)}
          logs={logs}
          isLoading={isRunningWorkflow}
        />
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          settings={settingsData}
          onSave={(data) => {
            setSettingsData(data);
            localStorage.setItem("appSettings", JSON.stringify(data));
          }}
        />
        <AddCurlModal
          isOpen={isAddCurlModalOpen}
          onClose={() => setIsAddCurlModalOpen(false)}
          onSave={(nodeData) => {
            addNode("api", nodeData);
          }}
        />
      </ReactFlowProvider>
      <ToastContainer />
    </div>
  );
}
