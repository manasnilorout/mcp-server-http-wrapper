import { APIGatewayProxyHandler, APIGatewayProxyResult, Context } from 'aws-lambda';
import { McpServerType, MCPClientHandler } from './mcp/mcp-client-handler';
import { McpServerConfig, mcpServerConfig } from './mcp/mcp-server-config';

const getResponseHeaders = (context: Context) => {
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        'X-AWS-Request-ID': context.awsRequestId,
    };
};

export const handler: APIGatewayProxyHandler = async (event, context): Promise<APIGatewayProxyResult> => {
    let mcpClientHandler: MCPClientHandler | null = null;
    try {
        const serverName = event.pathParameters?.serverName;
        const toolName = event.pathParameters?.toolName;

        // This is a sanity check to ensure the server name is valid
        if (!serverName || !mcpServerConfig[serverName as keyof typeof mcpServerConfig]) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Server name is required' }),
            };
        }

        const serverConfig: McpServerConfig = mcpServerConfig[serverName as keyof typeof mcpServerConfig];

        // Collect env variables from request headers
        const envVars: Record<string, string> = Object.fromEntries(
            serverConfig.env.map(key => [key, event.headers[key] as string])
        );

        if (Object.values(envVars).some(value => !value)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing required environment variables', vars: serverConfig.env }),
            };
        }

        mcpClientHandler = new MCPClientHandler(
            serverName,
            serverConfig.serverType as McpServerType,
            envVars,
            serverConfig
        );

        await mcpClientHandler.establishConnection();

        // Handle GET /{serverName} - List tools
        if (event.httpMethod === 'GET' && !toolName) {
            const tools = await mcpClientHandler.listTools();
            return {
                statusCode: 200,
                headers: getResponseHeaders(context),
                body: JSON.stringify(tools),
            };
        }

        // Handle POST /{serverName}/{toolName} - Call tool
        if (event.httpMethod === 'POST' && toolName) {
            const args = JSON.parse(event.body || '{}');
            const result = await mcpClientHandler.callTool(toolName, args);
            return {
                statusCode: 200,
                headers: getResponseHeaders(context),
                body: JSON.stringify(result),
            };
        }

        // If we get here, the route is not supported
        return {
            statusCode: 404,
            headers: getResponseHeaders(context),
            body: JSON.stringify({ message: 'Not Found - Unsupported route' }),
        };
    } catch (error: any) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: getResponseHeaders(context),
            body: JSON.stringify({
                message: error instanceof Error ? error.message : 'Internal Server Error',
                code: error.code || 'UNKNOWN_ERROR',
            }),
        };
    } finally {
        if (mcpClientHandler) {
            // Always dispose of the client when the request is finished
            await mcpClientHandler.disposeClient();
        }
    }
};
