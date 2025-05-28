#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { COMMON_SEARCH_TOOL, handleCommonSearch } from "./common_search.js"

// Get API KEY from environment variables
const TONGXIAO_API_KEY = process.env.TONGXIAO_API_KEY;
if (!TONGXIAO_API_KEY) {
    throw new Error("TONGXIAO_API_KEY is required");
}

// Create MCP server instance
const server = new Server({
    name: "tongxiao/common-search-mcp-server",
    version: "0.1.0",
}, {
    capabilities: {
        tools: {},
    },
});

const TOOLS = [
    COMMON_SEARCH_TOOL,
];
const TOOL_FUNCTIONS = {
    [COMMON_SEARCH_TOOL.name]: handleCommonSearch
}

// Set up request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        if (!(request.params.name in TOOL_FUNCTIONS)) {
            return {
                content: [{
                    type: "text",
                    text: `Unknown tool: ${request.params.name}`
                }],
                isError: true
            };
        }
        return await TOOL_FUNCTIONS[request.params.name](TONGXIAO_API_KEY, request.params.arguments);
    } catch (error) {
        return {
            content: [{
                type: "text",
                text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
        };
    }
});
async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("TongXiao MCP Server running on stdio");
}
runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});
