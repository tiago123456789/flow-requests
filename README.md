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

## Create and use a custom plugin

A plugin adds a new kind of step to Flow Requests. For example, you could add a step that looks up a GitHub profile or sends a message to another service. You build the step once, then add it to workflows like any other node.

### Create a plugin from the example template

The easiest way to create a plugin manually is to copy the [`plugin-examples/template`](plugin-examples/template/) folder and adapt it. The template is a starter project with example fields and a GitHub example; its `execute()` method is intentionally not implemented, so you need to add the action you want the plugin to perform.

1. **Make your own copy** of the template. From the Flow Requests repository root, run:

   ```bash
   cp -r plugin-examples/template my-first-plugin
   cd my-first-plugin
   ```

2. **Give the plugin its own package details.** In `package.json`, change `name`, `version`, and `description`. Keep the `main` and `browser` entries: they point to the server and browser bundles created by the build.

3. **Choose what people will see in Flow Requests.** In `src/index.ts`, edit `getConfig()`:
   - Change the description to explain the step.
   - Change the properties to the questions or choices a user needs to fill in.
   - The template already shows text fields, a dropdown, and a field that only appears for one selected operation.

4. **Choose what the step does.** In the same file, implement `execute()`. This is where the plugin uses the settings from the form—for example, to call an API with `fetch()`—and returns the result. The template has a commented-out GitHub example to guide you. Use `this.parseExpression()` for text settings that might contain values from earlier workflow steps, such as `{{ steps.previousStep.output.data.id }}`.

5. **Use one matching name in three places.** The plugin `name` and `type` in `getConfig()` and the `library` value in `webpack.config.cjs` must be identical. For example, use `MyFirstPlugin` in all three places. This is also the **Library name** you will enter when installing the plugin.

6. **Install, test, and build it.** From your plugin folder, install its dependencies, then run the template's checks and build:

   ```bash
   npm install
   npm test
   npm run build
   ```

   The build creates `dist/bundle.js` for the browser and `dist/deno-bundle.js` for the remote server. The template's starter test is only a placeholder, so add tests for your plugin's behavior. The template's [`README.md`](plugin-examples/template/README.md) and the [custom plugin guide](skills/create-custom-plugin-flow-request.md) have more detail about the files and APIs.

### Publish the plugin

To make your plugin available to Flow Requests, publish its package to npm. You need an npm account, and the package name must be available:

```bash
npm login
npm publish --access public
```

After publishing, npm makes the plugin files available through unpkg. Replace the example package name and version below with yours:

| Where the flow runs | Bundle | Example URL |
| --- | --- | --- |
| In the browser | `dist/bundle.js` | `https://unpkg.com/my-first-plugin@1.0.0/dist/bundle.js` |
| On the remote server | `dist/deno-bundle.js` | `https://unpkg.com/my-first-plugin@1.0.0/dist/deno-bundle.js` |

Use a versioned URL so a published update does not unexpectedly change a plugin already in use.

### Install it in Flow Requests

1. Open **Install Custom Plugins** in Flow Requests.
2. Paste the browser bundle URL, for example `https://unpkg.com/my-first-plugin@1.0.0/dist/bundle.js`.
3. Enter the **Library name**—for example, `MyFirstPlugin`. It must match the three names from step 5.
4. Select **Install Plugin**. The new step will be available in the workflow builder.

Think of this as adding a new tool to your toolbox: the URL tells Flow Requests where to get it, and the library name tells Flow Requests which plugin to load.

### What happens when a workflow runs?

- **In the browser:** Flow Requests loads `dist/bundle.js` from the installed URL and uses it to run the plugin step in the browser.
- **On the remote server:** `run-flow-request-remotely` loads the Deno version of the plugin. The flow request must include the plugin entry (its URL and `libraryName`) in its `plugins` list. For example:

  ```json
  {
    "url": "https://unpkg.com/my-first-plugin@1.0.0/dist/bundle.js",
    "libraryName": "MyFirstPlugin"
  }
  ```

  Include this object in the `plugins` list sent to the remote runner or stored with the flow request. For the current remote runner, use the public unpkg URL shown above; it converts that package URL to the Deno bundle when loading the plugin. See the [remote runner guide](run-flow-request-remotely/README.MD) for running flows on the server.

For example, if a workflow looks up a GitHub profile, a browser run loads the browser bundle, while a remote run loads the Deno bundle. In either case, the workflow uses the same plugin step and settings.

For an AI-agent-oriented, step-by-step reference, see [Create a custom plugin](skills/create-custom-plugin-flow-request.md).

## Remote workflow runner

Run saved Flow Requests workflows through a remote HTTP and MCP service. See the [remote runner documentation](run-flow-request-remotely/README.MD) for its MCP tools, configuration, and Docker build and usage instructions.

## AI agent skills

Use the included skills to help AI agents work with Flow Requests:

- [Create a flow (automation)](skills/create-new-flow-flow-requests.md) — instructions for generating valid flows, including browser and export formats, nodes, expressions, and plugins.
- [Create a custom plugin](skills/create-custom-plugin-flow-request.md) — instructions for building, testing, and publishing custom Flow Requests nodes.
