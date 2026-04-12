"use client";

import { useEffect, useState } from "react";
import { Info, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { openRouterService, OpenRouterModel } from "@/services/openrouter.service";

interface SettingsData {
  id: string;
  key: string;
  value: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SettingsData[];
  onSave: (data: SettingsData[]) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
}: SettingsModalProps) {
  const [data, setData] = useState<SettingsData[]>([...settings]);
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [loadingModels, setLoadingModels] = useState(false);

  const fetchModels = async () => {
    setLoadingModels(true);
    try {
      const allModels = await openRouterService.getModels();
      const sortedModels = openRouterService.getPopularModels(allModels);
      setModels(sortedModels);
    } catch (error) {
      console.error("Failed to fetch models:", error);
    } finally {
      setLoadingModels(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const savedModel = localStorage.getItem("selectedModel") || "openai/gpt-4.1-mini";
      setSelectedModel(savedModel);
      if (models.length === 0) {
        fetchModels();
      }
    }
  }, [isOpen]);

  const handleRemoveData = (id: string) => {
    setData(data.filter((item) => item.id !== id));
  };

  const handleDataChange = (
    id: string,
    field: keyof SettingsData,
    value: string
  ) => {
    setData(
      data.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleSave = () => {
    const validData = data.filter((item) => item.key.trim() !== "");
    validData.forEach((item) => {
      localStorage.setItem(item.key, item.value);
    });
    if (selectedModel) {
      localStorage.setItem("selectedModel", selectedModel);
    }
    onClose();
  };

  const handleRefreshModels = () => {
    openRouterService.clearCache();
    fetchModels();
  };

  useEffect(() => {
    setData([...settings]);
  }, [settings]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure application settings here.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>How to Generate OpenRouter Token</AlertTitle>
          <AlertDescription>
            You can generate the 'openRouterToken' key by creating an account on{" "}
            <a
              href="https://openrouter.ai/"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://openrouter.ai/
            </a>
            , accessing the API keys option, and clicking 'Create api key'.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="model-select">AI Model for Workflow Assistant</Label>
              <p className="text-sm text-muted-foreground">
                Select the model used by the Workflow Assistant
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefreshModels}
              disabled={loadingModels}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${loadingModels ? "animate-spin" : ""}`} />
            </Button>
          </div>
          {loadingModels ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading models...</span>
            </div>
          ) : (
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger id="model-select">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="max-h-[300px]">
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex flex-col">
                        <span>{model.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {model.provider}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          )}
        </div>

        <ScrollArea className="flex-1 overflow-auto pr-4 -mr-4 max-h-[50vh]">
          <div className="space-y-6 py-2">
            {data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No settings configured yet.
              </div>
            ) : (
              data.map((item) => (
                <div key={item.id} className="grid gap-3 border-b pb-5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Setting</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveData(item.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`key-${item.id}`}>Key</Label>
                      <Input
                        id={`key-${item.id}`}
                        value={item.key}
                        onChange={(e) =>
                          handleDataChange(item.id, "key", e.target.value)
                        }
                        disabled={true}
                        placeholder="openRouterToken"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`value-${item.id}`}>Value</Label>
                      <Input
                        id={`value-${item.id}`}
                        value={item.value}
                        onChange={(e) =>
                          handleDataChange(item.id, "value", e.target.value)
                        }
                        placeholder="Enter value"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
