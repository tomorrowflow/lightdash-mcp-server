import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createLightdashClient } from 'lightdash-client-typescript-fetch';
import crypto from 'crypto';

// Error rate monitoring
interface ErrorStats {
  count: number;
  lastReset: number;
}

const errorStats: ErrorStats = {
  count: 0,
  lastReset: Date.now()
};

const ERROR_RATE_WINDOW = 60000; // 1 minute window
const MAX_ERROR_RATE = 10; // Max 10 errors per minute

// Session management
interface SessionTransport {
  transport: StreamableHTTPServerTransport;
  lastActivity: number;
}

const sessionTransports = new Map<string, SessionTransport>();
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Clean up expired sessions
function cleanupExpiredSessions(): void {
  const now = Date.now();
  for (const [sessionId, sessionData] of sessionTransports.entries()) {
    if (now - sessionData.lastActivity > SESSION_TIMEOUT) {
      console.log(`Cleaning up expired session: ${sessionId}`);
      sessionTransports.delete(sessionId);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);

// Detect if request is an initialization request
function isInitializationRequest(body: any): boolean {
  return body && body.method === 'initialize';
}

// Extract or generate session ID
function getOrCreateSessionId(req: Request): string {
  // Try to get session ID from header first
  let sessionId = req.get('mcp-session-id');
  
  // If no session ID provided, generate a new one
  if (!sessionId) {
    sessionId = crypto.randomUUID();
  }
  
  return sessionId;
}

function incrementErrorCount(): void {
  const now = Date.now();
  if (now - errorStats.lastReset > ERROR_RATE_WINDOW) {
    errorStats.count = 0;
    errorStats.lastReset = now;
  }
  errorStats.count++;
}

function getErrorRate(): { count: number; isHigh: boolean } {
  const now = Date.now();
  if (now - errorStats.lastReset > ERROR_RATE_WINDOW) {
    errorStats.count = 0;
    errorStats.lastReset = now;
  }
  return {
    count: errorStats.count,
    isHigh: errorStats.count > MAX_ERROR_RATE
  };
}

export function startHttpServer(
  server: any,
  port: number
): any {
  const app = express();
  app.use(express.json());

  // Basic host header validation middleware
  app.use((req: Request, res: Response, next: NextFunction): void => {
    const allowedHosts = process.env.ALLOWED_HOSTS?.split(',') || ['localhost', '127.0.0.1'];
    const host = req.get('host');
    if (host && !allowedHosts.includes(host.split(':')[0])) {
      res.status(403).json({ error: 'Host not allowed' });
      return;
    }
    next();
  });

  // Apply CORS middleware with environment configuration
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'OPTIONS', 'DELETE'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'mcp-protocol-version',
      'mcp-session-id',
      'Accept',
      'Last-Event-ID'
    ],
    exposedHeaders: ['Mcp-Session-Id'],
  }));

  // Enhanced health check endpoint with Lightdash API connectivity
  app.get('/health', async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    const errorRate = getErrorRate();
    
    try {
      // Test Lightdash API connectivity
      const lightdashClient = createLightdashClient(
        process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud',
        {
          headers: {
            Authorization: `ApiKey ${process.env.LIGHTDASH_API_KEY}`,
          },
        }
      );
      
      const { data, error } = await lightdashClient.GET('/api/v1/org/projects', {});
      
      if (error) {
        incrementErrorCount();
        res.status(503).json({
          status: 'unhealthy',
          error: 'Lightdash API connection failed',
          details: `${error.error?.name || 'Unknown error'}: ${error.error?.message || 'No message'}`,
          timestamp: new Date().toISOString(),
          responseTime: Date.now() - startTime,
          errorRate: errorRate.count,
          lightdashConnected: false
        });
        return;
      }
      
      const responseTime = Date.now() - startTime;
      
      // Check if error rate is too high
      if (errorRate.isHigh) {
        res.status(503).json({
          status: 'degraded',
          warning: 'High error rate detected',
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version || '1.0.0',
          responseTime,
          errorRate: errorRate.count,
          lightdashConnected: true,
          projectCount: data?.results?.length || 0
        });
        return;
      }
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        responseTime,
        errorRate: errorRate.count,
        lightdashConnected: true,
        projectCount: data?.results?.length || 0
      });
    } catch (error) {
      incrementErrorCount();
      const responseTime = Date.now() - startTime;
      
      res.status(503).json({
        status: 'unhealthy',
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        responseTime,
        errorRate: errorRate.count,
        lightdashConnected: false
      });
    }
  });

  app.all('/mcp', async (req: Request, res: Response) => {
    try {
      const sessionId = getOrCreateSessionId(req);
      const isInit = isInitializationRequest(req.body);
      
      let sessionData = sessionTransports.get(sessionId);
      
      // If this is an initialization request or no existing session, create new transport
      if (isInit || !sessionData) {
        console.log(`Creating new transport for session: ${sessionId} (init: ${isInit})`);
        
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => sessionId,
          enableJsonResponse: true,
        });
        
        // Connect the server to this transport
        server.connect(transport);
        
        sessionData = {
          transport,
          lastActivity: Date.now()
        };
        
        sessionTransports.set(sessionId, sessionData);
      } else {
        // Update last activity for existing session
        sessionData.lastActivity = Date.now();
      }
      
      // Set session ID in response header
      res.setHeader('Mcp-Session-Id', sessionId);
      
      await sessionData.transport.handleRequest(req, res, req.body);
    } catch (error: unknown) {
      incrementErrorCount();
      console.error(`Error handling ${req.method} /mcp request:`, error);
      if (!res.headersSent) {
        const message =
          error instanceof Error ? error.message : 'Internal Server Error';
        res
          .status(500)
          .json({ error: 'Internal Server Error', details: message });
      }
    }
  });

  const httpServer = app
    .listen(port, () => {})
    .on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(
          `Port ${port} is already in use. Please use a different port.`
        );
      } else {
        console.error('Failed to start Express server:', err);
      }
      process.exit(1);
    });
  
  return httpServer;
}
