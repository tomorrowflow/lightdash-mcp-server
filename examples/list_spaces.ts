import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { config } from 'dotenv';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
config();

// Get and validate required environment variables
const apiKey = process.env.EXAMPLES_CLIENT_LIGHTDASH_API_KEY;
const apiUrl =
  process.env.EXAMPLES_CLIENT_LIGHTDASH_API_URL ??
  'https://app.lightdash.cloud/api/v1';

if (!apiKey) {
  throw new Error(
    'EXAMPLES_CLIENT_LIGHTDASH_API_KEY environment variable is required'
  );
}

// After validation, we can safely assert these are strings
const env = {
  LIGHTDASH_API_KEY: apiKey,
  LIGHTDASH_API_URL: apiUrl,
} as const satisfies Record<string, string>;

async function main() {
  // Initialize MCP client
  const client = new Client(
    {
      name: 'lightdash-mcp-example-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  // Create transport to connect to the server
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [
      '--import',
      resolve(__dirname, '../ts-node-loader.js'),
      resolve(__dirname, '../src/index.ts'),
    ],
    env,
  });

  try {
    // Connect to the server
    await client.connect(transport);
    console.log('Connected to MCP server');

    // List available tools
    const toolsResponse = await client.listTools();
    console.log('Available tools:', toolsResponse.tools);

    // Call list_spaces with a project UUID
    const projectUuid = process.env.EXAMPLES_CLIENT_LIGHTDASH_PROJECT_UUID;
    if (!projectUuid) {
      throw new Error(
        'EXAMPLES_CLIENT_LIGHTDASH_PROJECT_UUID environment variable is required'
      );
    }

    const response = (await client.callTool(
      {
        name: 'list_spaces',
        arguments: {
          projectUuid,
        },
      },
      CallToolResultSchema
    )) as CallToolResult;

    if (
      Array.isArray(response.content) &&
      response.content[0]?.type === 'text'
    ) {
      console.log('Spaces:', response.content[0].text);
    } else {
      console.error('Unexpected response format');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await transport.close();
  }
}

main();
