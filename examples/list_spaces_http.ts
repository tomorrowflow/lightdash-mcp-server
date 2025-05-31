import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { config } from 'dotenv';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

// Load environment variables from .env file
config();

// Get and validate required environment variables
const apiKey = process.env.EXAMPLES_CLIENT_LIGHTDASH_API_KEY;
const apiUrl =
  process.env.EXAMPLES_CLIENT_LIGHTDASH_API_URL ??
  'https://app.lightdash.cloud';

if (!apiKey) {
  throw new Error(
    'EXAMPLES_CLIENT_LIGHTDASH_API_KEY environment variable is required'
  );
}

// Set environment variables for the HTTP server
process.env.LIGHTDASH_API_KEY = apiKey;
process.env.LIGHTDASH_API_URL = apiUrl;

async function main() {
  // Initialize MCP client
  const client = new Client(
    {
      name: 'lightdash-mcp-http-example-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  // Create HTTP transport to connect to the server
  const transport = new StreamableHTTPClientTransport(
    new URL('http://localhost:8080/mcp')
  );

  try {
    // Connect to the server
    await client.connect(transport);
    console.log('Connected to MCP server via HTTP');

    // List available tools
    const toolsResponse = await client.listTools();
    console.log('Available tools:', toolsResponse.tools.length, 'tools found');

    // Call list_spaces with a project UUID
    const projectUuid = process.env.EXAMPLES_CLIENT_LIGHTDASH_PROJECT_UUID;
    if (!projectUuid) {
      throw new Error(
        'EXAMPLES_CLIENT_LIGHTDASH_PROJECT_UUID environment variable is required'
      );
    }

    console.log(`Fetching spaces for project: ${projectUuid}`);
    const response = (await client.callTool(
      {
        name: 'lightdash_list_spaces',
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
