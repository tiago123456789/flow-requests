"use client";
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
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";
import { useState } from "react";
import { FormConfig, FormField, FieldOption, FieldType } from "@/types/form-builder"
import { getRemoteConfig } from "@/hooks/useRemoteConfig";

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "password", label: "Password" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "file", label: "File" },
  { value: "select", label: "Select" },
];

interface FormBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: {
    id: string;
    name: string;
    data: {
      nodes?: unknown[];
      envData?: unknown[];
    };
  } | null;
  packages: Array<{
    enabled?: boolean;
    libraryName: string;
    url: string;
  }>;
}

function createField(): FormField {
  return {
    id: crypto.randomUUID(),
    label: "",
    name: "",
    type: "text",
    required: false,
    options: [],
  };
}

function createOption(): FieldOption {
  return { label: "", value: "" };
}

const FormBuilderModal = ({ isOpen, onClose, workflow, packages }: FormBuilderModalProps) => {
  const [title, setTitle] = useState("Flow requests form");
  const [buttonText, setButtonText] = useState("Confirm data");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FormField[]>([createField()]);
  const [createdFormId, setCreatedFormId] = useState<string | null>(null);
  const [formLink, setFormLink] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const reset = () => {
    setTitle("Flow requests form");
    setButtonText("Confirm data");
    setDescription("");
    setFields([createField()]);
    setCreatedFormId(null);
    setFormLink("");
    setIsCreating(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const addField = () => {
    setFields((prev) => [...prev, createField()]);
  };

  const addOption = (fieldId: string) => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === fieldId ? { ...f, options: [...f.options, createOption()] } : f
      )
    );
  };

  const updateOption = (
    fieldId: string,
    optionIndex: number,
    updates: Partial<FieldOption>
  ) => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === fieldId
          ? {
            ...f,
            options: f.options.map((o, i) =>
              i === optionIndex ? { ...o, ...updates } : o
            ),
          }
          : f
      )
    );
  };

  const removeOption = (fieldId: string, optionIndex: number) => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === fieldId
          ? { ...f, options: f.options.filter((_, i) => i !== optionIndex) }
          : f
      )
    );
  };

  const validate = (): boolean => {
    if (!title.trim()) {
      toast.error("Please enter a form title");
      return false;
    }
    if (!buttonText.trim()) {
      toast.error("Please enter a button text");
      return false;
    }
    if (!workflow) {
      toast.error("Select a workflow before creating a form");
      return false;
    }
    if (fields.length === 0) {
      toast.error("Please add at least one field");
      return false;
    }
    for (const field of fields) {
      if (!field.label.trim()) {
        toast.error("All fields must have a label");
        return false;
      }
      if (!field.name.trim()) {
        toast.error("All fields must have a name");
        return false;
      }
      if (
        fields.some((other) => other.id !== field.id && other.name.trim() === field.name.trim())
      ) {
        toast.error("Field names must be unique");
        return false;
      }
      if (field.type === "select") {
        if (field.options.length === 0) {
          toast.error(`Field "${field.label}" must have at least one option`);
          return false;
        }
        for (const opt of field.options) {
          if (!opt.label.trim() || !opt.value.trim()) {
            toast.error(
              `All options in "${field.label}" must have a label and value`
            );
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validate()) return;

    setIsCreating(true);
    try {
      const backendBaseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "").trim().replace(/\/+$/, "");
      const { apiKey } = getRemoteConfig();
      if (!backendBaseUrl) {
        throw new Error("NEXT_PUBLIC_BACKEND_URL is not configured in the frontend environment");
      }
      if (!apiKey) {
        throw new Error("Configure the remote API key before creating a form");
      }
      if (!workflow) {
        throw new Error("Select a workflow before creating a form");
      }

      const inputs = fields
        .filter((f) => f.label.trim() && f.name.trim())
        .map(
          ({ label, name, type, required, options }) => {
            const input: FormConfig["inputs"][number] = {
              label,
              name,
              type,
            };
            if (required) input.required = true;
            if (type === "select" && options.length > 0) {
              input.options = options.filter(
                (o) => o.label.trim() && o.value.trim()
              );
            }
            return input;
          }
        );

      const config: FormConfig = {
        title: title.trim(),
        buttonText: buttonText.trim(),
        description: description.trim(),
        inputs,
      };

      const flowResponse = await fetch(`${backendBaseUrl}/flow-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify({
          name: workflow.name,
          plugins: packages,
          flow: {
            data: {
              nodes: workflow.data.nodes || [],
              envData: workflow.data.envData || [],
            },
          },
        }),
      });
      const flowResult = await flowResponse.json().catch(() => ({}));
      if (!flowResponse.ok || typeof flowResult.id !== "string") {
        throw new Error(flowResult.error || `Failed to save flow (HTTP ${flowResponse.status})`);
      }

      const formResponse = await fetch(`${backendBaseUrl}/forms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify({
          data: {
            title: config.title,
            buttonText: config.buttonText,
            inputs: config.inputs,
          },
          description: config.description,
          flow_request_id: flowResult.id,
        }),
      });
      const formResult = await formResponse.json().catch(() => ({}));
      if (!formResponse.ok || typeof formResult.id !== "string" || typeof formResult.render_url !== "string") {
        throw new Error(formResult.error || `Failed to save form (HTTP ${formResponse.status})`);
      }

      const link = new URL(formResult.render_url, `${backendBaseUrl}/`).toString();
      setCreatedFormId(formResult.id);
      setFormLink(link);
      toast.success("Form created successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create form");
    } finally {
      setIsCreating(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(formLink);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="min-w-6xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Form Builder</DialogTitle>
          <div>
            {!createdFormId ? (
              <DialogFooter>
                <br /><br />
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Form"}
                </Button>
              </DialogFooter>
            ) : (
              <>
                <Button onClick={copyLink}>Copy Link</Button>&nbsp;
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
              </>
            )}

          </div>
        </DialogHeader>

        {!createdFormId ? (
          <>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="form-title">Form Title</Label>
                <Input
                  id="form-title"
                  type="text"
                  placeholder="Flow requests form"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="button-text">Button Text</Label>
                <Input
                  id="button-text"
                  type="text"
                  placeholder="Confirm data"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="form-description">Description</Label>
                <Input
                  id="form-description"
                  type="text"
                  maxLength={150}
                  placeholder="Describe what this form is for"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Up to 150 characters.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Form Fields</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addField}
                  >
                    <Plus className="size-4 mr-1" />
                    Add Field
                  </Button>
                </div>

                <ScrollArea className="max-h-96">
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="border rounded-lg p-4 space-y-3 relative"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            Field {index + 1}
                          </span>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeField(field.id)}
                            >
                              <Trash2 className="size-4 text-red-500" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Label</Label>
                            <Input
                              placeholder="Field label"
                              value={field.label}
                              onChange={(e) =>
                                updateField(field.id, {
                                  label: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                              placeholder="Field name"
                              value={field.name}
                              onChange={(e) =>
                                updateField(field.id, {
                                  name: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select
                            value={field.type}
                            onValueChange={(value: FieldType) =>
                              updateField(field.id, { type: value })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FIELD_TYPES.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`required-${field.id}`}
                            checked={field.required}
                            onChange={(e) =>
                              updateField(field.id, {
                                required: e.target.checked,
                              })
                            }
                            className="size-4"
                          />
                          <Label htmlFor={`required-${field.id}`}>
                            Required
                          </Label>
                        </div>

                        {field.type === "select" && (
                          <div className="space-y-2 pl-4 border-l-2 border-muted">
                            <div className="flex items-center justify-between">
                              <Label>Options</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addOption(field.id)}
                              >
                                <Plus className="size-3 mr-1" />
                                Add Option
                              </Button>
                            </div>
                            {field.options.map((option, optIndex) => (
                              <div
                                key={optIndex}
                                className="flex items-center gap-2"
                              >
                                <Input
                                  placeholder="Label"
                                  value={option.label}
                                  onChange={(e) =>
                                    updateOption(field.id, optIndex, {
                                      label: e.target.value,
                                    })
                                  }
                                  className="flex-1"
                                />
                                <Input
                                  placeholder="Value"
                                  value={option.value}
                                  onChange={(e) =>
                                    updateOption(field.id, optIndex, {
                                      value: e.target.value,
                                    })
                                  }
                                  className="flex-1"
                                />
                                {field.options.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      removeOption(field.id, optIndex)
                                    }
                                  >
                                    <X className="size-4 text-red-500" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

          </>
        ) : (
          <>
            <div className="space-y-4">
              <div
                className="rounded-lg border border-green-200 bg-green-50 p-4"
                role="alert"
              >
                <p className="font-semibold text-green-800">
                  Form created successfully!
                </p>
                <p className="mt-1 text-sm text-green-700">
                  Access your form at:
                </p>
                <a
                  href={formLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block break-all text-sm font-medium text-green-700 underline"
                >
                  {formLink}
                </a>
              </div>
            </div>


          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FormBuilderModal;
