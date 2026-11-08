"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import {
  GitBranch,
  Upload,
  Play,
  Save,
  Zap,
  Bot,
  CalendarClock,
  Copy,
  Puzzle,
  Server,
  Users,
} from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex h-16 items-center border-b px-4">
        <h1 className="text-xl font-bold">Flow Requests</h1>
        <nav className="ml-6 flex gap-4 text-sm">
          <Link href="/docs" className="text-muted-foreground hover:text-foreground">
            Docs
          </Link>
        </nav>
        <Link className="ml-auto" href="/workflows/list">
          <Button>Go to Flows</Button>
        </Link>
      </div>
      <div className="flex-1 p-6">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Welcome to Flow Requests
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Build, automate, and expose API workflows — with MCP, scheduling, and shareable forms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              Flow Requests lets you compose multi-step API automations in a
              visual canvas, expose them as MCP tools for AI agents, schedule
              recurring executions, and share them as public forms — all without
              leaving your browser.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  🤖 MCP &amp; AI Agents
                </h3>
                <p className="text-sm text-gray-600">
                  Register any automation as an MCP tool and connect
                  MCP-compatible clients — Codex, Claude Code, OpenCode, and
                  others — to run your flows directly from an agent conversation.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  ⏰ Scheduled Automations
                </h3>
                <p className="text-sm text-gray-600">
                  Schedule workflows with UTC cron expressions and manage their
                  recurring executions from the workflows list. Import collections
                  from Insomnia, Postman, Bruno, and Apidog to get started fast.
                </p>
              </div>
            </div>
            <div className="text-center">
              <Link href="/workflows/new">
                <Button size="lg" className="mt-4">
                  Create a Flow Request
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        <div className="mt-8">
          <h2 className="text-3xl font-bold text-center mb-6">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="text-center">
                <GitBranch className="mx-auto h-8 w-8 text-blue-500" />
                <CardTitle className="text-lg">Visual Workflow Builder</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 text-center">
                  Connect API requests and workflow nodes in a drag-and-drop
                  canvas to build and test multi-step automations.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <Upload className="mx-auto h-8 w-8 text-green-500" />
                <CardTitle className="text-lg">Import API Collections</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 text-center">
                  Bring existing requests into Flow Requests from Insomnia,
                  Postman, Bruno, and Apidog.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <Server className="mx-auto h-8 w-8 text-purple-500" />
                <CardTitle className="text-lg">MCP Server</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 text-center">
                  Register a saved automation as an MCP tool. An AI agent can
                  call the tool with its declared inputs and execute the flow
                  through the Flow Requests MCP server.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <Bot className="mx-auto h-8 w-8 text-indigo-500" />
                <CardTitle className="text-lg">Connect AI Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 text-center">
                  Connect MCP-compatible clients — Codex, Claude Code, OpenCode,
                  and others — to run registered automations from an agent
                  conversation.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <Zap className="mx-auto h-8 w-8 text-yellow-500" />
                <CardTitle className="text-lg">Automations as MCP Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 text-center">
                  Give each tool a name, description, and input schema, then
                  make it available to connected MCP clients.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <Users className="mx-auto h-8 w-8 text-teal-500" />
                <CardTitle className="text-lg">MCP Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 text-center">
                  Scope an MCP client to a selected set of tools with its own
                  revocable <code className="font-mono text-xs">mg_...</code> JWT
                  API key.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <CalendarClock className="mx-auto h-8 w-8 text-orange-500" />
                <CardTitle className="text-lg">Scheduled Automations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 text-center">
                  Schedule workflows with UTC cron expressions and manage their
                  recurring executions from the workflows list.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <Copy className="mx-auto h-8 w-8 text-pink-500" />
                <CardTitle className="text-lg">Copy and Paste Flows</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 text-center">
                  Copy a flow and paste it into a new one to reuse its nodes,
                  connections, and environment settings instead of rebuilding
                  the workflow.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <Puzzle className="mx-auto h-8 w-8 text-red-500" />
                <CardTitle className="text-lg">Extensible Plugins</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 text-center">
                  Add custom nodes to connect external services or implement
                  workflow-specific logic.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <Play className="mx-auto h-8 w-8 text-emerald-500" />
                <CardTitle className="text-lg">Run and Inspect</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 text-center">
                  Execute flows and review their results to test API behavior
                  and troubleshoot workflows.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <Save className="mx-auto h-8 w-8 text-cyan-500" />
                <CardTitle className="text-lg">Reusable &amp; Shareable Workflows</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 text-center">
                  Save flows and export or import them as JSON.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        {/* <div className="mt-6">
          <div className="flex h-16 items-center border-b px-4 mb-4">
            <h1 className="text-xl font-bold">Flow Request Builder</h1>
            <div className="w-64 ml-4">
              <Input
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                className="h-9 font-medium"
                placeholder="Enter flow name"
                aria-label="Flow name"
              />
            </div>
            <Link className="ml-auto" href="/workflows">
              <Button>Go to Workflows</Button>
            </Link>
          </div>
          <FlowBuilder
            flowName={flowName}
            onFlowNameChange={setFlowName}
            workflowToEdit={null}
          />
        </div> */}
      </div>
    </main>
  );
}
