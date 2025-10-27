#!/usr/bin/env node

// Load environment variables FIRST, before any other imports
import { config } from 'dotenv';
config();

// Now import other modules after environment variables are loaded
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import crypto from 'crypto';
import { startHttpServer } from './server.js';

// Global variables for cleanup
let stdioTransport: StdioServerTransport | null = null;
let isShuttingDown = false;
let server: any = null;
let httpServer: any = null;

// Graceful shutdown handler
async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    console.log('Shutdown already in progress...');
    return;
  }
  
  isShuttingDown = true;
  console.log(`Received ${signal}, shutting down gracefully...`);
  
  try {
    // Close HTTP server if active
    if (httpServer) {
      console.log('Closing HTTP server...');
      httpServer.close();
    }
    
    // Close stdio transport if active
    if (stdioTransport && server) {
      console.log('Closing stdio transport...');
      server.close();
    }
    
    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Register signal handlers for graceful shutdown
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

async function main() {
  try {
    // Use dynamic import to ensure environment variables are loaded first
    const mcpModule = await import('./mcp.js');
    server = mcpModule.server;

    let httpPort: number | null = null;
    const args = process.argv.slice(2);
    const portIndex = args.indexOf('-port');

    if (portIndex !== -1 && args.length > portIndex + 1) {
      const portValue = args[portIndex + 1];
      const parsedPort = parseInt(portValue, 10);
      if (isNaN(parsedPort)) {
        console.error(
          `Invalid port number provided for -port: "${portValue}". Must be a valid number. Exiting.`
        );
        process.exit(1);
      } else {
        httpPort = parsedPort;
      }
    } else if (portIndex !== -1 && args.length <= portIndex + 1) {
      console.error(
        'Error: -port option requires a subsequent port number. Exiting.'
      );
      process.exit(1);
    } else if (process.env.HTTP_PORT) {
      // Use HTTP_PORT environment variable as fallback when -port argument is not provided
      const envPort = parseInt(process.env.HTTP_PORT, 10);
      if (isNaN(envPort)) {
        console.error(
          `Invalid port number in HTTP_PORT environment variable: "${process.env.HTTP_PORT}". Must be a valid number. Exiting.`
        );
        process.exit(1);
      } else {
        httpPort = envPort;
      }
    }

    if (httpPort !== null) {
      // Add connection timeout handling
      const connectionTimeout = parseInt(process.env.CONNECTION_TIMEOUT || '30000', 10);
      
      httpServer = startHttpServer(server, httpPort);

      console.log(
        `[INFO] MCP Server is listening on http://localhost:${httpPort}/mcp`
      );
      console.log(`[INFO] Connection timeout set to ${connectionTimeout}ms`);
      
      // Keep process alive with proper cleanup handling
      await new Promise<void>(() => {});
    } else {
      stdioTransport = new StdioServerTransport();
      server.connect(stdioTransport);
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
