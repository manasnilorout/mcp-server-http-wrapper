import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { McpServerConfig, mcpServerConfig } from "./mcp-server-config";
import { join } from "path";

export enum McpServerType {
    SSE = "sse",
    STDIO = "stdio",
}

/**
 * Handles the connection and interaction with the MCP server.
 */
export class MCPClientHandler {
    private readonly client: Client;
    public readonly serverName: string;
    public readonly serverType: McpServerType
    private readonly serverSecrets: Record<string, string>;
    private readonly serverConfig: McpServerConfig;

    /**
     * Creates a new MCPClientHandler instance.
     * @param serverName - The name of the MCP server.
     * @param serverType - The type of MCP server.
     * @param serverSecrets - The secrets for the MCP server.
     */
    constructor(
        serverName: string,
        serverType: McpServerType,
        serverSecrets: Record<string, string>,
        serverConfig: McpServerConfig) {
        this.serverName = serverName;
        this.serverType = serverType;
        this.serverSecrets = serverSecrets;
        this.serverConfig = serverConfig;
        this.client = new Client(
            {
                name: "serverless-mcp-client",
                version: "1.0.0"
            }
        );
    }

    private getServerPath(): string {
        const serverPath = join(process.cwd(), mcpServerConfig[this.serverName as keyof typeof mcpServerConfig].path);
        return serverPath;
    }

    private async validateClient() {
        if (!this.client) {
            throw new Error("Client not initialized");
        }

        await this.client.ping();
    }

    /**
     * Establishes a connection to the MCP server.
     * @throws Error if the server type is unsupported or if an error occurs during connection.
     */
    public async establishConnection() {
        try {
            if (this.serverType === McpServerType.STDIO) {
                // Use process.execPath to get the full path to the Node.js executable
                const nodePath = process.execPath;
                console.log(`Using Node.js executable at: ${nodePath}`);

                const serverPath = this.getServerPath();
                console.log(`Using server path: ${serverPath}`);

                const transport = new StdioClientTransport({
                    command: nodePath,
                    args: [serverPath, ...(
                        (this.serverConfig.envPlace === 'args' && this.serverConfig.env.length > 0) ?
                            Object.values(this.serverSecrets) : []
                    )],
                    env: this.serverConfig.envPlace === 'env' ? this.serverSecrets : {}
                });

                await this.client.connect(transport);
                // Ensure the server is ready before validating the client
                await this.validateClient();
            } else {
                throw new Error("Unsupported server type");
            }
        } catch (error) {
            console.error("Error establishing connection to MCP server:", error);
            throw error;
        }
    }

    /**
     * Lists all tools available on the MCP server.
     * @returns An array of tools.
     */
    public async listTools() {
        try {
            await this.validateClient();
            const tools = await this.client.listTools();
            return tools;
        } catch (error) {
            console.error("Error listing tools:", error);
            throw error;
        }
    }

    /**
     * Safely parses a string as JSON. If the string is not valid JSON, it returns the original string.
     * @param text - The string to parse as JSON.
     * @returns The parsed JSON object or the original string if parsing fails.
     */
    private safeParse(text: string) {
        try {
            return JSON.parse(text);
        } catch (error) {
            return { text };
        }
    }

    /**
     * Calls a tool with the given name and arguments.
     * @param toolName - The name of the tool to call.
     * @param toolArgs - The arguments to pass to the tool.
     * @returns The result of the tool call.
     */
    public async callTool(toolName: string, toolArgs: Record<string, any>) {
        try {
            await this.validateClient();
            const result = await this.client.callTool({
                name: toolName,
                arguments: toolArgs
            });
            const content = (result?.content as any[])[0];

            if (!content) {
                throw new Error("No content returned from tool");
            }

            if (result.isError) {
                throw new Error(JSON.stringify(content));
            }

            return this.safeParse(content.text as string);
        } catch (error) {
            console.error("Error calling tool:", error);
            throw error;
        }
    }

    public async disposeClient() {
        await this.client.close();
    }
}