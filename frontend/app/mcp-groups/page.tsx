"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  getRemoteConfig,
  saveRemoteConfig,
} from "@/hooks/useRemoteConfig";
import {
  createMcpGroup,
  deleteMcpGroup,
  fetchAvailableMcpTools,
  fetchMcpGroups,
  removeMcpGroupTool,
  resetMcpGroupToken,
  updateMcpGroup,
} from "@/services/mcp-groups.service";
import type { AvailableMcpTool, McpGroup } from "@/types/mcp-group";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error";
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export default function McpGroupsPage() {
  const [endpoint, setEndpoint] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [groups, setGroups] = useState<McpGroup[]>([]);
  const [availableTools, setAvailableTools] = useState<AvailableMcpTool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<McpGroup | null>(null);
  const [groupName, setGroupName] = useState("");
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const [toolSearch, setToolSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [isTokenOpen, setIsTokenOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenGroupName, setTokenGroupName] = useState("");

  const fetchData = useCallback(
    async (nextEndpoint: string, nextAdminKey: string) => {
      if (!nextEndpoint.trim()) {
        setGroups([]);
        setAvailableTools([]);
        return;
      }
      if (!nextAdminKey.trim()) {
        setError("API key is required to load MCP groups.");
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const [nextGroups, nextTools] = await Promise.all([
          fetchMcpGroups(nextEndpoint, nextAdminKey),
          fetchAvailableMcpTools(nextEndpoint, nextAdminKey),
        ]);
        setGroups(nextGroups);
        setAvailableTools(nextTools);
      } catch (loadError) {
        const message = getErrorMessage(loadError);
        setError(message);
        toast.error(`Failed to load MCP groups: ${message}`);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const stored = getRemoteConfig();
    setEndpoint(stored.baseUrl);
    setAdminKey(stored.apiKey);
    if (stored.baseUrl.trim() && stored.apiKey.trim()) {
      void fetchData(stored.baseUrl, stored.apiKey);
    }
  }, [fetchData]);

  const filteredTools = useMemo(() => {
    const search = toolSearch.trim().toLowerCase();
    const sorted = [...availableTools].sort((left, right) => {
      if (left.type !== right.type) return left.type === "built-in" ? -1 : 1;
      return left.name.localeCompare(right.name);
    });
    if (!search) return sorted;
    return sorted.filter((tool) => tool.name.toLowerCase().includes(search));
  }, [availableTools, toolSearch]);

  const handleSaveConfig = () => {
    if (!endpoint.trim()) {
      toast.error("Please enter the endpoint (API URL)");
      return;
    }
    if (!adminKey.trim()) {
      toast.error("Please enter the admin API key");
      return;
    }
    saveRemoteConfig(endpoint, adminKey);
    toast.success("Remote config saved");
    void fetchData(endpoint, adminKey);
  };

  const handleRefresh = () => {
    if (!endpoint.trim()) {
      toast.error("Please enter the endpoint (API URL)");
      return;
    }
    if (!adminKey.trim()) {
      toast.error("Please enter the admin API key");
      return;
    }
    void fetchData(endpoint, adminKey);
  };

  const openCreate = () => {
    setEditingGroup(null);
    setGroupName("");
    setSelectedTools(new Set());
    setToolSearch("");
    setIsFormOpen(true);
  };

  const openEdit = (group: McpGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setSelectedTools(new Set(group.tools));
    setToolSearch("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingGroup(null);
    setGroupName("");
    setSelectedTools(new Set());
    setToolSearch("");
  };

  const toggleTool = (toolName: string) => {
    setSelectedTools((previous) => {
      const next = new Set(previous);
      if (next.has(toolName)) next.delete(toolName);
      else next.add(toolName);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!endpoint.trim() || !adminKey.trim()) {
      toast.error("Configure the remote endpoint and admin API key first");
      return;
    }

    const trimmedName = groupName.trim();
    if (!trimmedName) {
      toast.error("Please enter a group name");
      return;
    }
    if (trimmedName.length > 255) {
      toast.error("Group name must be 255 characters or fewer");
      return;
    }

    setIsSaving(true);
    try {
      const tools = [...selectedTools];
      if (editingGroup) {
        const updated = await updateMcpGroup(
          endpoint,
          adminKey,
          editingGroup.id,
          { name: trimmedName, tools }
        );
        setGroups((previous) =>
          previous.map((group) =>
            group.id === updated.id ? updated : group
          )
        );
        toast.success(`MCP group "${updated.name}" updated`);
        closeForm();
      } else {
        const result = await createMcpGroup(endpoint, adminKey, {
          name: trimmedName,
          tools,
        });
        setGroups((previous) => [result.group, ...previous]);
        setIsFormOpen(false);
        setEditingGroup(null);
        setToken(result.token);
        setTokenGroupName(result.group.name);
        setIsTokenOpen(true);
        toast.success(`MCP group "${result.group.name}" created`);
      }
    } catch (saveError) {
      toast.error(`Failed to save MCP group: ${getErrorMessage(saveError)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (group: McpGroup) => {
    if (!window.confirm(`Delete MCP group "${group.name}"?`)) return;

    setBusyAction(`delete:${group.id}`);
    try {
      await deleteMcpGroup(endpoint, adminKey, group.id);
      setGroups((previous) => previous.filter((item) => item.id !== group.id));
      toast.success(`MCP group "${group.name}" deleted`);
    } catch (deleteError) {
      toast.error(`Failed to delete MCP group: ${getErrorMessage(deleteError)}`);
    } finally {
      setBusyAction(null);
    }
  };

  const handleResetToken = async (group: McpGroup) => {
    if (
      !window.confirm(
        `Reset the token for "${group.name}"? The current token will stop working.`
      )
    ) {
      return;
    }

    setBusyAction(`reset:${group.id}`);
    try {
      const result = await resetMcpGroupToken(endpoint, adminKey, group.id);
      setToken(result.token);
      setTokenGroupName(group.name);
      setIsTokenOpen(true);
      toast.success(`Token reset for "${group.name}"`);
    } catch (resetError) {
      toast.error(`Failed to reset token: ${getErrorMessage(resetError)}`);
    } finally {
      setBusyAction(null);
    }
  };

  const handleRemoveTool = async (group: McpGroup, toolName: string) => {
    if (!window.confirm(`Remove "${toolName}" from "${group.name}"?`)) return;

    setBusyAction(`tool:${group.id}:${toolName}`);
    try {
      const updated = await removeMcpGroupTool(
        endpoint,
        adminKey,
        group.id,
        toolName
      );
      setGroups((previous) =>
        previous.map((item) => (item.id === updated.id ? updated : item))
      );
      toast.success(`Removed "${toolName}" from "${group.name}"`);
    } catch (removeError) {
      toast.error(`Failed to remove tool: ${getErrorMessage(removeError)}`);
    } finally {
      setBusyAction(null);
    }
  };

  const copyToken = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      toast.success("Token copied to clipboard");
    } catch {
      toast.error("Failed to copy token");
    }
  };

  const selectAllTools = () => {
    setSelectedTools(new Set(availableTools.map((tool) => tool.name)));
  };

  return (
    <main className="min-h-screen bg-background">
      <ToastContainer />
      <div className="container mx-auto space-y-6 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <Link href="/workflows/list">
              <Button variant="outline" size="sm">
                <ArrowLeft />
                Flows
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">MCP Groups</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Create scoped MCP endpoints for AI clients. Each group receives an
              <span className="font-mono"> mg_... </span>
              token that can only list and invoke the selected tools.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={isLoading ? "animate-spin" : undefined} />
              Refresh
            </Button>
            <Button onClick={openCreate}>
              <Plus />
              Create group
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Remote connection</CardTitle>
            <CardDescription>
              Use the admin API key. It is stored in localStorage and shared with
              the other remote features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="mcp-groups-endpoint">Endpoint (API URL)</Label>
                <Input
                  id="mcp-groups-endpoint"
                  type="text"
                  placeholder="https://your-app.onrender.com"
                  value={endpoint}
                  onChange={(event) => setEndpoint(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mcp-groups-api-key">Admin API key</Label>
                <Input
                  id="mcp-groups-api-key"
                  type="password"
                  placeholder="Enter admin API key"
                  value={adminKey}
                  onChange={(event) => setAdminKey(event.target.value)}
                />
              </div>
              <Button variant="secondary" onClick={handleSaveConfig}>
                <Settings />
                Save
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Groups</h2>
          <Badge variant="secondary">{groups.length}</Badge>
        </div>

        {isLoading && groups.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" />
            Loading MCP groups...
          </div>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No MCP groups found. Configure the remote connection and create a
              group to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
              <Card key={group.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-lg">
                        {group.name}
                      </CardTitle>
                      <CardDescription>
                        Updated {formatDate(group.updated_at)}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {group.tools.length} tools
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  {group.tools.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No tools selected.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {group.tools.map((toolName) => {
                        const actionKey = `tool:${group.id}:${toolName}`;
                        return (
                          <Badge
                            key={toolName}
                            variant="outline"
                            className="gap-1 py-1 pl-2 pr-1 font-mono text-xs"
                          >
                            {toolName}
                            <button
                              type="button"
                              aria-label={`Remove ${toolName}`}
                              title={`Remove ${toolName}`}
                              disabled={busyAction === actionKey}
                              onClick={() =>
                                void handleRemoveTool(group, toolName)}
                              className="rounded-full p-0.5 hover:bg-muted disabled:opacity-50"
                            >
                              {busyAction === actionKey ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <X className="size-3" />
                              )}
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2 border-t pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(group)}
                    disabled={busyAction !== null}
                  >
                    <Pencil />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleResetToken(group)}
                    disabled={busyAction !== null}
                  >
                    <KeyRound />
                    Reset token
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => void handleDelete(group)}
                    disabled={busyAction !== null}
                  >
                    <Trash2 />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? "Edit MCP group" : "Create MCP group"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="mcp-group-name">Name</Label>
              <Input
                id="mcp-group-name"
                type="text"
                placeholder="employee"
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <Label>Tools</Label>
                  <p className="text-xs text-muted-foreground">
                    {selectedTools.size} selected
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={selectAllTools}
                  >
                    Select all
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedTools(new Set())}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  type="search"
                  placeholder="Search tools"
                  value={toolSearch}
                  onChange={(event) => setToolSearch(event.target.value)}
                />
              </div>

              <ScrollArea className="h-72 rounded-md border">
                <div className="space-y-1 p-2">
                  {filteredTools.length === 0 ? (
                    <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                      No tools available.
                    </p>
                  ) : (
                    filteredTools.map((tool) => {
                      const selected = selectedTools.has(tool.name);
                      return (
                        <button
                          key={tool.name}
                          type="button"
                          onClick={() => toggleTool(tool.name)}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition-colors",
                            selected
                              ? "border-primary bg-primary/5"
                              : "border-transparent hover:bg-muted"
                          )}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="truncate font-mono text-sm">
                              {tool.name}
                            </span>
                            <Badge
                              variant={tool.type === "built-in"
                                ? "secondary"
                                : "outline"}
                              className="text-[10px]"
                            >
                              {tool.type}
                            </Badge>
                          </span>
                          <span
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded border",
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/30"
                            )}
                          >
                            {selected && <Check className="size-3" />}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={isSaving}>
              {isSaving && <Loader2 className="animate-spin" />}
              {editingGroup ? "Save changes" : "Create group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isTokenOpen}
        onOpenChange={(open) => {
          setIsTokenOpen(open);
          if (!open) {
            setToken(null);
            setTokenGroupName("");
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {tokenGroupName
                ? `API key for "${tokenGroupName}"`
                : "MCP group API key"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Use this token as the <span className="font-mono">api-key</span>{" "}
              when connecting an MCP client. It expires after one year. Store it
              now; resetting the token invalidates this one.
            </p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={token ?? ""}
                className="font-mono text-xs"
              />
              <Button onClick={() => void copyToken()}>
                <Copy />
                Copy
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setIsTokenOpen(false);
                setToken(null);
                setTokenGroupName("");
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
