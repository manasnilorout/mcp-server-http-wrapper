# MCP HTTP Wrapper

AWS Lambda HTTP wrapper for Model Context Protocol servers.

## Prerequisites

- Node.js (v18 or later)
- AWS CLI configured with appropriate credentials
- Serverless Framework

## Installation

```bash
npm install
```

### Setting up MCP Servers

Before testing or deployment, you need to install dependencies and build each MCP server:

```bash
# Navigate to each MCP server directory and install dependencies
cd mcp_servers/[server-name]
npm install
npm run build

# Repeat for each server directory under mcp_servers/
```

## Local Development

To run the service locally with Serverless Offline:

```bash
npm run dev
```

To run the service with Express for easier debugging:

```bash
npm run dev:express
```

## Deployment

### Configure AWS Credentials

Before deploying, make sure you have AWS credentials configured:

```bash
aws configure
```

### Prepare MCP Servers

Ensure you've built all MCP servers before deployment (see [Setting up MCP Servers](#setting-up-mcp-servers) section).

### Deploy to Development

```bash
npm run deploy
```

This will:
1. Clean the dist directory
2. Build the TypeScript code 
3. Package the necessary files including MCP servers
4. Deploy to AWS using Serverless Framework

### Deploy to Production

```bash
npm run deploy:prod
```

## API Usage

### List Available Tools

```http
GET /{serverName}
```

### Call a Tool

```http
POST /{serverName}/{toolName}
{
  "param1": "value1",
  "param2": "value2"
}
```

Required headers must be included based on the specific MCP server configuration.

## Project Structure

- `src/index.ts` - Main Lambda handler function
- `src/mcp/mcp-server-config.ts` - Configuration for available MCP servers
- `src/mcp/mcp-client-handler.ts` - Handler for MCP client communications
- `mcp_servers/` - Directory containing MCP server implementations
- `serverless.yml` - Serverless Framework configuration

## Scripts

- `npm run build` - Compiles TypeScript
- `npm run watch` - Watches for TypeScript changes
- `npm run clean` - Removes the dist directory
- `npm run dev` - Runs the service locally
- `npm run deploy` - Deploys to development
- `npm run deploy:prod` - Deploys to production 
