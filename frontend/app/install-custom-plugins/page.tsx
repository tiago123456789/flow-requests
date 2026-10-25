"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AvailablePluginsDialog from "@/components/available-plugins-dialog";
import { ToastContainer } from "react-toastify";
import Link from "next/link";
import useCustomNode from "@/hooks/useCustomPlugin";

export default function InstallCustomPackages() {
  const [isAvailablePluginsOpen, setIsAvailablePluginsOpen] = useState(false);
  const {
    packageName,
    setPackageName,
    packages,
    loading,
    fetchPackages,
    installPackage,
    removePackage,
    libraryName,
    SetlibraryName,
  } = useCustomNode();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    installPackage(packageName, libraryName);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <ToastContainer />
      <div className="mb-8">
        <Link href="/workflows/list">
          <Button variant="outline" className="mb-4">
            ← Back to Flows
          </Button>
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Install Plugin</h1>
          <Button onClick={() => setIsAvailablePluginsOpen(true)}>
            Available plugins
          </Button>
        </div>
      </div>

      <AvailablePluginsDialog
        open={isAvailablePluginsOpen}
        onOpenChange={setIsAvailablePluginsOpen}
      />

      <div className="max-w-2xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Install New Plugin</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="packageName">CDN URL:</Label>
                <Input
                  id="packageName"
                  type="text"
                  placeholder="e.g., https://unpkg.com/alert-message-plugin-flow-requests@1.0.1/dist/bundle.js"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="packageName">Library name:</Label>
                <Input
                  id="packageName"
                  type="text"
                  placeholder="e.g., AlertMessage"
                  value={libraryName}
                  onChange={(e) => SetlibraryName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Installing..." : "Install Plugin"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Installed Plugins</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading plugins...</div>
            ) : packages.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No plugins installed yet
              </div>
            ) : (
              <div className="space-y-4">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-sm">
                          {pkg.libraryName}
                          <strong>
                            ({pkg.enabled ? "Enabled" : "Disabled"})
                          </strong>
                        </p>
                        <p className="font-medium">{pkg.url}</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {pkg.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removePackage(pkg.id, pkg.libraryName)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
