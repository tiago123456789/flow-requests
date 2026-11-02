"use client";

import { useEffect, useState } from "react";
import { Copy, ExternalLink, Trash2 } from "lucide-react";
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
import useRemoteConfig, { normalizeBaseUrl } from "@/hooks/useRemoteConfig";
import { deleteForm, getForms } from "@/services/forms.service";
import type { FormFlow } from "@/types/form-flow";

interface ListFormsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ListFormsModal = ({ isOpen, onClose }: ListFormsModalProps) => {
  const { baseUrl, apiKey, setBaseUrl, setApiKey, load } = useRemoteConfig();
  const [forms, setForms] = useState<FormFlow[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    load();
    const configuredBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
    if (configuredBackendUrl) setBaseUrl(configuredBackendUrl);
    setForms([]);
    setHasSearched(false);
  }, [isOpen, load, setBaseUrl]);

  const handleClose = () => {
    setForms([]);
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
      const result = await getForms(baseUrl, apiKey);
      setForms(result.forms || []);
      setHasSearched(true);
      toast.success(`Found ${(result.forms || []).length} form(s)`);
    } catch (error) {
      toast.error(`Failed to list forms: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSearching(false);
    }
  };

  const getRenderLink = (form: FormFlow) =>
    new URL(form.render_url, `${normalizeBaseUrl(baseUrl)}/`).toString();

  const copyRenderLink = async (form: FormFlow) => {
    try {
      await navigator.clipboard.writeText(getRenderLink(form));
      toast.success("Form link copied to clipboard");
    } catch {
      toast.error("Failed to copy form link");
    }
  };

  const handleDelete = async (form: FormFlow) => {
    if (!window.confirm(`Delete the form "${form.title || form.id}"?`)) return;

    setDeletingId(form.id);
    try {
      await deleteForm(baseUrl, apiKey, form.id);
      setForms((current) => current.filter((item) => item.id !== form.id));
      toast.success("Form deleted");
    } catch (error) {
      toast.error(`Failed to delete form: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Flow Forms</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="forms-endpoint">Endpoint</Label>
              <Input
                id="forms-endpoint"
                type="url"
                placeholder="https://your-app.example.com"
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="forms-api-key">API key</Label>
              <Input
                id="forms-api-key"
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
                Enter the backend endpoint and API key, then search for forms.
              </p>
            ) : forms.length === 0 ? (
              <p className="text-sm text-muted-foreground">No forms found.</p>
            ) : (
              <div className="space-y-3">
                {forms.map((form) => {
                  const renderLink = getRenderLink(form);
                  return (
                    <div key={form.id} className="space-y-2 rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold break-words">
                            {form.title || "Untitled form"}
                          </p>
                          {form.description && (
                            <p className="text-sm text-muted-foreground break-words">
                              {form.description}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            title="Copy form link"
                            aria-label="Copy form link"
                            onClick={() => copyRenderLink(form)}
                          >
                            <Copy className="size-4" />
                          </Button>
                          <Button type="button" variant="outline" size="icon" asChild>
                            <a href={renderLink} target="_blank" rel="noopener noreferrer" aria-label="Open form">
                              <ExternalLink className="size-4" />
                            </a>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title={`Delete ${form.title || "form"}`}
                            aria-label={`Delete ${form.title || "form"}`}
                            disabled={deletingId === form.id}
                            onClick={() => handleDelete(form)}
                          >
                            <Trash2 className="size-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm">Flow: {form.flow_name || "Unknown flow"}</p>
                      <p className="text-xs font-mono break-all">flow_request_id: {form.flow_request_id}</p>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(form.created_at).toLocaleString()}
                      </p>
                      <a
                        href={renderLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block break-all text-xs text-blue-700 underline"
                      >
                        {renderLink}
                      </a>
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

export default ListFormsModal;
