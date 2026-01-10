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
  Shield,
  Globe,
  Code,
  Layers,
} from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex h-16 items-center border-b px-4">
        <h1 className="text-xl font-bold">Flow Requests</h1>
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
              Simplify your API testing and workflow automation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              Flow Request revolutionizes how you handle complex API workflows.
              Whether you're a developer or QA engineer, our platform makes
              testing intricate flows effortless.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  🔗 Seamless Integrations
                </h3>
                <p className="text-sm text-gray-600">
                  Import collections from popular tools like Insomnia, Postman,
                  Bruno, and Apidog. Bring your existing API setups directly
                  into our builder.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  🚀 No-Code Simplicity
                </h3>
                <p className="text-sm text-gray-600">
                  Collect and organize endpoints just like no-code platforms
                  such as N8n. Build complex workflows without writing a single
                  line of code.
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
                <CardTitle className="text-lg">
                  Visual Workflow Builder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 text-center">
                  Build complex API workflows with an intuitive drag-and-drop
                  interface.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <Upload className="mx-auto h-8 w-8 text-green-500" />
                <CardTitle className="text-lg">Import Collections</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 text-center">
                  Import from Insomnia, Postman, Bruno, and Apidog seamlessly.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <Code className="mx-auto h-8 w-8 text-purple-500" />
                <CardTitle className="text-lg">Plugins</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 text-center">
                  Extend functionality with plugins you can create for your
                  needs.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <Play className="mx-auto h-8 w-8 text-red-500" />
                <CardTitle className="text-lg">Real-time Testing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 text-center">
                  Test workflows instantly with live execution and logging.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <Save className="mx-auto h-8 w-8 text-orange-500" />
                <CardTitle className="text-lg">Export & Import</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 text-center">
                  Save and share workflows with JSON export/import
                  functionality.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <Shield className="mx-auto h-8 w-8 text-indigo-500" />
                <CardTitle className="text-lg">
                  We don't store your data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 text-center">
                  All Flows will run in your machine, to be more precise in your
                  browser
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <Globe className="mx-auto h-8 w-8 text-teal-500" />
                <CardTitle className="text-lg">API Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 text-center">
                  Connect to any REST API with comprehensive request options.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <Zap className="mx-auto h-8 w-8 text-yellow-500" />
                <CardTitle className="text-lg">No-Code Automation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 text-center">
                  Automate complex flows without writing code, like N8n.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <Layers className="mx-auto h-8 w-8 text-pink-500" />
                <CardTitle className="text-lg">Combine Collections</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 text-center">
                  Merge different API collections to create comprehensive
                  automations.
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
