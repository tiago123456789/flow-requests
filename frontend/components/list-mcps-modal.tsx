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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import useRemoteConfig, { normalizeBaseUrl } from "@/hooks/useRemoteConfig";
import { McpFlow, parseMcpFlowSchema } from "@/types/mcp-flow";

interface ListMcpsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ListMcpsModal = ({ isOpen, onClose }: ListMcpsModalProps) => {
  const { baseUrl, apiKey, setBaseUrl, setApiKey, load } = useRemoteConfig();
  const [tools, setTools] = useState<McpFlow[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      load();
      setHasSearched(false);
    }
  }, [isOpen, load]);

  const handleClose = () => {
    setTools([]);
    setHasSearched(false);
    setIsSearching(false);
    setDeletingId(null);
    onClose();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!baseUrl.trim()) {
      toast.error("Please enter the endpoint (API URL)");
      return;
    }
    if (!window.confirm(`Delete MCP "${name}"?`)) return;
    setDeletingId(id);
    try {
      const normalized = normalizeBaseUrl(baseUrl);
      const response = await fetch(
        `${normalized}/mcp-flows/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: {
            "api-key": apiKey,
          },
        }
      );
      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error || `Request failed with status ${response.status}`);
      }
      setTools((prev) => prev.filter((t) => t.id !== id));
      toast.success(`MCP "${name}" deleted`);
    } catch (error: any) {
      toast.error(`Failed to delete MCP: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSearch = async () => {
    if (!baseUrl.trim()) {
      toast.error("Please enter the endpoint (API URL)");
      return;
    }
    setIsSearching(true);
    try {
      const normalized = normalizeBaseUrl(baseUrl);
      const response = await fetch(`${normalized}/mcp-flows`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
      });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data = await response.json();
      const list: McpFlow[] = data.tools ?? [];
      setTools(list);
      setHasSearched(true);
      toast.success(`Found ${list.length} MCP flow(s)`);
    } catch (error: any) {
      toast.error(`Failed to list MCPs: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>List MCPS</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="list-mcps-endpoint">Endpoint</Label>
              <Input
                id="list-mcps-endpoint"
                type="text"
                placeholder="https://your-app.onrender.com"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="list-mcps-api-key">API Key</Label>
              <Input
                id="list-mcps-api-key"
                type="password"
                placeholder="Enter API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>

          <ScrollArea className="max-h-96">
            {!hasSearched && tools.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Fill endpoint and api-key, then click Search to list registers
                from table mcp-flows.
              </p>
            ) : tools.length === 0 ? (
              <p className="text-sm text-muted-foreground">No MCPs found.</p>
            ) : (
              <div className="space-y-3">
                {tools.map((tool) => {
                  const schemaEntries = parseMcpFlowSchema(tool.schema);
                  return (
                    <div key={tool.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">{tool.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(tool.created_at).toLocaleString()}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title={`Delete ${tool.name}`}
                            disabled={deletingId === tool.id}
                            onClick={() => handleDelete(tool.id, tool.name)}
                          >
                            <Trash2 className="size-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {tool.description}
                      </p>
                      <p className="text-xs font-mono break-all">id: {tool.id}</p>
                      <p className="text-xs font-mono break-all">
                        flow_request_id: {tool.flow_request_id}
                      </p>
                      {schemaEntries.length > 0 ? (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold">schema:</p>
                          <ul className="text-xs space-y-1">
                            {schemaEntries.map((entry) => (
                              <li
                                key={entry.key}
                                className="font-mono bg-muted rounded px-2 py-1"
                              >
                                {entry.key}: {entry.type}
                                {entry.isRequired ? " (required)" : ""}
                                {entry.description
                                  ? ` — ${entry.description}`
                                  : ""}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          schema: []
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button onClick={handleClose} variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ListMcpsModal;
