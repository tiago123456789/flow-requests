import { getDb } from "../db/knex.ts";
import { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";
import z from "npm:zod";
import { run } from "../utils/execute-flow.util.ts";
import { getFlowRequestExecutionData } from "../utils/flow-request-data.util.ts";

export default function (mcpServer: McpServer, createLoggedTool: any) {
    return mcpServer.tool(
        "run_flow_request",
        "Run flow request by id someone",
        {
            id: z.string(),
            body: z.object({})
        },
        createLoggedTool("run_flow_request", async ({ id, body }: { id: string, body: Record<string, any> }) => {

            const db = getDb();
            const flowRequest = await db("flow_requests")
                .where("id", id)
                .first();

            if (!flowRequest) {
                return {
                    isError: true,
                    content: [{ type: "text", text: `Flow request not found!` }],
                }
            }


            const flowData = getFlowRequestExecutionData(flowRequest);
            await run(
                body,
                body,
                body,
                flowData.plugins,
                flowData.flow,
            );

            return {
                content: [{ type: "text", text: `Flow request runned!` }],
            }
        })
    );
}
