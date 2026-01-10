"use client";

import FlowBuilder from "@/components/flow-builder";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import useWorkflow from "@/hooks/useWorkflow";

export default function Home() {
  const { workflow, getWorkflowById } = useWorkflow();
  const [workflowId, setWorkflowId] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    if (!id) return;
    setWorkflowId(id);
    getWorkflowById(id);
  }, []);

  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex h-16 items-center border-b px-4">
        <h1 className="text-xl font-bold">Flow Request Builder</h1>
        <Link className="ml-auto" href="/workflows/list">
          <Button>Go to Flows</Button>
        </Link>
      </div>
      <div className="flex-1">
        <FlowBuilder 
        worlflowToEditId={workflowId}
        flowName={workflow?.name} workflowToEdit={workflow} />
      </div>
    </main>
  );
}
