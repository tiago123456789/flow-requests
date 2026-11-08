import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DocsPage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Navbar */}
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/">
          <h1 className="text-xl font-bold">Flow Requests</h1>
        </Link>
        <nav className="ml-6 flex gap-4 text-sm">
          <Link
            href="/docs"
            className="font-semibold text-foreground underline underline-offset-4"
          >
            Docs
          </Link>
        </nav>
        <Link className="ml-auto" href="/workflows/list">
          <Button>Go to Flows</Button>
        </Link>
      </div>

      <div className="flex flex-1">
        {/* Sidebar TOC */}
        <aside className="hidden md:block w-64 shrink-0 border-r px-4 py-8 sticky top-0 h-screen overflow-y-auto">
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-3 tracking-wider">
            On this page
          </p>
          <nav className="space-y-1 text-sm">
            <a href="#what-is" className="block py-1 text-muted-foreground hover:text-foreground">
              What is Flow Requests?
            </a>

            <p className="pt-3 pb-1 font-medium text-foreground text-xs uppercase tracking-wider">
              Features
            </p>
            <a href="#feature-visual-builder" className="block py-1 pl-2 text-muted-foreground hover:text-foreground">
              Visual workflow builder
            </a>
            <a href="#feature-import" className="block py-1 pl-2 text-muted-foreground hover:text-foreground">
              Import API collections
            </a>
            <a href="#feature-mcp-server" className="block py-1 pl-2 text-muted-foreground hover:text-foreground">
              MCP server
            </a>
            <a href="#feature-ai-agents" className="block py-1 pl-2 text-muted-foreground hover:text-foreground">
              Connect AI agents
            </a>
            <a href="#feature-mcp-tools" className="block py-1 pl-2 text-muted-foreground hover:text-foreground">
              Automations as MCP tools
            </a>
            <a href="#feature-mcp-groups" className="block py-1 pl-2 text-muted-foreground hover:text-foreground">
              MCP groups
            </a>
            <a href="#feature-scheduled" className="block py-1 pl-2 text-muted-foreground hover:text-foreground">
              Scheduled automations
            </a>
            <a href="#feature-copy-paste" className="block py-1 pl-2 text-muted-foreground hover:text-foreground">
              Copy and paste flows
            </a>
            <a href="#feature-plugins" className="block py-1 pl-2 text-muted-foreground hover:text-foreground">
              Extensible plugins
            </a>
            <a href="#feature-run-inspect" className="block py-1 pl-2 text-muted-foreground hover:text-foreground">
              Run and inspect
            </a>
            <a href="#feature-shareable" className="block py-1 pl-2 text-muted-foreground hover:text-foreground">
              Shareable workflows
            </a>

            <a href="#how-to-create-flow" className="block py-1 pt-3 text-muted-foreground hover:text-foreground">
              How to create a flow
            </a>

            <p className="pt-3 pb-1 font-medium text-foreground text-xs uppercase tracking-wider">
              Plugins
            </p>
            <a href="#what-is-plugin" className="block py-1 pl-2 text-muted-foreground hover:text-foreground">
              What is a plugin?
            </a>
            <a href="#create-plugin" className="block py-1 pl-2 text-muted-foreground hover:text-foreground">
              Create a plugin
            </a>
            <a href="#publish-plugin" className="block py-1 pl-2 text-muted-foreground hover:text-foreground">
              Publish the plugin
            </a>
            <a href="#install-plugin" className="block py-1 pl-2 text-muted-foreground hover:text-foreground">
              Install in Flow Requests
            </a>
            <a href="#server-side-plugins" className="block py-1 pl-2 text-muted-foreground hover:text-foreground">
              Server-side plugins
            </a>

            <a href="#remote-runner" className="block py-1 pt-3 text-muted-foreground hover:text-foreground">
              Remote runner
            </a>
            <a href="#mcp-groups-detail" className="block py-1 text-muted-foreground hover:text-foreground">
              MCP groups in depth
            </a>

            <p className="pt-3 pb-1 font-medium text-foreground text-xs uppercase tracking-wider">
              AI Agent Skills
            </p>
            <a href="#skills-overview" className="block py-1 pl-2 text-muted-foreground hover:text-foreground">
              What are skills?
            </a>
            <a href="#skill-create-flow" className="block py-1 pl-2 text-muted-foreground hover:text-foreground">
              create-new-flow
            </a>
            <a href="#skill-create-plugin" className="block py-1 pl-2 text-muted-foreground hover:text-foreground">
              create-custom-plugin
            </a>
            <a href="#skill-create-form" className="block py-1 pl-2 text-muted-foreground hover:text-foreground">
              create-form-trigger-flow
            </a>
            <a href="#skills-how-to-use" className="block py-1 pl-2 text-muted-foreground hover:text-foreground">
              How to use in an AI agent
            </a>
          </nav>
        </aside>

        {/* Main content */}
        <article className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full space-y-16">

          {/* ── What is Flow Requests ── */}
          <section id="what-is" className="scroll-mt-8">
            <h1 className="text-4xl font-bold mb-4">What is Flow Requests?</h1>
            <p className="text-muted-foreground leading-7 mb-4">
              Flow Requests is a visual workflow builder for API testing and
              automation. Connect requests into reusable flows, extend them with
              plugins, and run automations from MCP-compatible AI agents — all without
              leaving your browser.
            </p>
            <p className="text-muted-foreground leading-7 mb-4">
              Flows run entirely in the browser for local use, or can be pushed to a
              remote server to be triggered by webhooks, scheduled with cron
              expressions, or called by AI agents through the MCP protocol. All data
              stays under your control: nothing is stored on any Flow Requests server.
            </p>
            <h2 className="text-xl font-semibold mb-3 mt-6">Tech stack</h2>
            <ul className="list-disc list-outside pl-5 text-muted-foreground leading-7 space-y-1">
              <li><strong>Frontend:</strong> Next.js, React, TypeScript, Tailwind CSS, and React Flow.</li>
              <li><strong>Remote runner:</strong> Deno, Hono, PostgreSQL, Docker, and MCP.</li>
              <li><strong>AI:</strong> LangChain.js, OpenRouter, and AssemblyAI.</li>
              <li><strong>Storage:</strong> IndexedDB locally; PostgreSQL for remote flows.</li>
              <li><strong>Hosting:</strong> Vercel for the frontend; Render or Docker for the remote runner.</li>
              <li><strong>Example plugin integrations:</strong> Firecrawl, SerpApi, Linear, Telegram, and Mailtrap.</li>
            </ul>
          </section>

          {/* ── Features ── */}
          <section className="scroll-mt-8">
            <h2 className="text-3xl font-bold mb-10">Features</h2>
            <div className="space-y-14">

              {/* Visual workflow builder */}
              <div id="feature-visual-builder" className="scroll-mt-8">
                <h3 className="text-xl font-semibold mb-3">Visual workflow builder</h3>
                <p className="text-muted-foreground leading-7 mb-4">
                  Build multi-step API automations on a drag-and-drop canvas powered
                  by React Flow. The left sidebar lists all available node types —
                  built-in and from installed plugins. Drag a node onto the canvas,
                  then click it to open its configuration panel on the right.
                </p>
                <p className="text-muted-foreground leading-7 mb-3">Built-in node types:</p>
                <ul className="list-disc list-outside pl-5 text-muted-foreground leading-7 space-y-2 mb-4">
                  <li><strong>Start</strong> — entry point of every flow. Required.</li>
                  <li><strong>API</strong> — makes an HTTP request (GET, POST, PUT, PATCH, DELETE). Configure URL, method, headers, and body in the config panel.</li>
                  <li><strong>Condition</strong> — branches the flow based on a boolean expression. Connects to two paths: success and fail.</li>
                  <li><strong>Loop</strong> — iterates over an array produced by a previous step and runs a set of nodes for each item.</li>
                  <li><strong>Code</strong> — runs a JavaScript snippet with full access to the workflow state, useful for data transformation.</li>
                </ul>
                <p className="text-muted-foreground leading-7">
                  Reference earlier step outputs anywhere in a node&apos;s config using{" "}
                  <code className="bg-muted px-1 rounded text-sm">{"{{this.state.steps.STEP_NAME.output.FIELD}}"}</code>.
                  Environment variables are available as{" "}
                  <code className="bg-muted px-1 rounded text-sm">{"{{this.state.envData.KEY}}"}</code>.
                </p>
              </div>

              {/* Import API collections */}
              <div id="feature-import" className="scroll-mt-8">
                <h3 className="text-xl font-semibold mb-3">Import API collections</h3>
                <p className="text-muted-foreground leading-7">
                  Import existing request collections from Insomnia, Postman, Bruno,
                  and Apidog directly into the flow editor. Each request in the
                  collection is converted to a pre-configured API node on the canvas,
                  ready to connect. Use this to bootstrap a flow from an existing
                  collection rather than configuring every node from scratch.
                </p>
              </div>

              {/* MCP server */}
              <div id="feature-mcp-server" className="scroll-mt-8">
                <h3 className="text-xl font-semibold mb-3">MCP server</h3>
                <p className="text-muted-foreground leading-7 mb-3">
                  The Flow Requests remote runner doubles as an MCP server. Once you
                  save a flow remotely and register it as a tool, the remote endpoint
                  exposes it over the Model Context Protocol. Any MCP-compatible client
                  can connect to this endpoint and call the tool by name.
                </p>
                <p className="text-muted-foreground leading-7 mb-2">
                  Connect via the <code className="bg-muted px-1 rounded text-sm">api-key</code> query parameter:
                </p>
                <pre className="bg-muted rounded-md p-4 text-sm overflow-x-auto">
                  {`http://your-server:7000/mcp?api-key=YOUR_API_KEY`}
                </pre>
                <p className="text-muted-foreground leading-7 mt-3">
                  Or pass it as the <code className="bg-muted px-1 rounded text-sm">api-key</code>{" "}
                  HTTP header instead.
                </p>
              </div>

              {/* Connect AI agents */}
              <div id="feature-ai-agents" className="scroll-mt-8">
                <h3 className="text-xl font-semibold mb-3">Connect AI agents</h3>
                <p className="text-muted-foreground leading-7 mb-3">
                  Any MCP-compatible client can be pointed at the MCP server URL to
                  discover and invoke registered automations. Supported clients include
                  Codex, Claude Code, OpenCode, and others.
                </p>
                <p className="text-muted-foreground leading-7 mb-2">
                  Example — add the MCP server in OpenCode:
                </p>
                <pre className="bg-muted rounded-md p-4 text-sm overflow-x-auto mb-3 whitespace-pre">{`opencode mcp add
# choose "Remote", then enter:
# http://your-server:7000/mcp?api-key=YOUR_API_KEY`}</pre>
                <p className="text-muted-foreground leading-7">
                  The client will list every registered tool and can call them from
                  any agent conversation. To limit which tools a client can see, use{" "}
                  <a href="#feature-mcp-groups" className="underline text-primary">MCP groups</a>.
                </p>
              </div>

              {/* Convert automations into MCP tools */}
              <div id="feature-mcp-tools" className="scroll-mt-8">
                <h3 className="text-xl font-semibold mb-3">Convert automations into MCP tools</h3>
                <p className="text-muted-foreground leading-7 mb-3">
                  From the{" "}
                  <Link href="/workflows/list" className="underline text-primary">Flows</Link>{" "}
                  page, open the <strong>Actions</strong> menu for any flow and choose{" "}
                  <strong>Create a MCP&apos;s tool</strong>.
                </p>
                <p className="text-muted-foreground leading-7 mb-3">Fill in these fields:</p>
                <ul className="list-disc list-outside pl-5 text-muted-foreground leading-7 space-y-2 mb-3">
                  <li>
                    <strong>Name</strong> — alphanumeric, underscores, and hyphens only,
                    max 64 characters (e.g.{" "}
                    <code className="bg-muted px-1 rounded text-sm">send_telegram_message</code>).
                    Cannot collide with built-in tool names.
                  </li>
                  <li>
                    <strong>Description</strong> — tells the AI agent when and how to
                    call the tool. Write it as instructions to the model.
                  </li>
                  <li>
                    <strong>flow_request_id</strong> — the ID of the saved remote flow
                    to execute. Use <strong>Save flow &amp; use id</strong> to save the
                    flow remotely and populate this field automatically.
                  </li>
                  <li>
                    <strong>Schema</strong> — declare each input parameter with a key,
                    type (string, number, boolean, integer, array, object, etc.), whether
                    it is required, and a description. The AI agent uses this schema to
                    know which arguments to pass when calling the tool.
                  </li>
                </ul>
                <p className="text-muted-foreground leading-7">
                  Once created, the tool is immediately available to connected MCP clients.
                </p>
              </div>

              {/* MCP groups */}
              <div id="feature-mcp-groups" className="scroll-mt-8">
                <h3 className="text-xl font-semibold mb-3">MCP groups</h3>
                <p className="text-muted-foreground leading-7 mb-3">
                  MCP groups scope an MCP client to a selected subset of tools. Each
                  group has its own revocable{" "}
                  <code className="bg-muted px-1 rounded text-sm">mg_...</code> JWT API key.
                  Use groups to give a person, team, or project only the tools they
                  need instead of sharing the admin key.
                </p>
                <ul className="list-disc list-outside pl-5 text-muted-foreground leading-7 space-y-1 mb-3">
                  <li>The admin <code className="bg-muted px-1 rounded text-sm">API_KEY</code> exposes every tool and can manage groups.</li>
                  <li>An <code className="bg-muted px-1 rounded text-sm">mg_...</code> group token exposes only the tools selected for its group.</li>
                  <li>Group tokens are HS256 JWTs with a one-year expiration, stored in PostgreSQL — revoking or deleting a group takes effect immediately.</li>
                </ul>
                <p className="text-muted-foreground leading-7">
                  Manage groups from the{" "}
                  <Link href="/mcp-groups" className="underline text-primary">MCP Groups</Link>{" "}
                  page. See the{" "}
                  <a href="#mcp-groups-detail" className="underline text-primary">MCP groups in depth</a>{" "}
                  section for full instructions and API reference.
                </p>
              </div>

              {/* Scheduled automations */}
              <div id="feature-scheduled" className="scroll-mt-8">
                <h3 className="text-xl font-semibold mb-3">Scheduled automations</h3>
                <p className="text-muted-foreground leading-7 mb-3">
                  From the <strong>Actions</strong> menu of any flow, choose{" "}
                  <strong>Schedule automation</strong>. Enter a UTC cron expression and
                  your remote endpoint credentials. The remote server registers the
                  schedule and triggers the flow at each interval.
                </p>
                <p className="text-muted-foreground leading-7 mb-3">
                  Example cron expressions:
                </p>
                <ul className="list-disc list-outside pl-5 text-muted-foreground leading-7 space-y-1 mb-4">
                  <li><code className="bg-muted px-1 rounded text-sm">0 9 * * 1-5</code> — every weekday at 09:00 UTC</li>
                  <li><code className="bg-muted px-1 rounded text-sm">*/15 * * * *</code> — every 15 minutes</li>
                  <li><code className="bg-muted px-1 rounded text-sm">0 0 1 * *</code> — first day of every month at midnight UTC</li>
                </ul>
                <p className="text-muted-foreground leading-7 mb-4">
                  Click <strong>Scheduled Flows</strong> on the Flows page to view all
                  scheduled flows, their cron expressions, and next execution times.
                </p>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Requirement:</strong> Scheduled flows require the remote
                    runner to be deployed with{" "}
                    <code className="bg-muted px-1 rounded text-xs">QUEUE_DB_URL</code> set. If
                    that env var is unset, scheduled-flow processing is disabled. See
                    the{" "}
                    <a href="#remote-runner" className="underline text-amber-900">remote runner</a>{" "}
                    section.
                  </p>
                </div>
              </div>

              {/* Copy and paste flows */}
              <div id="feature-copy-paste" className="scroll-mt-8">
                <h3 className="text-xl font-semibold mb-3">Copy and paste flows</h3>
                <p className="text-muted-foreground leading-7">
                  Use <strong>Export flows</strong> on the Flows page to download your
                  entire collection as a JSON file, or use the per-flow export in the
                  Actions menu to export a single flow. Use <strong>Import flows</strong>{" "}
                  to load a JSON file — this restores nodes, connections, and
                  environment variable settings exactly as they were. This is the
                  recommended way to duplicate a flow or share it with a teammate
                  without rebuilding it from scratch.
                </p>
              </div>

              {/* Extensible plugins */}
              <div id="feature-plugins" className="scroll-mt-8">
                <h3 className="text-xl font-semibold mb-3">Extensible plugins</h3>
                <p className="text-muted-foreground leading-7 mb-3">
                  Plugins add custom node types to the canvas. A plugin is a JavaScript
                  bundle that exports a class implementing the{" "}
                  <code className="bg-muted px-1 rounded text-sm">NodeBase</code> interface. Once
                  installed, the node appears in the sidebar and can be used in any flow.
                </p>
                <p className="text-muted-foreground leading-7">
                  Community plugins available in the catalog include integrations with
                  Firecrawl, SerpApi, Linear, Telegram, and Mailtrap. See the{" "}
                  <a href="#create-plugin" className="underline text-primary">plugin guide</a>{" "}
                  to build your own.
                </p>
              </div>

              {/* Run and inspect */}
              <div id="feature-run-inspect" className="scroll-mt-8">
                <h3 className="text-xl font-semibold mb-3">Run and inspect</h3>
                <p className="text-muted-foreground leading-7">
                  Click <strong>Run</strong> in the flow editor to execute the flow in
                  the browser. Each step&apos;s output is stored in the workflow state and
                  accessible to subsequent nodes. After a run, open the{" "}
                  <strong>Logs</strong> modal to review the complete execution trace —
                  each step&apos;s input, output, and any errors — to debug API behavior
                  and verify results.
                </p>
              </div>

              {/* Reusable and shareable workflows */}
              <div id="feature-shareable" className="scroll-mt-8">
                <h3 className="text-xl font-semibold mb-3">Reusable and shareable workflows</h3>
                <p className="text-muted-foreground leading-7">
                  All flows are persisted in the browser&apos;s IndexedDB — no account
                  needed. Export the full collection or individual flows as JSON to
                  share with teammates, commit to version control, or restore on
                  another device. Import the JSON on any machine to get the flows
                  back instantly.
                </p>
              </div>

            </div>
          </section>

          {/* ── How to create a flow ── */}
          <section id="how-to-create-flow" className="scroll-mt-8">
            <h2 className="text-3xl font-bold mb-4">How to create a flow</h2>
            <p className="text-muted-foreground leading-7 mb-6">
              Flows are built entirely in the browser. No account or server is required
              to create and run a basic flow.
            </p>
            <ol className="space-y-4 list-decimal list-outside pl-5 text-muted-foreground leading-7">
              <li>
                <strong className="text-foreground">Open the flow editor.</strong>{" "}
                Go to{" "}
                <Link href="/workflows/list" className="underline text-primary">Flows</Link>{" "}
                and click <strong>Create a Flow</strong>, or click{" "}
                <Link href="/workflows/new" className="underline text-primary">Create a Flow Request</Link>{" "}
                on the home page.
              </li>
              <li>
                <strong className="text-foreground">Name your flow.</strong>{" "}
                Enter a descriptive name in the flow name field at the top of the editor.
              </li>
              <li>
                <strong className="text-foreground">Add a Start node.</strong>{" "}
                Every flow must begin with a <strong>Start</strong> node. Click Start
                in the left sidebar to place it on the canvas.
              </li>
              <li>
                <strong className="text-foreground">Add API nodes.</strong>{" "}
                Click <strong>API</strong> in the sidebar to add an HTTP request node.
                Click the node to open the config panel on the right, where you set
                the URL, method (GET, POST, etc.), headers, and request body.
              </li>
              <li>
                <strong className="text-foreground">Reference previous step outputs.</strong>{" "}
                Use{" "}
                <code className="bg-muted px-1 rounded text-sm">{"{{this.state.steps.STEP_NAME.output.FIELD}}"}</code>{" "}
                anywhere in a node&apos;s URL, headers, or body. The step name is the
                label on the node.
              </li>
              <li>
                <strong className="text-foreground">Add logic nodes.</strong>{" "}
                Use <strong>Condition</strong> to branch on a boolean, or{" "}
                <strong>Loop</strong> to iterate over an array from a previous step.
              </li>
              <li>
                <strong className="text-foreground">Connect nodes.</strong>{" "}
                Drag from the output handle of one node to the input handle of the next.
              </li>
              <li>
                <strong className="text-foreground">Set environment variables.</strong>{" "}
                Click <strong>Env data</strong> to define key/value pairs available as{" "}
                <code className="bg-muted px-1 rounded text-sm">{"{{this.state.envData.KEY}}"}</code>.
                Use these for base URLs or API keys you do not want hardcoded.
              </li>
              <li>
                <strong className="text-foreground">Run the flow.</strong>{" "}
                Click <strong>Run</strong>. Open <strong>Logs</strong> to inspect each
                step&apos;s input and output.
              </li>
              <li>
                <strong className="text-foreground">Save the flow.</strong>{" "}
                Click <strong>Save</strong> to persist it to local browser storage.
              </li>
            </ol>
            <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <strong>Tip — Import from a collection:</strong> Click{" "}
                <strong>Import</strong> in the editor and paste an Insomnia, Postman,
                Bruno, or Apidog export file. Each request becomes a pre-configured
                API node on the canvas.
              </p>
            </div>
          </section>

          {/* ── What is a plugin ── */}
          <section id="what-is-plugin" className="scroll-mt-8">
            <h2 className="text-3xl font-bold mb-4">What is a plugin?</h2>
            <p className="text-muted-foreground leading-7 mb-4">
              A plugin adds a new kind of step to Flow Requests. For example, a plugin
              could send a Telegram message, look up a GitHub profile, scrape a page
              with Firecrawl, or query SerpApi. You build the step once as a
              JavaScript/TypeScript package, then add it to any workflow like a
              built-in node.
            </p>
            <p className="text-muted-foreground leading-7 mb-4">
              Technically, a plugin exports a class implementing the{" "}
              <code className="bg-muted px-1 rounded text-sm">NodeBase</code> interface from{" "}
              <code className="bg-muted px-1 rounded text-sm">core-package-mini-n8n</code>. The
              workflow engine resolves built-in node types (
              <code className="bg-muted px-1 rounded text-sm">start</code>,{" "}
              <code className="bg-muted px-1 rounded text-sm">api</code>,{" "}
              <code className="bg-muted px-1 rounded text-sm">condition</code>,{" "}
              <code className="bg-muted px-1 rounded text-sm">code</code>,{" "}
              <code className="bg-muted px-1 rounded text-sm">loop</code>) internally; for any
              other type it looks up the registered plugin class and calls its{" "}
              <code className="bg-muted px-1 rounded text-sm">execute()</code> method.
            </p>
            <p className="text-muted-foreground leading-7">
              Each plugin ships <strong>two bundles</strong>:{" "}
              <code className="bg-muted px-1 rounded text-sm">dist/bundle.js</code> loaded via a
              script tag when the flow runs in the browser, and{" "}
              <code className="bg-muted px-1 rounded text-sm">dist/deno-bundle.js</code> used by
              the remote server. Both implement the same{" "}
              <code className="bg-muted px-1 rounded text-sm">execute()</code> logic.
            </p>
          </section>

          {/* ── Create a plugin ── */}
          <section id="create-plugin" className="scroll-mt-8">
            <h2 className="text-3xl font-bold mb-4">Create a plugin</h2>
            <p className="text-muted-foreground leading-7 mb-6">
              The easiest way to start is to copy the official template from the
              Flow Requests repository and adapt it.
            </p>

            <h3 className="text-xl font-semibold mb-3">1. Copy the template</h3>
            <pre className="bg-muted rounded-md p-4 text-sm overflow-x-auto mb-6 whitespace-pre">{`cp -r plugin-examples/template my-first-plugin
cd my-first-plugin`}</pre>

            <h3 className="text-xl font-semibold mb-3">2. Update package.json</h3>
            <p className="text-muted-foreground leading-7 mb-6">
              Change <code className="bg-muted px-1 rounded text-sm">name</code>,{" "}
              <code className="bg-muted px-1 rounded text-sm">version</code>, and{" "}
              <code className="bg-muted px-1 rounded text-sm">description</code>. Keep the{" "}
              <code className="bg-muted px-1 rounded text-sm">main</code> and{" "}
              <code className="bg-muted px-1 rounded text-sm">browser</code> entries — they point
              to the server and browser bundles created by the build.
            </p>

            <h3 className="text-xl font-semibold mb-3">3. Configure what users see — getConfig()</h3>
            <p className="text-muted-foreground leading-7 mb-3">
              In <code className="bg-muted px-1 rounded text-sm">src/index.ts</code>, edit{" "}
              <code className="bg-muted px-1 rounded text-sm">getConfig()</code>:
            </p>
            <ul className="list-disc list-outside pl-5 text-muted-foreground leading-7 space-y-1 mb-6">
              <li>Set <code className="bg-muted px-1 rounded text-sm">description</code> to explain what the node does.</li>
              <li>
                Define <code className="bg-muted px-1 rounded text-sm">properties</code> — the
                fields the user fills in the config panel. The template already shows
                text fields, a dropdown, and a conditionally visible field.
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">4. Implement execute()</h3>
            <p className="text-muted-foreground leading-7 mb-3">
              In the same file, implement{" "}
              <code className="bg-muted px-1 rounded text-sm">execute()</code>. This is where the
              plugin uses the form values and returns its result. Use{" "}
              <code className="bg-muted px-1 rounded text-sm">this.parseExpression()</code> for
              any text field that may contain template expressions referencing earlier
              steps.
            </p>
            <pre className="bg-muted rounded-md p-4 text-sm overflow-x-auto mb-6 whitespace-pre">{`async execute(input: NodeInput): Promise<NodeReturn> {
  // input.settings — values from the config panel
  // Use parseExpression() for fields that may contain
  // {{ steps.prevStep.output.someField }} expressions
  const url = this.parseExpression(input.settings.url);
  const response = await fetch(url);
  return response.json();
}`}</pre>

            <h3 className="text-xl font-semibold mb-3">5. Use one matching name in three places</h3>
            <p className="text-muted-foreground leading-7 mb-6">
              The plugin <code className="bg-muted px-1 rounded text-sm">name</code> and{" "}
              <code className="bg-muted px-1 rounded text-sm">type</code> in{" "}
              <code className="bg-muted px-1 rounded text-sm">getConfig()</code> and the{" "}
              <code className="bg-muted px-1 rounded text-sm">library</code> value in{" "}
              <code className="bg-muted px-1 rounded text-sm">webpack.config.cjs</code> must all
              be identical — for example,{" "}
              <code className="bg-muted px-1 rounded text-sm">MyFirstPlugin</code>. This is also
              the <strong>Library name</strong> you enter when installing the plugin in
              Flow Requests.
            </p>

            <h3 className="text-xl font-semibold mb-3">6. Install, test, and build</h3>
            <pre className="bg-muted rounded-md p-4 text-sm overflow-x-auto mb-4 whitespace-pre">{`npm install
npm test
npm run build`}</pre>
            <p className="text-muted-foreground leading-7">
              The build produces two bundles:{" "}
              <code className="bg-muted px-1 rounded text-sm">dist/bundle.js</code> for the browser
              and{" "}
              <code className="bg-muted px-1 rounded text-sm">dist/deno-bundle.js</code> for the
              remote server.
            </p>
          </section>

          {/* ── Publish the plugin ── */}
          <section id="publish-plugin" className="scroll-mt-8">
            <h2 className="text-3xl font-bold mb-4">Publish the plugin</h2>
            <p className="text-muted-foreground leading-7 mb-6">
              To make the plugin available to Flow Requests, publish it to npm so the
              bundles are accessible via unpkg.
            </p>
            <pre className="bg-muted rounded-md p-4 text-sm overflow-x-auto mb-6 whitespace-pre">{`npm login
npm publish --access public`}</pre>
            <p className="text-muted-foreground leading-7 mb-4">
              After publishing, your bundles are available at:
            </p>
            <div className="overflow-x-auto rounded-lg border mb-6">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 font-medium">Where the flow runs</th>
                    <th className="px-4 py-2 font-medium">Bundle</th>
                    <th className="px-4 py-2 font-medium">URL pattern</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-4 py-2 text-muted-foreground">In the browser</td>
                    <td className="px-4 py-2 font-mono text-xs">dist/bundle.js</td>
                    <td className="px-4 py-2 text-muted-foreground break-all text-xs">https://unpkg.com/my-plugin@1.0.0/dist/bundle.js</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-2 text-muted-foreground">On the remote server</td>
                    <td className="px-4 py-2 font-mono text-xs">dist/deno-bundle.js</td>
                    <td className="px-4 py-2 text-muted-foreground break-all text-xs">https://unpkg.com/my-plugin@1.0.0/dist/deno-bundle.js</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <strong>Pin a version.</strong> Use a versioned URL (e.g.{" "}
                <code className="bg-muted px-1 rounded text-xs">@1.0.0</code>) so a future
                publish does not silently change a plugin already in use.
              </p>
            </div>
          </section>

          {/* ── Install a plugin ── */}
          <section id="install-plugin" className="scroll-mt-8">
            <h2 className="text-3xl font-bold mb-4">Install a plugin in Flow Requests</h2>
            <ol className="space-y-4 list-decimal list-outside pl-5 text-muted-foreground leading-7">
              <li>
                <strong className="text-foreground">Open Install Custom Plugins.</strong>{" "}
                From the{" "}
                <Link href="/workflows/list" className="underline text-primary">Flows</Link>{" "}
                page click <strong>Install plugins</strong>, or go to{" "}
                <Link href="/install-custom-plugins" className="underline text-primary">/install-custom-plugins</Link>.
              </li>
              <li>
                <strong className="text-foreground">Browse the catalog (optional).</strong>{" "}
                Click <strong>Available plugins</strong> to find a community plugin
                and copy its bundle URL and library name.
              </li>
              <li>
                <strong className="text-foreground">Paste the browser bundle URL.</strong>{" "}
                This is the <code className="bg-muted px-1 rounded text-sm">dist/bundle.js</code>{" "}
                URL, e.g.{" "}
                <code className="bg-muted px-1 rounded text-sm">
                  https://unpkg.com/my-plugin@1.0.0/dist/bundle.js
                </code>
              </li>
              <li>
                <strong className="text-foreground">Enter the Library name.</strong>{" "}
                Must match the{" "}
                <code className="bg-muted px-1 rounded text-sm">library</code> field in the
                plugin&apos;s Webpack config and the name used in{" "}
                <code className="bg-muted px-1 rounded text-sm">getConfig()</code>. Example:{" "}
                <code className="bg-muted px-1 rounded text-sm">MyFirstPlugin</code>.
              </li>
              <li>
                <strong className="text-foreground">Click Install Plugin.</strong>{" "}
                The new node type appears in the canvas sidebar next time you open
                the flow editor.
              </li>
            </ol>
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Plugins are stored in the browser&apos;s IndexedDB.
                They are not synced between devices. If you clear site data or switch
                browsers you will need to reinstall them.
              </p>
            </div>
          </section>

          {/* ── Server-side plugins ── */}
          <section id="server-side-plugins" className="scroll-mt-8">
            <h2 className="text-3xl font-bold mb-4">Run flows with server-side plugins</h2>
            <p className="text-muted-foreground leading-7 mb-4">
              When a flow uses plugin nodes and you trigger it remotely (webhook, MCP,
              or scheduler), the remote server loads the plugin&apos;s Deno bundle at
              runtime. Flow Requests passes the plugin list automatically in every
              remote call.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">How it works</h3>
            <p className="text-muted-foreground leading-7 mb-3">
              Every remote call includes a{" "}
              <code className="bg-muted px-1 rounded text-sm">plugins</code> array. Each entry
              has the bundle URL and library name:
            </p>
            <pre className="bg-muted rounded-md p-4 text-sm overflow-x-auto mb-4 whitespace-pre">{`{
  "url": "https://unpkg.com/my-plugin@1.0.0/dist/bundle.js",
  "libraryName": "MyFirstPlugin"
}`}</pre>
            <p className="text-muted-foreground leading-7 mb-6">
              The remote runner automatically converts the public unpkg browser bundle
              URL to the Deno bundle URL when loading plugins server-side, so you only
              need to provide one URL.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">One-off remote trigger</h3>
            <pre className="bg-muted rounded-md p-4 text-sm overflow-x-auto mb-6 whitespace-pre">{`curl -X POST "https://your-app.onrender.com/run" \\
  -H "api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "plugins": [
      { "url": "https://unpkg.com/my-plugin@1.0.0/dist/bundle.js",
        "libraryName": "MyFirstPlugin" }
    ],
    "flow": { "data": { "nodes": [...], "envData": [...] } }
  }'`}</pre>

            <h3 className="text-xl font-semibold mt-6 mb-3">Saved flow webhook</h3>
            <p className="text-muted-foreground leading-7 mb-3">
              Use <strong>Save flow request</strong> to persist the flow and its plugin
              list on the server. Trigger it any time without re-sending the payload:
            </p>
            <pre className="bg-muted rounded-md p-4 text-sm overflow-x-auto mb-4 whitespace-pre">{`curl -X POST "https://your-app.onrender.com/webhooks/WEBHOOK_ID/run" \\
  -H "api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}</pre>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <strong>MCP tools and scheduled flows:</strong> When registering a
                flow as an MCP tool or scheduling it, save the flow remotely first
                via <strong>Save flow request</strong> or{" "}
                <strong>Save flow &amp; use id</strong> in the MCP tool dialog. The
                saved snapshot includes the plugin list the server will load at
                execution time.
              </p>
            </div>
          </section>

          {/* ── Remote runner ── */}
          <section id="remote-runner" className="scroll-mt-8">
            <h2 className="text-3xl font-bold mb-4">Remote workflow runner</h2>
            <p className="text-muted-foreground leading-7 mb-4">
              The remote runner is a Deno + Hono HTTP service that executes saved
              Flow Requests workflows. It also serves as the MCP server endpoint and,
              optionally, a cron scheduler. Scheduled-flow processing is enabled by
              setting <code className="bg-muted px-1 rounded text-sm">QUEUE_DB_URL</code>; if
              that variable is unset, the API runs without it.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Deploy on Render (free tier)</h3>
            <ol className="space-y-3 list-decimal list-outside pl-5 text-muted-foreground leading-7 mb-6">
              <li>Create a free account on <strong>render.com</strong>.</li>
              <li>Click <strong>New &rarr; Web Service</strong>.</li>
              <li>
                Select <strong>Existing Image</strong> and enter:
                <code className="block bg-muted px-2 py-1 rounded text-sm mt-1">
                  tiagorosadacosta123456/run-flow-request-remotly
                </code>
              </li>
              <li>Choose the <strong>Free</strong> plan and click <strong>Connect</strong>.</li>
              <li>
                Add environment variables:
                <ul className="list-disc list-outside pl-5 mt-2 space-y-2">
                  <li>
                    <code className="bg-muted px-1 rounded text-sm">API_KEY</code> — secret
                    string used to authenticate all API requests.
                  </li>
                  <li>
                    <code className="bg-muted px-1 rounded text-sm">DB_URL</code> — PostgreSQL
                    connection string. Required for saved flows, webhooks, MCP tools,
                    and scheduling.
                  </li>
                  <li>
                    <code className="bg-muted px-1 rounded text-sm">WEBHOOK_MODE</code> — set to{" "}
                    <code className="bg-muted px-1 rounded text-sm">true</code> to enable webhook
                    support.
                  </li>
                  <li>
                    <code className="bg-muted px-1 rounded text-sm">QUEUE_DB_URL</code> — PostgreSQL
                    connection string for the scheduler and queue workers. If unset,
                    scheduled-flow processing is disabled.
                  </li>
                </ul>
              </li>
              <li>Click <strong>Deploy Web Service</strong>.</li>
            </ol>

            <h3 className="text-xl font-semibold mt-6 mb-3">Configure the remote in the app</h3>
            <ol className="space-y-3 list-decimal list-outside pl-5 text-muted-foreground leading-7">
              <li>
                On the{" "}
                <Link href="/workflows/list" className="underline text-primary">Flows</Link>{" "}
                page, click <strong>Configure remote</strong>.
              </li>
              <li>
                Enter the Render service URL and your{" "}
                <code className="bg-muted px-1 rounded text-sm">API_KEY</code>.
              </li>
              <li>
                Click <strong>Save</strong>. These credentials are reused by all
                remote actions (save flow, create MCP tool, schedule, etc.).
              </li>
            </ol>
          </section>

          {/* ── MCP groups in depth ── */}
          <section id="mcp-groups-detail" className="scroll-mt-8">
            <h2 className="text-3xl font-bold mb-4">MCP groups in depth</h2>
            <p className="text-muted-foreground leading-7 mb-6">
              MCP groups give an AI client a limited view of the MCP server. Each
              group selects which built-in and dynamic tools that client can list and
              call, and receives its own revocable{" "}
              <code className="bg-muted px-1 rounded text-sm">mg_...</code> JWT API key. Use
              groups to give a person, team, or project only the tools they need
              instead of sharing the admin key.
            </p>

            <h3 className="text-xl font-semibold mb-3">How it works</h3>
            <ul className="list-disc list-outside pl-5 text-muted-foreground leading-7 space-y-1 mb-8">
              <li>The admin <code className="bg-muted px-1 rounded text-sm">API_KEY</code> exposes every tool and can manage groups.</li>
              <li>An <code className="bg-muted px-1 rounded text-sm">mg_...</code> group token exposes only the tools selected for its group.</li>
              <li>Group tokens are HS256 JWTs with a one-year expiration, stored in PostgreSQL — resetting a token or deleting a group revokes access immediately.</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">Create and manage groups in the app</h3>
            <ol className="space-y-4 list-decimal list-outside pl-5 text-muted-foreground leading-7 mb-8">
              <li>
                Open{" "}
                <Link href="/mcp-groups" className="underline text-primary">
                  Flows &rarr; MCP Groups
                </Link>.
              </li>
              <li>
                Enter the remote endpoint and admin API key, then click{" "}
                <strong>Save</strong>. The app stores this connection for all remote
                features.
              </li>
              <li>
                Click <strong>Create group</strong>, enter a name, and choose the tools
                to expose. Use search to filter, <strong>Select all</strong> or{" "}
                <strong>Clear</strong> to adjust the selection, and the{" "}
                <strong>built-in</strong> / <strong>dynamic</strong> badges to tell
                tool types apart.
              </li>
              <li>
                Click <strong>Create group</strong>. Copy the{" "}
                <code className="bg-muted px-1 rounded text-sm">mg_...</code> token from the
                dialog and store it securely — it is shown only when the group is
                created or its token is reset.
              </li>
            </ol>
            <p className="text-muted-foreground leading-7 mb-8">
              From the same page you can edit a group&apos;s name and tools, remove a
              single tool, reset its token, or delete the group.
            </p>

            <h3 className="text-xl font-semibold mb-3">Connect an MCP client with a group token</h3>
            <p className="text-muted-foreground leading-7 mb-3">
              Pass the group token as the{" "}
              <code className="bg-muted px-1 rounded text-sm">api-key</code> query parameter:
            </p>
            <pre className="bg-muted rounded-md p-4 text-sm overflow-x-auto mb-3">
              {`http://your-server:7000/mcp?api-key=mg_group_token`}
            </pre>
            <p className="text-muted-foreground leading-7 mb-8">
              Or pass it as the{" "}
              <code className="bg-muted px-1 rounded text-sm">api-key</code> header. The client
              will only list and invoke the group&apos;s selected tools.
            </p>

            <h3 className="text-xl font-semibold mb-3">Manage groups via API</h3>
            <p className="text-muted-foreground leading-7 mb-3">
              Group management routes require the admin{" "}
              <code className="bg-muted px-1 rounded text-sm">API_KEY</code>. Group tokens are
              accepted only by the{" "}
              <code className="bg-muted px-1 rounded text-sm">/mcp</code> endpoint.
            </p>
            <pre className="bg-muted rounded-md p-4 text-sm overflow-x-auto mb-8 whitespace-pre">{`# List all tools available to groups
curl -H 'api-key: YOUR_ADMIN_KEY' \\
  http://localhost:7000/mcp-tools

# Create a group and receive its mg_... token
curl -X POST http://localhost:7000/mcp-groups \\
  -H 'api-key: YOUR_ADMIN_KEY' \\
  -H 'content-type: application/json' \\
  -d '{"name":"team-a","tools":["get_flow_created","run_flow_request"]}'

# Reset a group token (old token stops working immediately)
curl -X POST http://localhost:7000/mcp-groups/GROUP_ID/reset-token \\
  -H 'api-key: YOUR_ADMIN_KEY'

# Remove one tool from a group
curl -X DELETE http://localhost:7000/mcp-groups/GROUP_ID/tools/run_flow_request \\
  -H 'api-key: YOUR_ADMIN_KEY'`}</pre>

            <h3 className="text-xl font-semibold mb-3">Security notes</h3>
            <ul className="list-disc list-outside pl-5 text-muted-foreground leading-7 space-y-2">
              <li>
                Store group tokens securely. A token cannot be viewed again after
                creation — reset the group token if you lose it.
              </li>
              <li>
                Updating a group&apos;s tools changes what its existing token can access
                immediately.
              </li>
              <li>
                Reset a token or delete the group to revoke access entirely.
              </li>
              <li>
                Changing{" "}
                <code className="bg-muted px-1 rounded text-sm">MCP_TOKEN_SECRET</code> on the
                server invalidates every existing group token. If unset, tokens are
                signed with <code className="bg-muted px-1 rounded text-sm">API_KEY</code>.
              </li>
              <li>
                A group token can create new groups only with tools already available
                to that group.
              </li>
            </ul>
          </section>

          {/* ── AI Agent Skills ── */}
          <section id="skills-overview" className="scroll-mt-8">
            <h2 className="text-3xl font-bold mb-4">AI Agent Skills</h2>
            <p className="text-muted-foreground leading-7 mb-4">
              Skills are machine-readable markdown files that tell an AI coding
              agent exactly how to work with Flow Requests. Where normal
              documentation is written for humans, a skill file is structured
              for a model — it specifies precise JSON schemas, required field
              names, expression syntax, common mistakes, and step-by-step
              checklists that an agent can follow without any additional context.
            </p>
            <p className="text-muted-foreground leading-7 mb-4">
              The repository ships three skills under <code className="bg-muted px-1 rounded text-sm">skills/</code>:
            </p>
            <ul className="list-disc list-outside pl-5 text-muted-foreground leading-7 space-y-1 mb-4">
              <li>
                <a href="#skill-create-flow" className="underline text-primary">create-new-flow-flow-requests</a> — generate valid Flow Requests automation flows in JSON format.
              </li>
              <li>
                <a href="#skill-create-plugin" className="underline text-primary">create-custom-plugin-flow-request</a> — build, test, and publish a custom plugin node.
              </li>
              <li>
                <a href="#skill-create-form" className="underline text-primary">create-form-trigger-flow-flow-requests</a> — create a browser form whose submission runs a locally available flow.
              </li>
            </ul>
            <p className="text-muted-foreground leading-7">
              Each skill is a plain <code className="bg-muted px-1 rounded text-sm">.md</code> file you add to an
              agent&apos;s context. Once loaded, the agent can generate correct flows,
              plugins, or forms without guessing at field names, expression
              syntax, or output shapes.
            </p>
          </section>

          {/* ── Skill: create-new-flow ── */}
          <section id="skill-create-flow" className="scroll-mt-8">
            <h3 className="text-2xl font-bold mb-3">create-new-flow-flow-requests</h3>
            <p className="text-muted-foreground leading-7 mb-4">
              <strong>File:</strong>{" "}
              <code className="bg-muted px-1 rounded text-sm">skills/create-new-flow-flow-requests.md</code>
            </p>

            <h4 className="text-lg font-semibold mb-2">What it does</h4>
            <p className="text-muted-foreground leading-7 mb-4">
              This skill is the authoritative reference for an AI agent that
              needs to generate a valid Flow Requests workflow in JSON. It
              covers every scenario from pasting a flow into the browser canvas
              to exporting a complete collection or triggering a flow from a
              remote form.
            </p>

            <h4 className="text-lg font-semibold mb-2">What the agent learns</h4>
            <ul className="list-disc list-outside pl-5 text-muted-foreground leading-7 space-y-2 mb-6">
              <li>
                <strong>Two output formats.</strong> The browser clipboard payload
                (only <code className="bg-muted px-1 rounded text-sm">name</code>,{" "}
                <code className="bg-muted px-1 rounded text-sm">envData</code>,{" "}
                <code className="bg-muted px-1 rounded text-sm">originalWorkflow</code> at root)
                vs. the saved/export envelope (top-level{" "}
                <code className="bg-muted px-1 rounded text-sm">plugins</code> and{" "}
                <code className="bg-muted px-1 rounded text-sm">flows</code> arrays with both
                execution list and visual graph).
              </li>
              <li>
                <strong>All five built-in node types</strong> in their exact execution
                format: <code className="bg-muted px-1 rounded text-sm">start</code>,{" "}
                <code className="bg-muted px-1 rounded text-sm">api</code>,{" "}
                <code className="bg-muted px-1 rounded text-sm">condition</code>,{" "}
                <code className="bg-muted px-1 rounded text-sm">loop</code>,{" "}
                <code className="bg-muted px-1 rounded text-sm">code</code> — with every
                required field, setting shape, and how children are nested inside
                condition/loop nodes.
              </li>
              <li>
                <strong>Plugin nodes.</strong> The exact{" "}
                <code className="bg-muted px-1 rounded text-sm">setting</code> shape a plugin node
                needs, including the required{" "}
                <code className="bg-muted px-1 rounded text-sm">properties</code>,{" "}
                <code className="bg-muted px-1 rounded text-sm">label</code>,{" "}
                <code className="bg-muted px-1 rounded text-sm">color</code>, and other UI fields
                the frontend injects when saving. How to discover plugins and fetch
                their own <code className="bg-muted px-1 rounded text-sm">skill.md</code> before
                wiring them.
              </li>
              <li>
                <strong>Expression syntax.</strong> Every valid{" "}
                <code className="bg-muted px-1 rounded text-sm">{"{{this.state.*}}"}</code> path:
                previous step outputs, env vars, request body/headers/query, loop
                current item, and Faker.js.
              </li>
              <li>
                <strong>Visual graph.</strong> How to write{" "}
                <code className="bg-muted px-1 rounded text-sm">originalWorkflow.nodes</code> and{" "}
                <code className="bg-muted px-1 rounded text-sm">edges</code>, default node sizes by
                type, position layout guide, and the edge ID format including loop
                and condition edges.
              </li>
              <li>
                <strong>Form-triggered flows.</strong> How to generate a saved remote
                flow plus a matching form definition that posts submitted values into
                <code className="bg-muted px-1 rounded text-sm">this.state.request.body</code>,
                and the order of MCP tool calls to save and link them.
              </li>
              <li>
                <strong>Common mistakes table and a 20-point pre-delivery checklist</strong> to catch errors before returning the flow to the user.
              </li>
            </ul>

            <h4 className="text-lg font-semibold mb-2">Skill file path</h4>
            <pre className="bg-muted rounded-md p-4 text-sm overflow-x-auto mb-4">
              {`skills/create-new-flow-flow-requests.md`}
            </pre>
          </section>

          {/* ── Skill: create-custom-plugin ── */}
          <section id="skill-create-plugin" className="scroll-mt-8">
            <h3 className="text-2xl font-bold mb-3">create-custom-plugin-flow-request</h3>
            <p className="text-muted-foreground leading-7 mb-4">
              <strong>File:</strong>{" "}
              <code className="bg-muted px-1 rounded text-sm">skills/create-custom-plugin-flow-request.md</code>
            </p>

            <h4 className="text-lg font-semibold mb-2">What it does</h4>
            <p className="text-muted-foreground leading-7 mb-4">
              A complete step-by-step guide for building, testing, and
              publishing a custom Flow Requests plugin node — from copying the
              template to having the node available in the workflow builder.
            </p>

            <h4 className="text-lg font-semibold mb-2">What the agent learns</h4>
            <ul className="list-disc list-outside pl-5 text-muted-foreground leading-7 space-y-2 mb-6">
              <li>
                <strong>Project structure.</strong> The exact file layout of a plugin
                project (
                <code className="bg-muted px-1 rounded text-sm">src/index.ts</code>,{" "}
                <code className="bg-muted px-1 rounded text-sm">webpack.config.cjs</code>,{" "}
                <code className="bg-muted px-1 rounded text-sm">deno.json</code>, tests, and docs).
              </li>
              <li>
                <strong>The three-place name rule.</strong>{" "}
                <code className="bg-muted px-1 rounded text-sm">name</code>,{" "}
                <code className="bg-muted px-1 rounded text-sm">type</code> in{" "}
                <code className="bg-muted px-1 rounded text-sm">getConfig()</code>, and{" "}
                <code className="bg-muted px-1 rounded text-sm">output.library</code> in{" "}
                <code className="bg-muted px-1 rounded text-sm">webpack.config.cjs</code> must all
                be identical. This is the single most common cause of plugin failures.
              </li>
              <li>
                <strong>Full NodeBase API.</strong>{" "}
                <code className="bg-muted px-1 rounded text-sm">getConfig()</code> schema (all
                property types: text, textarea, select, conditional visibility),{" "}
                <code className="bg-muted px-1 rounded text-sm">execute()</code> signature,{" "}
                <code className="bg-muted px-1 rounded text-sm">this.parseExpression()</code> for
                resolving template expressions,{" "}
                <code className="bg-muted px-1 rounded text-sm">this.state</code> access paths, and
                the <code className="bg-muted px-1 rounded text-sm">info</code> field on every
                property.
              </li>
              <li>
                <strong>Two-bundle build.</strong> Why there are two bundles
                (browser UMD via Webpack, Deno via{" "}
                <code className="bg-muted px-1 rounded text-sm">deno bundle</code>), how the remote
                runner converts the browser URL to the Deno URL automatically, and
                when to use <code className="bg-muted px-1 rounded text-sm">{"/* webpackIgnore: true */"}</code>{" "}
                for Deno/Node-only imports.
              </li>
              <li>
                <strong>Testing with Jest.</strong> How to write unit tests for
                config correctness, input validation, and execution outcomes without
                a running Flow Requests instance.
              </li>
              <li>
                <strong>Publishing and installing.</strong> npm publish flow, unpkg
                URL patterns for both bundles, pinned-version best practice, and the
                UI installation steps.
              </li>
              <li>
                <strong>Writing <code className="bg-muted px-1 rounded text-sm">skill.md</code> and
                <code className="bg-muted px-1 rounded text-sm">README.md</code>.</strong> Templates
                and required sections for both files, with a worked Slack notification
                example.
              </li>
              <li>
                <strong>Common pitfalls table and a pre-publish checklist.</strong>
              </li>
            </ul>

            <h4 className="text-lg font-semibold mb-2">Skill file path</h4>
            <pre className="bg-muted rounded-md p-4 text-sm overflow-x-auto mb-4">
              {`skills/create-custom-plugin-flow-request.md`}
            </pre>
          </section>

          {/* ── Skill: create-form-trigger-flow ── */}
          <section id="skill-create-form" className="scroll-mt-8">
            <h3 className="text-2xl font-bold mb-3">create-form-trigger-flow-flow-requests</h3>
            <p className="text-muted-foreground leading-7 mb-4">
              <strong>File:</strong>{" "}
              <code className="bg-muted px-1 rounded text-sm">skills/create-form-trigger-flow-flow-requests.md</code>
            </p>

            <h4 className="text-lg font-semibold mb-2">What it does</h4>
            <p className="text-muted-foreground leading-7 mb-4">
              A guide for agents that build or modify a browser form whose
              submission runs a locally stored Flow Requests workflow. Covers
              the existing form components, the config serialization format,
              how submitted values are passed into the flow&apos;s request state,
              and browser-only constraints.
            </p>

            <h4 className="text-lg font-semibold mb-2">What the agent learns</h4>
            <ul className="list-disc list-outside pl-5 text-muted-foreground leading-7 space-y-2 mb-6">
              <li>
                <strong>Scope boundary.</strong> This skill is for browser-only
                execution. The flow runs with the local workflow and plugins in the
                browser. Remote execution is a different requirement.
              </li>
              <li>
                <strong>File map.</strong> Which files to read before editing:
                <code className="bg-muted px-1 rounded text-sm">form-builder-modal.tsx</code>,
                <code className="bg-muted px-1 rounded text-sm">form-builder.ts</code>,
                <code className="bg-muted px-1 rounded text-sm">app/forms/page.tsx</code>,
                <code className="bg-muted px-1 rounded text-sm">workflow-engine.ts</code>, and the
                workflow/plugin repositories.
              </li>
              <li>
                <strong>Config and link format.</strong> The{" "}
                <code className="bg-muted px-1 rounded text-sm">FormConfig</code> shape (title,
                buttonText, workflowId, inputs), the double-JSON-stringify + URL-safe
                Base64 encoding the builder applies, and how the{" "}
                <code className="bg-muted px-1 rounded text-sm">/forms?hash=</code> page decodes
                and validates it.
              </li>
              <li>
                <strong>Request data contract.</strong> Submitted values must be
                passed as{" "}
                <code className="bg-muted px-1 rounded text-sm">{"{ headers: {}, body: submittedValues, query: {} }"}</code>{" "}
                so flow nodes can access them via{" "}
                <code className="bg-muted px-1 rounded text-sm">{"{{this.state.request.body.fieldName}}"}</code>.
                Never pass an empty object.
              </li>
              <li>
                <strong>Workflow execution path.</strong> How to resolve the workflow
                from IndexedDB, load plugins via the existing{" "}
                <code className="bg-muted px-1 rounded text-sm">CustomNodeManager</code> pattern,
                run the engine, and surface success or failure — without adding a
                second workflow interpreter.
              </li>
              <li>
                <strong>Security rules.</strong> No secrets or API keys in the form
                hash. Keep sensitive values in the workflow&apos;s{" "}
                <code className="bg-muted px-1 rounded text-sm">envData</code>.
              </li>
              <li>
                <strong>Verification checklist</strong> covering workflow ID
                propagation, field validation, file handling, duplicate-submit
                prevention, and build/lint checks.
              </li>
            </ul>

            <h4 className="text-lg font-semibold mb-2">Skill file path</h4>
            <pre className="bg-muted rounded-md p-4 text-sm overflow-x-auto mb-4">
              {`skills/create-form-trigger-flow-flow-requests.md`}
            </pre>
          </section>

          {/* ── How to use skills in an AI agent ── */}
          <section id="skills-how-to-use" className="scroll-mt-8">
            <h3 className="text-2xl font-bold mb-4">How to use skills in an AI coding agent</h3>
            <p className="text-muted-foreground leading-7 mb-6">
              Skills work by giving the agent the full skill file as context
              before it starts the task. The agent can then follow the schemas,
              checklists, and examples exactly, without guessing.
            </p>

            <h4 className="text-lg font-semibold mb-3">Method 1 — Paste the file directly</h4>
            <p className="text-muted-foreground leading-7 mb-3">
              Copy the contents of the skill file and paste it at the top of
              your prompt or into the agent&apos;s system context. Works in any
              chat-based agent (ChatGPT, Claude, Gemini, etc.).
            </p>
            <pre className="bg-muted rounded-md p-4 text-sm overflow-x-auto mb-6 whitespace-pre">{`# Paste skill into the chat
[paste contents of skills/create-new-flow-flow-requests.md]

Now generate a flow that fetches todos from
https://dummyjson.com/todos and sends each one to
https://webhook.site/my-hook via POST.`}</pre>

            <h4 className="text-lg font-semibold mb-3">Method 2 — Add as a resource in Kiro / Claude Code</h4>
            <p className="text-muted-foreground leading-7 mb-3">
              In MCP-compatible agents like Kiro or Claude Code, add the skill
              file as a resource so it is loaded automatically:
            </p>
            <pre className="bg-muted rounded-md p-4 text-sm overflow-x-auto mb-6 whitespace-pre">{`# In your agent config (e.g. .kiro/agents/my-agent.json)
{
  "resources": [
    "file://skills/create-new-flow-flow-requests.md"
  ]
}`}</pre>

            <h4 className="text-lg font-semibold mb-3">Method 3 — Use the MCP tools directly</h4>
            <p className="text-muted-foreground leading-7 mb-3">
              If the Flow Requests MCP server is connected to your agent, the
              agent can call built-in tools to save flows and create forms
              without leaving the conversation. The{" "}
              <a href="#skill-create-flow" className="underline text-primary">create-new-flow</a>{" "}
              skill documents the exact tool call sequence:
            </p>
            <ol className="list-decimal list-outside pl-5 text-muted-foreground leading-7 space-y-2 mb-6">
              <li>
                Call <code className="bg-muted px-1 rounded text-sm">save_flow_request</code> with
                the flow name, nodes, envData, and plugins. Receive a flow request UUID.
              </li>
              <li>
                Call <code className="bg-muted px-1 rounded text-sm">create_form_flow</code> with the
                UUID, form data object, and optional description. Receive a render URL.
              </li>
              <li>
                Share the render URL — the form is immediately live at{" "}
                <code className="bg-muted px-1 rounded text-sm">/forms-render/&lt;form-uuid&gt;</code>.
              </li>
            </ol>

            <h4 className="text-lg font-semibold mb-3">Which skill to load for each task</h4>
            <div className="overflow-x-auto rounded-lg border mb-6">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 font-medium">Task</th>
                    <th className="px-4 py-2 font-medium">Skill to load</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-4 py-2 text-muted-foreground">Generate a flow JSON to paste into the browser or export</td>
                    <td className="px-4 py-2 font-mono text-xs">create-new-flow-flow-requests.md</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-2 text-muted-foreground">Create a remote form that triggers a flow</td>
                    <td className="px-4 py-2 font-mono text-xs">create-new-flow-flow-requests.md</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-2 text-muted-foreground">Build a new custom plugin node</td>
                    <td className="px-4 py-2 font-mono text-xs">create-custom-plugin-flow-request.md</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-2 text-muted-foreground">Add or modify a browser form that runs a local workflow</td>
                    <td className="px-4 py-2 font-mono text-xs">create-form-trigger-flow-flow-requests.md</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <strong>Tip — load plugin skill.md files too.</strong> When
                generating a flow that uses a community plugin, the{" "}
                <em>create-new-flow</em> skill instructs the agent to also fetch
                that plugin&apos;s own <code className="bg-muted px-1 rounded text-xs">skill.md</code>{" "}
                from unpkg before wiring the node. The plugin&apos;s skill file
                documents the exact property names, output shape, and any
                constraints for that specific plugin — always load it alongside
                the flow generation skill for accurate results.
              </p>
            </div>
          </section>

        </article>
      </div>
    </main>
  );
}
