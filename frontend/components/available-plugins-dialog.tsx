"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const AVAILABLE_PLUGINS_URL =
  "https://raw.githubusercontent.com/tiago123456789/flow-requests/refs/heads/master/plugins_available.md";

interface AvailablePlugin {
  name: string;
  libraryName: string;
  bundleLabel: string;
  bundleUrl: string | null;
  skillUrl: string | null;
}

interface AvailablePluginsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getMarkdownLink(value: string) {
  const match = value.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
  return match ? { label: match[1], url: match[2] } : null;
}

function stripMarkdown(value: string) {
  return value.replace(/^`|`$/g, "").trim();
}

function parsePluginCatalog(markdown: string): AvailablePlugin[] {
  const rows = markdown.split(/\r?\n/).filter((line) => line.trim().startsWith("|"));

  return rows
    .slice(2)
    .map((row) => row
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 4)
    .map((cells) => {
      const name = stripMarkdown(cells[0]).replace(/\s+\([^)]*\)\s*$/, "");
      const bundle = getMarkdownLink(cells[2]);
      const skill = getMarkdownLink(cells[3]);

      return {
        name,
        libraryName: stripMarkdown(cells[1]),
        bundleLabel: bundle?.label ?? cells[2],
        bundleUrl: bundle?.url ?? null,
        skillUrl: skill?.url ?? null,
      };
    })
    .filter((plugin) => plugin.name && plugin.libraryName);
}

export default function AvailablePluginsDialog({
  open,
  onOpenChange,
}: AvailablePluginsDialogProps) {
  const [plugins, setPlugins] = useState<AvailablePlugin[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [selectedPlugin, setSelectedPlugin] = useState<AvailablePlugin | null>(null);
  const [skillMarkdown, setSkillMarkdown] = useState("");
  const [skillLoading, setSkillLoading] = useState(false);
  const [skillError, setSkillError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    setCatalogLoading(true);
    setCatalogError(null);
    setPlugins([]);

    fetch(AVAILABLE_PLUGINS_URL, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        return response.text();
      })
      .then((markdown) => {
        const parsedPlugins = parsePluginCatalog(markdown);
        if (parsedPlugins.length === 0) {
          throw new Error("No plugins were found in the catalog.");
        }
        setPlugins(parsedPlugins);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setCatalogError(
          error instanceof Error ? error.message : "Failed to load the plugin catalog."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogLoading(false);
      });

    return () => controller.abort();
  }, [open]);

  useEffect(() => {
    if (!open || !selectedPlugin?.skillUrl) return;

    const controller = new AbortController();
    setSkillMarkdown("");
    setSkillError(null);
    setSkillLoading(true);

    fetch(selectedPlugin.skillUrl, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        return response.text();
      })
      .then(setSkillMarkdown)
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setSkillError(
          error instanceof Error ? error.message : "Failed to load plugin details."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setSkillLoading(false);
      });

    return () => controller.abort();
  }, [open, selectedPlugin]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedPlugin(null);
      setSkillMarkdown("");
      setSkillError(null);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex h-dvh max-h-none w-screen max-w-none flex-col gap-4 overflow-hidden rounded-none p-4 sm:max-w-none">
        <DialogHeader>
          <DialogTitle>
            {selectedPlugin ? selectedPlugin.name : "Available plugins"}
          </DialogTitle>
        </DialogHeader>

        {selectedPlugin ? (
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedPlugin(null)}
            >
              ← Back to available plugins
            </Button>
            {skillLoading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Loading plugin details...
              </p>
            ) : skillError ? (
              <p role="alert" className="py-4 text-sm text-destructive">
                Could not load plugin details: {skillError}
              </p>
            ) : (
              <div className="max-h-none overflow-x-hidden overflow-y-auto rounded-md border p-4 text-sm leading-6 [&_a]:break-all [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-4 [&_table]:w-full [&_table]:table-fixed [&_td]:break-words [&_td]:border [&_td]:p-2 [&_th]:break-words [&_th]:border [&_th]:bg-muted [&_th]:p-2 [&_ul]:list-disc [&_ul]:pl-6">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ children, href }) => (
                      <a href={href} target="_blank" rel="noreferrer">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {skillMarkdown}
                </ReactMarkdown>
              </div>
            )}
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto space-y-3">
            {catalogLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Loading available plugins...
              </p>
            ) : catalogError ? (
              <p role="alert" className="py-4 text-sm text-destructive">
                Could not load the plugin catalog: {catalogError}
              </p>
            ) : (
              <div className="overflow-x-hidden rounded-md border">
                <table className="w-full table-fixed border-collapse text-left text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="break-words border-b p-2">Plugin</th>
                      <th className="break-words border-b p-2">Library name</th>
                      <th className="break-words border-b p-2">Bundle</th>
                      <th className="break-words border-b p-2">skill.md</th>
                      <th className="break-words border-b p-2">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plugins.map((plugin) => (
                      <tr key={`${plugin.name}-${plugin.libraryName}`}>
                        <td className="break-words border-b p-2 font-medium">{plugin.name}</td>
                        <td className="break-all border-b p-2 font-mono text-xs">
                          {plugin.libraryName}
                        </td>
                        <td className="break-words border-b p-2">
                          {plugin.bundleUrl ? (
                            <a
                              className="text-primary underline"
                              href={plugin.bundleUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {plugin.bundleLabel}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">
                              {plugin.bundleLabel}
                            </span>
                          )}
                        </td>
                        <td className="break-words border-b p-2">
                          {plugin.skillUrl ? (
                            <a
                              className="text-primary underline"
                              href={plugin.skillUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open skill.md
                            </a>
                          ) : (
                            <span className="text-muted-foreground">Not available</span>
                          )}
                        </td>
                        <td className="break-words border-b p-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!plugin.skillUrl}
                            onClick={() => setSelectedPlugin(plugin)}
                          >
                            View details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
