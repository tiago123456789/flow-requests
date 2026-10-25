# Run Flow Requests Remotely

`run-flow-request-remotely` is the Deno service that runs Flow Requests workflows outside the frontend. It exposes HTTP endpoints for executing and managing saved flows, and an MCP server that lets MCP-compatible AI clients manage and run those flows as tools.

The service executes built-in workflow nodes (such as HTTP requests, conditions, loops, and code), supports custom nodes/plugins, and stores flow requests and MCP tool definitions in PostgreSQL.

## Requirements

- Docker
- A PostgreSQL database reachable from the container

## Configuration

Set these environment variables when starting the container:

| Variable | Description |
| --- | --- |
| `API_KEY` | Shared key required for protected HTTP routes and the MCP endpoint. Send it in the `api-key` request header. |
| `DB_URL` | PostgreSQL connection URL used to store flow requests and MCP flow definitions. |
| `WEBHOOK_MODE` | Set to `true` to enable the webhook execution route. Defaults to `false`. |

The `.env` file is excluded from the Docker build context. Provide configuration to the running container rather than relying on a local `.env` file.

## Build the Docker image

From the repository root, build the image using the service directory as the build context:

```bash
docker build -t flow-requests-remote:local ./run-flow-request-remotely
```

## Run the Docker image

Provide the configuration values and publish port `7000`:

```bash
docker run --rm \
  --name flow-requests-remote \
  -p 7000:7000 \
  -e API_KEY='replace-with-a-secret-key' \
  -e DB_URL='postgres://user:password@host:5432/database' \
  -e WEBHOOK_MODE='false' \
  flow-requests-remote:local
```

The application listens on port `7000`. The Dockerfile currently declares `EXPOSE 8000`, so publish `7000` explicitly as shown rather than relying on the image's exposed-port metadata.

Check that the service is running:

```bash
curl http://localhost:7000/health
```

The health route does not require an API key. Other HTTP routes and the MCP endpoint require the configured key. For example, list registered MCP flows with:

```bash
curl -H 'api-key: replace-with-a-secret-key' \
  http://localhost:7000/mcp-flows
```

## MCP server

Connect an MCP-compatible client to the Streamable HTTP endpoint `http://localhost:7000/mcp` and configure it to send the `api-key` header with the same value as `API_KEY`.

### Connect from OpenCode

OpenCode can connect to the remote runner as a remote MCP server:

1. Make sure the Docker host is reachable from the computer running OpenCode on port `7000`.
2. Start the OpenCode MCP setup command:

   ```bash
   opencode mcp add
   ```

3. Enter a name for the server, such as `flow-requests`, and choose **Remote** as the connection type.
4. Enter the server URL below, replacing the host and API key with the values for your deployment:

   ```text
   http://ip_or_domain_where_docker_running:7000/mcp?api-key=value_from_api_key
   ```

   For example, if OpenCode runs on the same computer as Docker, use `localhost` as the host. The `api-key` value must match the `API_KEY` environment variable configured for the container.

Once connected, OpenCode can use the remote runner's built-in tools and any dynamic tools registered for saved flows.

### Built-in tools

| Tool | What it does |
| --- | --- |
| `get_flow_created` | Returns the saved flow-request records. |
| `get_webhooks` | Returns the stored flow-request records exposed by the webhook listing tool. |
| `run_flow_request` | Runs a saved flow request by ID using the provided input body. |
| `save_flow_request` | Saves a flow request, or updates the existing request with the same name. |
| `save_flow_request_as_tool` | Creates a flow request and registers it as a dynamic MCP tool with a name, description, and input schema. |
| `update_flow_request_as_tool` | Updates a saved flow request and syncs its associated dynamic MCP tool. |
| `delete_flow_request` | Deletes a flow request, removes its associated MCP flow records, and syncs dynamic tools. |
| `refresh_mcp_tools` | Reloads dynamic tools from the database. Use this after creating or updating MCP flows through the HTTP API. |

### Dynamic tools

Each MCP flow registered in the database is exposed as a dynamic MCP tool. Its name, description, and input schema come from the MCP flow definition; calling it executes the associated saved workflow. Dynamic tools are synchronized at startup and can be refreshed with `refresh_mcp_tools`.

## HTTP routes

Protected routes require the `api-key` header (or an `api-key` query parameter).

| Method and route | Purpose |
| --- | --- |
| `GET /health` | Check service availability; no API key required. |
| `POST /run` | Execute a flow provided in the request body. |
| `POST /flow-requests` | Create or update a saved flow request. |
| `DELETE /flow-requests/:id` | Delete a flow request by UUID. |
| `POST /mcp-flows`, `GET /mcp-flows` | Create an MCP flow or list registered MCP flows. |
| `GET`, `PUT`, `DELETE /mcp-flows/:id` | Inspect, update, or delete an MCP flow by ID. |
| `POST /mcp-flows/refresh` | Synchronize registered MCP tools with the database. |
| `POST /webhooks/:id_flow_request/run` | Execute a saved flow request by UUID; requires `WEBHOOK_MODE=true`. |
| `/mcp` | MCP Streamable HTTP endpoint. |
