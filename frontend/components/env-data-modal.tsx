"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import EnvData from "@/types/env-data";
import { createEnvDataId, normalizeEnvData } from "@/utils/env-data";

interface EnvDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  envData: EnvData[];
  onSave: (data: EnvData[]) => void;
}

export function EnvDataModal({
  isOpen,
  onClose,
  envData,
  onSave,
}: EnvDataModalProps) {
  const [data, setData] = useState<EnvData[]>([]);

  const handleAddData = () => {
    const usedIds = data
      .map((item) => item.id)
      .filter((id): id is string => typeof id === "string");
    const newData: EnvData = {
      id: createEnvDataId(usedIds),
      key: "",
      value: "",
    };
    setData([...data, newData]);
  };

  const handleRemoveData = (id: string | undefined) => {
    setData(data.filter((item) => item.id !== id));
  };

  const handleDataChange = (
    id: string | undefined,
    field: keyof EnvData,
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
    onSave(validData);
    onClose();
  };

  useEffect(() => {
    setData(normalizeEnvData(envData));
  }, [envData]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Env Data</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto pr-4 -mr-4 max-h-[50vh]">
          <div className="space-y-6 py-2">
            {data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Env data stored here can be referenced on Flow.
              </div>
            ) : (
              data.map((item) => (
                <div key={item.id} className="grid gap-3 border-b pb-5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Env Data</h4>
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
                        placeholder="api_key"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`value-${item.id}`}>Value</Label>
                      <div className="relative">
                        <Input
                          id={`value-${item.id}`}
                          // @ts-ignore
                          type={"text"}
                          value={item.value}
                          onChange={(e) =>
                            handleDataChange(item.id, "value", e.target.value)
                          }
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddData}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Sensitive Data
          </Button>
        </div>

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
