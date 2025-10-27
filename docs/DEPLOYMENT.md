# Lightdash MCP Server - Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Lightdash MCP Server v0.0.12 to production environments. The server has been upgraded to MCP SDK v1.20.2 with enhanced security, reliability, and monitoring features.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Deployment Methods](#deployment-methods)
- [Security Configuration](#security-configuration)
- [Post-Deployment Validation](#post-deployment-validation)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Memory**: Minimum 512MB RAM
- **CPU**: 1 vCPU minimum (2+ recommended for production)
- **Network**: Outbound HTTPS access to Lightdash API

### Required Credentials

- **Lightdash API Key**: Personal Access Token (PAT) from your Lightdash organization
- **Lightdash API URL**: Your Lightdash instance URL (default: `https://app.lightdash.cloud`)

## Environment Configuration

### Required Environment Variables

```bash
# Lightdash API Configuration (REQUIRED)
LIGHTDASH_API_KEY=your_lightdash_api_key_here
LIGHTDASH_API_URL=https://app.lightdash.cloud

# Server Configuration
MCP_SERVER_NAME=lightdash-mcp-server
MCP_SERVER_VERSION=0.0.12
HTTP_PORT=8088
```

### Security Environment Variables

```bash
# CORS Configuration
CORS_ORIGIN=https://your-domain.com  # or '*' for development

# Host Validation (DNS Rebinding Protection)
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com

# Connection and Retry Configuration
CONNECTION_TIMEOUT=30000  # 30 seconds
MAX_RETRIES=3
RETRY_DELAY=1000  # 1 second initial delay
```

### Optional Environment Variables

```bash
# Logging and Monitoring
LOG_LEVEL=info  # error, warn, info, debug
ENABLE_REQUEST_LOGGING=false

# Performance Tuning
MAX_CONCURRENT_REQUESTS=10
CACHE_TTL=300  # 5 minutes
```

## Deployment Methods

### Method 1: NPM Package Deployment (Recommended)

#### 1. Install the Package

```bash
# Global installation
npm install -g lightdash-mcp-server

# Or local installation
npm install lightdash-mcp-server
```

#### 2. Create Environment File

```bash
# Create production environment file
cat > .env << EOF
LIGHTDASH_API_KEY=your_api_key_here
LIGHTDASH_API_URL=https://app.lightdash.cloud
CORS_ORIGIN=https://your-domain.com
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com
CONNECTION_TIMEOUT=30000
MAX_RETRIES=3
RETRY_DELAY=1000
HTTP_PORT=8088
EOF
```

#### 3. Start the Server

```bash
# Stdio transport (for MCP clients)
lightdash-mcp-server

# HTTP transport (for web clients)
lightdash-mcp-server -port 8088
```

### Method 2: Docker Deployment

#### 1. Create Dockerfile (if not exists)

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 8088

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8088/health || exit 1

# Start the server
CMD ["npm", "start", "-port", "8088"]
```

#### 2. Build and Run Docker Container

```bash
# Build the image
docker build -t lightdash-mcp-server:v0.0.12 .

# Run the container
docker run -d \
  --name lightdash-mcp-server \
  -p 8088:8088 \
  -e LIGHTDASH_API_KEY=your_api_key_here \
  -e LIGHTDASH_API_URL=https://app.lightdash.cloud \
  -e CORS_ORIGIN=https://your-domain.com \
  -e ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com \
  --restart unless-stopped \
  lightdash-mcp-server:v0.0.12
```

### Method 3: Source Code Deployment

#### 1. Clone and Build

```bash
# Clone the repository
git clone https://github.com/syucream/lightdash-mcp-server.git
cd lightdash-mcp-server

# Install dependencies
npm ci

# Build the project
npm run build
```

#### 2. Configure Environment

```bash
# Copy and configure environment
cp .env.sample .env
# Edit .env with your configuration
```

#### 3. Start Production Server

```bash
# Start with npm
npm start -port 8088

# Or start with node directly
node dist/index.js -port 8088
```

## Security Configuration

### CORS Configuration

Configure CORS based on your deployment scenario:

```bash
# Single domain
CORS_ORIGIN=https://your-app.com

# Multiple domains (comma-separated)
CORS_ORIGIN=https://app1.com,https://app2.com

# Development only (NOT for production)
CORS_ORIGIN=*
```

### Host Validation

Configure allowed hosts to prevent DNS rebinding attacks:

```bash
# Production configuration
ALLOWED_HOSTS=your-domain.com,api.your-domain.com

# Local development
ALLOWED_HOSTS=localhost,127.0.0.1

# Multiple environments
ALLOWED_HOSTS=localhost,127.0.0.1,staging.your-domain.com,your-domain.com
```

### Network Security

- **Firewall**: Only allow necessary inbound ports (8088 for HTTP transport)
- **TLS/SSL**: Use reverse proxy (nginx, Apache) for HTTPS termination
- **API Keys**: Store in secure environment variables, never in code
- **Access Control**: Implement IP allowlisting if required

### Reverse Proxy Configuration (nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /mcp {
        proxy_pass http://localhost:8088/mcp;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    location /health {
        proxy_pass http://localhost:8088/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Post-Deployment Validation

### 1. Health Check Verification

```bash
# Basic health check
curl -f http://localhost:8088/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "0.0.12",
  "responseTime": 245,
  "errorRate": 0,
  "lightdashConnected": true,
  "projectCount": 5
}
```

### 2. MCP Tools Validation

```bash
# Test MCP endpoint
curl -X POST http://localhost:8088/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'

# Expected: List of 13 tools
```

### 3. Security Features Validation

```bash
# Test CORS headers
curl -H "Origin: https://your-domain.com" \
  -I http://localhost:8088/health

# Test host validation
curl -H "Host: malicious-host.com" \
  http://localhost:8088/health
# Expected: 403 Forbidden
```

### 4. Performance Validation

```bash
# Test concurrent requests
for i in {1..10}; do
  curl -s http://localhost:8088/health &
done
wait

# Monitor response times
curl -w "@curl-format.txt" -s -o /dev/null http://localhost:8088/health
```

## Monitoring and Maintenance

### Health Monitoring

Set up automated health checks:

```bash
# Cron job for health monitoring
*/5 * * * * curl -f http://localhost:8088/health || echo "Health check failed" | mail -s "MCP Server Alert" admin@your-domain.com
```

### Log Monitoring

Monitor application logs:

```bash
# For npm/node deployment
tail -f ~/.pm2/logs/lightdash-mcp-server-out.log

# For Docker deployment
docker logs -f lightdash-mcp-server

# For systemd service
journalctl -u lightdash-mcp-server -f
```

### Performance Monitoring

Key metrics to monitor:

- **Response Time**: Health check response time
- **Error Rate**: HTTP 5xx responses
- **Memory Usage**: Node.js process memory
- **CPU Usage**: Process CPU utilization
- **Connection Count**: Active MCP connections

### Alerting Thresholds

Recommended alert thresholds:

- **Health Check Failure**: Immediate alert
- **Response Time**: > 5 seconds
- **Error Rate**: > 5% over 5 minutes
- **Memory Usage**: > 80% of available
- **CPU Usage**: > 80% for 5+ minutes

## Troubleshooting

### Common Issues

#### 1. Health Check Failing

```bash
# Check Lightdash API connectivity
curl -H "Authorization: ApiKey YOUR_API_KEY" \
  https://app.lightdash.cloud/api/v1/org/projects

# Check environment variables
env | grep LIGHTDASH
```

#### 2. CORS Errors

```bash
# Verify CORS configuration
echo $CORS_ORIGIN

# Check browser console for specific CORS errors
# Update CORS_ORIGIN to include your domain
```

#### 3. Host Validation Errors

```bash
# Check allowed hosts configuration
echo $ALLOWED_HOSTS

# Add your domain to ALLOWED_HOSTS
export ALLOWED_HOSTS="localhost,127.0.0.1,your-domain.com"
```

#### 4. Connection Timeouts

```bash
# Increase timeout values
export CONNECTION_TIMEOUT=60000
export MAX_RETRIES=5
export RETRY_DELAY=2000
```

### Debug Mode

Enable debug logging:

```bash
export LOG_LEVEL=debug
export ENABLE_REQUEST_LOGGING=true
```

### Support and Maintenance

- **Documentation**: Check README.md for latest updates
- **Issues**: Report bugs on GitHub repository
- **Updates**: Monitor for new releases and security updates
- **Backup**: Regularly backup configuration files

## Production Checklist

Before going live, ensure:

- [ ] All environment variables configured
- [ ] Health check endpoint responding
- [ ] All 13 MCP tools tested
- [ ] Security features validated
- [ ] Monitoring and alerting configured
- [ ] Backup and rollback procedures tested
- [ ] Performance benchmarks established
- [ ] Documentation updated

## Next Steps

After successful deployment:

1. Monitor system performance for 24-48 hours
2. Validate all MCP client integrations
3. Set up automated backups
4. Schedule regular security updates
5. Review and optimize performance metrics

For rollback procedures, see [ROLLBACK.md](ROLLBACK.md).