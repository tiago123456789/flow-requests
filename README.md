# Flow Requests

Build, test, and reuse API workflows—with support for AI agents through MCP.

Flow Requests is a visual workflow builder for API testing and automation. Connect requests into reusable flows, extend them with plugins, and run automations from MCP-compatible AI agents.

## Features

- **Visual workflow builder**: Connect API requests and workflow nodes in a drag-and-drop canvas to build and test multi-step automations.

- **Import API collections**: Bring existing requests into Flow Requests from Insomnia, Postman, Bruno, and Apidog.

- **MCP server**: Register a saved automation as an MCP tool. An AI agent can call the tool with its declared inputs and execute the flow through the Flow Requests MCP server.

- **Connect AI agents**: Connect MCP-compatible clients—including Codex, Claude Code, OpenCode, and others—to run registered automations from an agent conversation.

- **Convert automations into MCP tools**: Give each tool a name, description, and input schema, then make it available to connected MCP clients.

- **Copy and paste flows**: Copy a flow and paste it into a new one to reuse its nodes, connections, and environment settings instead of rebuilding the workflow.

- **Extensible plugins**: Add custom nodes to connect external services or implement workflow-specific logic.

- **Run and inspect**: Execute flows and review their results to test API behavior and troubleshoot workflows.

- **Reusable and shareable workflows**: Save flows and export or import them as JSON.

## Remote workflow runner

Run saved Flow Requests workflows through a remote HTTP and MCP service. See the [remote runner documentation](run-flow-request-remotely/README.MD) for its MCP tools, configuration, and Docker build and usage instructions.

## AI agent skills

Use the included skills to help AI agents work with Flow Requests:

- [Create a flow (automation)](skills/create-new-flow-flow-requests.md) — instructions for generating valid flows, including browser and export formats, nodes, expressions, and plugins.
- [Create a custom plugin](skills/create-custom-plugin-flow-request.md) — instructions for building, testing, and publishing custom Flow Requests nodes.
