export interface McpServerConfig {
  path: string;
  env: string[];
  envPlace: 'env' | 'args';
  serverType: 'stdio' | 'sse';
}

export const mcpServerConfig: Record<string, McpServerConfig> = {
  'brave-search': {
    path: 'mcp_servers/brave-search/dist/index.js',
    env: ['BRAVE_API_KEY'],
    envPlace: 'env',
    serverType: 'stdio'
  },
  'github': {
    path: 'mcp_servers/github/dist/index.js',
    env: ['GITHUB_PERSONAL_ACCESS_TOKEN'],
    envPlace: 'env',
    serverType: 'stdio'
  },
  'postgres': {
    path: 'mcp_servers/postgres/dist/index.js',
    env: ['POSTGRES_URL'],
    envPlace: 'args',
    serverType: 'stdio'
  }
};
