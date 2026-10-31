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
| `API_KEY` | Admin key required for protected HTTP routes and full access to the MCP endpoint. Send it in the `api-key` request header. |
| `MCP_TOKEN_SECRET` | Secret used to sign MCP group JWTs. Defaults to `API_KEY` when omitted. Changing it invalidates all existing group tokens. |
| `DB_URL` | PostgreSQL connection URL used to store flow requests, MCP flow definitions, and MCP groups. |
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
  -e MCP_TOKEN_SECRET='replace-with-a-separate-signing-secret' \
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

Connect an MCP-compatible client to the Streamable HTTP endpoint `http://localhost:7000/mcp` and configure it to send the `api-key` header (or `api-key` query parameter) with either the admin `API_KEY` or an MCP group token. The admin key exposes every registered tool; an `mg_...` group token exposes only that group's selected tools.

MCP group tokens are signed JWTs with a one-year expiration and are stored in PostgreSQL so they can be revoked by resetting the group token or deleting the group.

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
| `create_mcp_group` | Creates an MCP group with selected tools and returns its new `mg_...` token. A group token can only create groups using tools available to that group. |

### Dynamic tools

Each MCP flow registered in the database is exposed as a dynamic MCP tool. Its name, description, and input schema come from the MCP flow definition; calling it executes the associated saved workflow. Dynamic tools are synchronized at startup and can be refreshed with `refresh_mcp_tools`.

## MCP groups

MCP groups let you give an AI client a filtered view of the server. Each group selects a subset of the available built-in and dynamic tools and receives its own `mg_...` JWT API key.

Use the admin `API_KEY` to manage groups and discover the tool inventory:

```bash
# List selectable tools
curl -H 'api-key: replace-with-a-secret-key' \
  http://localhost:7000/mcp-tools

# Create a group and receive its token
curl -X POST http://localhost:7000/mcp-groups \
  -H 'api-key: replace-with-a-secret-key' \
  -H 'content-type: application/json' \
  -d '{"name":"employee","tools":["get_flow_created","run_flow_request"]}'

# Reset the group token; the previous token stops working immediately
curl -X POST http://localhost:7000/mcp-groups/group-id/reset-token \
  -H 'api-key: replace-with-a-secret-key'

# Remove one tool from the group
curl -X DELETE http://localhost:7000/mcp-groups/group-id/tools/run_flow_request \
  -H 'api-key: replace-with-a-secret-key'
```

Connect an MCP client with the returned group token:

```text
http://ip_or_domain_where_docker_running:7000/mcp?api-key=mg_group_token
```

Requests with that token only list and invoke the group's selected tools. Updating a group changes the tools available to its existing token; resetting the token revokes the old token. Group tokens expire after one year.

## HTTP routes

Protected routes require the admin `api-key` header (or an `api-key` query parameter). The `/mcp` endpoint also accepts `mg_...` group tokens.

| Method and route | Purpose |
| --- | --- |
| `GET /health` | Check service availability; no API key required. |
| `POST /run` | Execute a flow provided in the request body. |
| `POST /flow-requests` | Create or update a saved flow request. |
| `DELETE /flow-requests/:id` | Delete a flow request by UUID. |
| `POST /mcp-flows`, `GET /mcp-flows` | Create an MCP flow or list registered MCP flows. |
| `GET`, `PUT`, `DELETE /mcp-flows/:id` | Inspect, update, or delete an MCP flow by ID. |
| `POST /mcp-flows/refresh` | Synchronize registered MCP tools with the database. |
| `GET /mcp-tools` | List built-in and dynamic tools available for MCP groups. |
| `GET`, `POST /mcp-groups` | List MCP groups or create one with selected tools. |
| `GET`, `PUT`, `DELETE /mcp-groups/:id` | Inspect, update, or delete an MCP group by ID. |
| `POST /mcp-groups/:id/reset-token` | Replace the group token and return the new one. |
| `DELETE /mcp-groups/:id/tools/:toolName` | Remove a tool from an MCP group. |
| `POST /webhooks/:id_flow_request/run` | Execute a saved flow request by UUID; requires `WEBHOOK_MODE=true`. |
| `/mcp` | MCP Streamable HTTP endpoint. Accepts the admin key or an `mg_...` group token. |
