"use client";

import { useEffect, useState } from "react";
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
import useRemoteConfig, { normalizeBaseUrl } from "@/hooks/useRemoteConfig";
import { createScheduledFlow } from "@/services/scheduled-flows.service";
import { toast } from "react-toastify";

interface ScheduleFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: any;
  plugins: Array<Record<string, any>>;
}

const ScheduleFlowModal = ({ isOpen, onClose, workflow, plugins }: ScheduleFlowModalProps) => {
  const { baseUrl, apiKey, setBaseUrl, setApiKey, load } = useRemoteConfig();
  const [cronExpression, setCronExpression] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      load();
      setCronExpression("");
    }
  }, [isOpen, load]);

  const handleSchedule = async () => {
    if (!workflow) {
      toast.error("Select a workflow to schedule");
      return;
    }
    if (!baseUrl.trim()) {
      toast.error("Please enter the endpoint (API URL)");
      return;
    }
    if (!apiKey.trim()) {
      toast.error("Please enter the API key");
      return;
    }
    if (!cronExpression.trim()) {
      toast.error("Please enter a cron expression");
      return;
    }

    setIsSaving(true);
    try {
      const normalized = normalizeBaseUrl(baseUrl);
      const flowResponse = await fetch(`${normalized}/flow-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify({
          name: workflow.name,
          plugins: plugins || [],
          flow: {
            data: {
              nodes: workflow.data?.nodes || [],
              envData: workflow.data?.envData || [],
            },
          },
        }),
      });

      if (!flowResponse.ok) {
        const errorBody = await flowResponse.json().catch(() => null);
        throw new Error(errorBody?.error || `Flow save failed with status ${flowResponse.status}`);
      }

      const flowResult = await flowResponse.json();
      if (typeof flowResult.id !== "string" || !flowResult.id) {
        throw new Error("The remote service did not return a flow ID");
      }

      await createScheduledFlow(normalized, apiKey, {
        flow_request_id: flowResult.id,
        cron_expression: cronExpression.trim(),
      });

      toast.success(`Schedule created for "${workflow.name}"`);
      setCronExpression("");
      onClose();
    } catch (error: any) {
      toast.error(`Failed to schedule flow: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Schedule automation{workflow?.name ? `: ${workflow.name}` : ""}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The workflow will be saved to the remote runner before its schedule is created.
            Cron expressions are evaluated in UTC.
          </p>
          <div>
            <Label htmlFor="schedule-flow-endpoint">Endpoint</Label>
            <Input
              id="schedule-flow-endpoint"
              type="url"
              placeholder="https://your-app.example.com"
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="schedule-flow-api-key">API key</Label>
            <Input
              id="schedule-flow-api-key"
              type="password"
              placeholder="Enter API key"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="schedule-flow-cron">Cron expression (UTC)</Label>
            <Input
              id="schedule-flow-cron"
              placeholder="0 9 * * *"
              value={cronExpression}
              onChange={(event) => setCronExpression(event.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Example: <code>0 9 * * *</code> runs every day at 09:00 UTC.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSchedule} disabled={isSaving}>
            {isSaving ? "Scheduling..." : "Save schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleFlowModal;
