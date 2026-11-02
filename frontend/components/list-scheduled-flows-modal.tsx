"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
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
import useRemoteConfig from "@/hooks/useRemoteConfig";
import {
  deleteScheduledFlow,
  getScheduledFlows,
} from "@/services/scheduled-flows.service";
import type { ScheduledFlow } from "@/types/scheduled-flow";

interface ListScheduledFlowsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ListScheduledFlowsModal = ({ isOpen, onClose }: ListScheduledFlowsModalProps) => {
  const { baseUrl, apiKey, setBaseUrl, setApiKey, load } = useRemoteConfig();
  const [schedules, setSchedules] = useState<ScheduledFlow[]>([]);
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
    setSchedules([]);
    setHasSearched(false);
    setDeletingId(null);
    onClose();
  };

  const handleSearch = async () => {
    if (!baseUrl.trim()) {
      toast.error("Please enter the endpoint (API URL)");
      return;
    }
    if (!apiKey.trim()) {
      toast.error("Please enter the API key");
      return;
    }

    setIsSearching(true);
    try {
      const result = await getScheduledFlows(baseUrl, apiKey);
      setSchedules(result.schedules || []);
      setHasSearched(true);
      toast.success(`Found ${(result.schedules || []).length} scheduled flow(s)`);
    } catch (error: any) {
      toast.error(`Failed to list scheduled flows: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDelete = async (schedule: ScheduledFlow) => {
    if (!window.confirm(`Delete the schedule for "${schedule.flow_name}"?`)) return;

    const id = String(schedule.id);
    setDeletingId(id);
    try {
      await deleteScheduledFlow(baseUrl, apiKey, schedule.id);
      setSchedules((current) => current.filter((item) => String(item.id) !== id));
      toast.success(`Schedule for "${schedule.flow_name}" deleted`);
    } catch (error: any) {
      toast.error(`Failed to delete schedule: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Scheduled Flows</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="scheduled-flows-endpoint">Endpoint</Label>
              <Input
                id="scheduled-flows-endpoint"
                type="url"
                placeholder="https://your-app.example.com"
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="scheduled-flows-api-key">API key</Label>
              <Input
                id="scheduled-flows-api-key"
                type="password"
                placeholder="Enter API key"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
              />
            </div>
          </div>
          <Button type="button" onClick={handleSearch} disabled={isSearching}>
            {isSearching ? "Searching..." : "Search"}
          </Button>

          <ScrollArea className="max-h-96">
            {!hasSearched ? (
              <p className="text-sm text-muted-foreground">
                Enter the remote endpoint and API key, then search for scheduled flows.
              </p>
            ) : schedules.length === 0 ? (
              <p className="text-sm text-muted-foreground">No scheduled flows found.</p>
            ) : (
              <div className="space-y-3">
                {schedules.map((schedule) => {
                  const id = String(schedule.id);
                  return (
                    <div key={id} className="space-y-2 rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold break-words">{schedule.flow_name}</p>
                          <p className="text-xs font-mono break-all">
                            flow_request_id: {schedule.flow_request_id}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title={`Delete schedule for ${schedule.flow_name}`}
                          aria-label={`Delete schedule for ${schedule.flow_name}`}
                          disabled={deletingId === id}
                          onClick={() => handleDelete(schedule)}
                        >
                          <Trash2 className="size-4 text-red-500" />
                        </Button>
                      </div>
                      <p className="text-sm">
                        Cron (UTC): <code>{schedule.cron_expression}</code>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Next execution (UTC):{" "}
                        {new Date(schedule.next_execution_at).toLocaleString(undefined, {
                          timeZone: "UTC",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(schedule.created_at).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ListScheduledFlowsModal;
