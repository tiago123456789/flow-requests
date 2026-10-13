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
import { toast } from "react-toastify";
import useRemoteConfig from "@/hooks/useRemoteConfig";

interface ConfigureRemoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConfigureRemoteModal = ({ isOpen, onClose }: ConfigureRemoteModalProps) => {
  const { baseUrl, apiKey, setBaseUrl, setApiKey, load, save, clear } =
    useRemoteConfig();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  const handleSave = () => {
    if (!baseUrl.trim()) {
      toast.error("Please enter the API URL (endpoint)");
      return;
    }
    setIsSaving(true);
    try {
      save(baseUrl, apiKey);
      toast.success("Remote config saved to localStorage!");
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    clear();
    toast.success("Remote config cleared");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure remote flow-requests</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Set the remote endpoint and api-key once. They are stored in
            localStorage and reused by &quot;List MCPS&quot; and other remote
            places.
          </p>
          <div>
            <Label htmlFor="remote-config-url">Endpoint (API URL)</Label>
            <Input
              id="remote-config-url"
              type="text"
              placeholder="https://your-app.onrender.com"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="remote-config-key">API Key</Label>
            <Input
              id="remote-config-key"
              type="password"
              placeholder="Enter API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleClear} variant="outline">
            Clear
          </Button>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigureRemoteModal;
