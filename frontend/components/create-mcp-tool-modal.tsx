"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import useRemoteConfig, { normalizeBaseUrl } from "@/hooks/useRemoteConfig";
import { McpFlowSchemaEntry } from "@/types/mcp-flow";

const MCP_NAME_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;
const STATIC_TOOL_NAMES = [
  "run_flow_request",
  "get_flow_created",
  "get_webhooks",
  "refresh_mcp_tools",
];
const SCHEMA_TYPES = [
  "string",
  "number",
  "boolean",
  "integer",
  "int",
  "bigint",
  "uuid",
  "email",
  "url",
  "datetime",
  "date",
  "array",
  "object",
  "any",
  "unknown",
  "json",
];

interface CreateMcpToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: any | null;
  packages?: any[];
}

function createSchemaEntry(): McpFlowSchemaEntry {
  return { key: "", type: "string", isRequired: true, description: "" };
}

const CreateMcpToolModal = ({
  isOpen,
  onClose,
  workflow,
  packages = [],
}: CreateMcpToolModalProps) => {
  const { baseUrl, apiKey, setBaseUrl, setApiKey, load } = useRemoteConfig();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [flowRequestId, setFlowRequestId] = useState("");
  const [schemaEntries, setSchemaEntries] = useState<McpFlowSchemaEntry[]>([
    createSchemaEntry(),
  ]);
  const [isSavingFlow, setIsSavingFlow] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      load();
      setName("");
      setDescription("");
      setFlowRequestId("");
      setSchemaEntries([createSchemaEntry()]);
      setIsSavingFlow(false);
      setIsCreating(false);
    }
  }, [isOpen, load]);

  const updateEntry = (index: number, updates: Partial<McpFlowSchemaEntry>) => {
    setSchemaEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, ...updates } : e))
    );
  };

  const addEntry = () => {
    setSchemaEntries((prev) => [...prev, createSchemaEntry()]);
  };

  const removeEntry = (index: number) => {
    setSchemaEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveFlowRemotely = async () => {
    if (!baseUrl.trim()) {
      toast.error("Please enter the endpoint (API URL)");
      return;
    }
    if (!workflow) {
      toast.error("No workflow selected");
      return;
    }
    setIsSavingFlow(true);
    try {
      const normalized = normalizeBaseUrl(baseUrl);
      const requestBody = {
        name: workflow.name,
        plugins: packages || [],
        flow: {
          data: {
            nodes: workflow.data?.nodes,
            envData: workflow.data?.envData,
          },
        },
      };
      const response = await fetch(`${normalized}/flow-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error || `Request failed with status ${response.status}`);
      }
      const data = await response.json();
      setFlowRequestId(data.id);
      toast.success("Flow request saved, id reused!");
    } catch (error: any) {
      toast.error(`Failed to save flow request: ${error.message}`);
    } finally {
      setIsSavingFlow(false);
    }
  };

  const validate = (): boolean => {
    if (!name.trim() || !MCP_NAME_REGEX.test(name.trim())) {
      toast.error("Name must match ^[a-zA-Z0-9_-]{1,64}$");
      return false;
    }
    if (STATIC_TOOL_NAMES.includes(name.trim())) {
      toast.error(`Name "${name.trim()}" collides with a built-in tool`);
      return false;
    }
    if (!description.trim()) {
      toast.error("Please enter a description");
      return false;
    }
    if (!flowRequestId.trim()) {
      toast.error("Please save the flow remotely or enter flow_request_id");
      return false;
    }
    const seen = new Set<string>();
    for (const entry of schemaEntries) {
      if (!entry.key.trim() || !MCP_NAME_REGEX.test(entry.key.trim())) {
        toast.error(`Schema key "${entry.key}" must match ^[a-zA-Z0-9_-]{1,64}$`);
        return false;
      }
      if (seen.has(entry.key.trim())) {
        toast.error(`Duplicate schema key "${entry.key}"`);
        return false;
      }
      seen.add(entry.key.trim());
      if (!entry.type.trim()) {
        toast.error(`Schema entry "${entry.key}" must have a type`);
        return false;
      }
    }
    return true;
  };

  const handleCreate = async () => {
    if (!baseUrl.trim()) {
      toast.error("Please enter the endpoint (API URL)");
      return;
    }
    if (!validate()) return;
    setIsCreating(true);
    try {
      const normalized = normalizeBaseUrl(baseUrl);
      const body = {
        name: name.trim(),
        description: description.trim(),
        schema: schemaEntries.map((e) => ({
          key: e.key.trim(),
          type: e.type.trim(),
          isRequired: e.isRequired,
          description: (e.description || "").trim(),
        })),
        flow_request_id: flowRequestId.trim(),
      };
      const response = await fetch(`${normalized}/mcp-flows`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error || `Request failed with status ${response.status}`);
      }
      const data = await response.json();
      toast.success(`MCP tool created! id: ${data.id}`);
      onClose();
    } catch (error: any) {
      toast.error(`Failed to create MCP: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a MCP&apos;s tool</DialogTitle>
          <div>
            <DialogFooter>
              <br />
              <br />
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="create-mcp-endpoint">Endpoint</Label>
              <Input
                id="create-mcp-endpoint"
                type="text"
                placeholder="https://your-app.onrender.com"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="create-mcp-api-key">API Key</Label>
              <Input
                id="create-mcp-api-key"
                type="password"
                placeholder="Enter API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="create-mcp-name">Name</Label>
            <Input
              id="create-mcp-name"
              type="text"
              placeholder="send_telegram_message_v3"
              value={name}
              onChange={(e) => setName(e.target.value.replace(/\s+/g, "_"))}
            />
          </div>
          <div>
            <Label htmlFor="create-mcp-description">Description</Label>
            <Input
              id="create-mcp-description"
              type="text"
              placeholder="Send message via Telegram v3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="create-mcp-flow-id">flow_request_id</Label>
            <div className="flex gap-2">
              <Input
                id="create-mcp-flow-id"
                type="text"
                placeholder="ff1f4524-d2b4-4a02-9795-71dec8f0413f"
                value={flowRequestId}
                onChange={(e) => setFlowRequestId(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveFlowRemotely}
                disabled={isSavingFlow}
              >
                {isSavingFlow ? "Saving..." : "Save flow & use id"}
              </Button>
            </div>
            {workflow && (
              <p className="text-xs text-muted-foreground mt-1">
                From workflow: {workflow.name}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Schema (array)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addEntry}>
                <Plus className="size-4 mr-1" />
                Add item
              </Button>
            </div>
            <ScrollArea className="max-h-96">
              <div className="space-y-3">
                {schemaEntries.map((entry, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Item {index + 1}
                      </span>
                      {schemaEntries.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEntry(index)}
                        >
                          <Trash2 className="size-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Key</Label>
                        <Input
                          placeholder="message"
                          value={entry.key}
                          onChange={(e) =>
                            updateEntry(index, {
                              key: e.target.value.replace(/\s+/g, "_"),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={entry.type}
                          onValueChange={(value) => updateEntry(index, { type: value })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SCHEMA_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`mcp-required-${index}`}
                        checked={entry.isRequired}
                        onChange={(e) =>
                          updateEntry(index, { isRequired: e.target.checked })
                        }
                        className="size-4"
                      />
                      <Label htmlFor={`mcp-required-${index}`}>isRequired</Label>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        placeholder="message text"
                        value={entry.description || ""}
                        onChange={(e) =>
                          updateEntry(index, { description: e.target.value })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMcpToolModal;
