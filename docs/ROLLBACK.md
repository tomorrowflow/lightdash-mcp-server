# Lightdash MCP Server - Rollback Procedures

## Overview

This document provides comprehensive rollback procedures for the Lightdash MCP Server upgrade from v1.11.4 to v1.20.2. The rollback strategy is designed to be simple, fast, and reliable using Git-based version control.

## Table of Contents

- [Rollback Decision Criteria](#rollback-decision-criteria)
- [Pre-Rollback Preparation](#pre-rollback-preparation)
- [Rollback Procedures](#rollback-procedures)
- [Post-Rollback Validation](#post-rollback-validation)
- [Rollback Testing](#rollback-testing)
- [Emergency Procedures](#emergency-procedures)

## Rollback Decision Criteria

### Immediate Rollback Triggers

Execute immediate rollback if any of the following occur:

#### Critical Issues
- [ ] **Complete service failure**: Server fails to start or crashes immediately
- [ ] **Authentication failures**: Unable to connect to Lightdash API
- [ ] **Data corruption**: Any indication of data integrity issues
- [ ] **Security breach**: Evidence of security vulnerabilities being exploited

#### Functional Issues
- [ ] **Tool failures**: Any of the 13 MCP tools completely non-functional
- [ ] **Transport failures**: HTTP or Stdio transport not working
- [ ] **Client compatibility**: Existing MCP clients unable to connect
- [ ] **Performance degradation**: Response times > 10x baseline (>5 seconds avg)

#### Business Impact
- [ ] **User complaints**: Multiple user reports of service issues
- [ ] **SLA violations**: Service availability below agreed thresholds
- [ ] **Integration failures**: Critical downstream systems affected

### Rollback Consideration Triggers

Consider rollback for these issues (evaluate impact first):

- [ ] **Minor performance degradation**: 2-5x slower than baseline
- [ ] **Intermittent errors**: < 5% error rate but consistent pattern
- [ ] **Configuration issues**: Problems with new environment variables
- [ ] **Monitoring alerts**: Non-critical but persistent alerts

## Pre-Rollback Preparation

### 1. Incident Assessment

Before initiating rollback, document:

```bash
# Create incident log
cat > rollback-incident-$(date +%Y%m%d-%H%M%S).log << EOF
Incident Date: $(date)
Reported By: [Name/System]
Issue Description: [Detailed description]
Impact Assessment: [Critical/High/Medium/Low]
Affected Systems: [List systems]
Decision: [Rollback/Fix Forward/Monitor]
EOF
```

### 2. Current State Backup

Backup current configuration before rollback:

```bash
# Create backup directory
mkdir -p backups/pre-rollback-$(date +%Y%m%d-%H%M%S)

# Backup configuration files
cp .env backups/pre-rollback-$(date +%Y%m%d-%H%M%S)/
cp package.json backups/pre-rollback-$(date +%Y%m%d-%H%M%S)/
cp package-lock.json backups/pre-rollback-$(date +%Y%m%d-%H%M%S)/

# Backup logs
cp -r logs/ backups/pre-rollback-$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || true
```

### 3. Notification

Notify stakeholders of rollback decision:

```bash
# Example notification script
echo "ROLLBACK INITIATED: Lightdash MCP Server rollback to v1.11.4 started at $(date)" | \
  mail -s "URGENT: MCP Server Rollback in Progress" stakeholders@company.com
```

## Rollback Procedures

### Method 1: Git-Based Rollback (Recommended)

#### For Source Code Deployments

```bash
# 1. Stop the current service
sudo systemctl stop lightdash-mcp-server
# OR for PM2
pm2 stop lightdash-mcp-server
# OR for Docker
docker stop lightdash-mcp-server

# 2. Navigate to deployment directory
cd /path/to/lightdash-mcp-server

# 3. Identify the stable version tag
git tag -l | grep v1.11
# Expected output: v1.11.4

# 4. Rollback to stable version
git checkout v1.11.4

# 5. Restore previous dependencies
npm ci

# 6. Rebuild if necessary
npm run build

# 7. Restore previous environment configuration
cp backups/v1.11.4/.env .env
cp backups/v1.11.4/package.json package.json
cp backups/v1.11.4/package-lock.json package-lock.json

# 8. Reinstall exact previous dependencies
npm ci

# 9. Start the service
sudo systemctl start lightdash-mcp-server
# OR for PM2
pm2 start lightdash-mcp-server
# OR for Docker
docker start lightdash-mcp-server
```

#### For NPM Package Deployments

```bash
# 1. Stop the current service
pm2 stop lightdash-mcp-server

# 2. Uninstall current version
npm uninstall -g lightdash-mcp-server

# 3. Install previous stable version
npm install -g lightdash-mcp-server@1.11.4

# 4. Restore previous configuration
cp backups/v1.11.4/.env .env

# 5. Start the service
pm2 start lightdash-mcp-server
```

### Method 2: Docker Rollback

```bash
# 1. Stop current container
docker stop lightdash-mcp-server
docker rm lightdash-mcp-server

# 2. Pull previous stable image
docker pull lightdash-mcp-server:v1.11.4

# 3. Start with previous configuration
docker run -d \
  --name lightdash-mcp-server \
  -p 8088:8088 \
  --env-file backups/v1.11.4/.env \
  --restart unless-stopped \
  lightdash-mcp-server:v1.11.4
```

### Method 3: Blue-Green Rollback

If using blue-green deployment:

```bash
# 1. Switch load balancer to green (v1.11.4) environment
# Update load balancer configuration to point to green environment

# 2. Verify green environment is healthy
curl -f http://green-env:8088/health

# 3. Stop blue (v1.20.2) environment
# Keep blue environment for investigation
```

## Post-Rollback Validation

### 1. Service Health Check

```bash
# Wait for service to fully start
sleep 30

# Check service status
curl -f http://localhost:8088/health

# Expected response for v1.11.4
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.11.4"
}
```

### 2. MCP Tools Validation

```bash
# Test all 13 tools are working
curl -X POST http://localhost:8088/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'

# Verify 13 tools are returned
# Test a few critical tools
curl -X POST http://localhost:8088/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "lightdash_list_projects",
      "arguments": {}
    }
  }'
```

### 3. Client Connectivity Test

```bash
# Test MCP client connections
# Run existing client integration tests
npm run test:integration

# Test both transport methods
# Stdio transport test
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  npx lightdash-mcp-server

# HTTP transport test
curl -X POST http://localhost:8088/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### 4. Performance Validation

```bash
# Run performance tests
for i in {1..10}; do
  time curl -s http://localhost:8088/health > /dev/null
done

# Expected: Response times similar to pre-upgrade baseline
```

## Rollback Testing

### Pre-Production Rollback Testing

Test rollback procedures in staging environment:

```bash
# 1. Deploy v1.20.2 to staging
# 2. Simulate failure scenarios
# 3. Execute rollback procedures
# 4. Validate rollback success
# 5. Document any issues or improvements needed
```

### Rollback Scenarios to Test

1. **Complete Service Failure**
   ```bash
   # Simulate by corrupting main executable
   # Execute rollback
   # Validate recovery
   ```

2. **Configuration Issues**
   ```bash
   # Simulate by corrupting .env file
   # Execute rollback with config restore
   # Validate functionality
   ```

3. **Dependency Issues**
   ```bash
   # Simulate by corrupting node_modules
   # Execute rollback with dependency reinstall
   # Validate functionality
   ```

4. **Database/State Issues**
   ```bash
   # Note: MCP server is stateless, but test anyway
   # Validate no state corruption during rollback
   ```

## Emergency Procedures

### Emergency Rollback (< 5 minutes)

For critical production issues requiring immediate rollback:

```bash
#!/bin/bash
# emergency-rollback.sh

set -e

echo "EMERGENCY ROLLBACK INITIATED at $(date)"

# Stop service immediately
sudo systemctl stop lightdash-mcp-server 2>/dev/null || \
pm2 stop lightdash-mcp-server 2>/dev/null || \
docker stop lightdash-mcp-server 2>/dev/null || true

# Quick rollback to known good state
cd /path/to/lightdash-mcp-server
git checkout v1.11.4
npm ci --production

# Restore minimal configuration
cp /backup/emergency/.env .env

# Start service
sudo systemctl start lightdash-mcp-server || \
pm2 start lightdash-mcp-server || \
docker start lightdash-mcp-server

# Basic health check
sleep 10
curl -f http://localhost:8088/health

echo "EMERGENCY ROLLBACK COMPLETED at $(date)"
```

### Communication During Emergency

```bash
# Immediate notification
echo "EMERGENCY ROLLBACK: Lightdash MCP Server emergency rollback completed. Service restored to v1.11.4." | \
  mail -s "URGENT: Emergency Rollback Completed" stakeholders@company.com

# Status page update
curl -X POST https://status-api.company.com/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "MCP Server Emergency Rollback",
    "status": "resolved",
    "message": "Service restored to stable version v1.11.4"
  }'
```

## Rollback Success Criteria

Rollback is considered successful when:

- [ ] Service starts without errors
- [ ] Health check endpoint returns "healthy"
- [ ] All 13 MCP tools are functional
- [ ] Both Stdio and HTTP transports work
- [ ] Existing MCP clients can connect
- [ ] Response times are within acceptable range (< 2 seconds avg)
- [ ] No error logs for 15 minutes post-rollback
- [ ] All monitoring alerts cleared

## Post-Rollback Actions

### 1. Incident Analysis

```bash
# Create post-rollback report
cat > post-rollback-analysis-$(date +%Y%m%d).md << EOF
# Rollback Analysis Report

## Incident Summary
- **Date**: $(date)
- **Duration**: [Time from issue to resolution]
- **Root Cause**: [What caused the need for rollback]
- **Impact**: [Systems and users affected]

## Rollback Execution
- **Method Used**: [Git/NPM/Docker/Blue-Green]
- **Time to Complete**: [Duration of rollback process]
- **Issues Encountered**: [Any problems during rollback]

## Lessons Learned
- [What went well]
- [What could be improved]
- [Process improvements needed]

## Action Items
- [ ] [Specific actions to prevent recurrence]
- [ ] [Process improvements to implement]
- [ ] [Additional monitoring/alerting needed]
EOF
```

### 2. Environment Cleanup

```bash
# Clean up failed deployment artifacts
rm -rf node_modules.backup
rm -rf dist.backup

# Update monitoring to reflect rollback
# Update documentation with lessons learned
```

### 3. Planning Forward

- **Root Cause Analysis**: Investigate why rollback was necessary
- **Fix Development**: Address issues that caused rollback
- **Testing Enhancement**: Improve testing to catch issues earlier
- **Process Improvement**: Update deployment and rollback procedures

## Rollback Prevention

### Pre-Deployment Validation

To minimize rollback necessity:

```bash
# Enhanced pre-deployment testing
npm run test:comprehensive
npm run test:performance
npm run test:security
npm run test:integration

# Staging environment validation
# Load testing
# Security scanning
# Compatibility testing
```

### Monitoring and Early Detection

- **Health Check Monitoring**: Continuous health endpoint monitoring
- **Performance Monitoring**: Response time and error rate tracking
- **Log Monitoring**: Automated log analysis for error patterns
- **User Experience Monitoring**: Client-side error tracking

## Support Contacts

### Emergency Contacts

- **Primary On-Call**: [Contact information]
- **Secondary On-Call**: [Contact information]
- **Technical Lead**: [Contact information]
- **DevOps Team**: [Contact information]

### Escalation Path

1. **Level 1**: On-call engineer
2. **Level 2**: Technical lead
3. **Level 3**: Engineering manager
4. **Level 4**: CTO/VP Engineering

## Documentation Updates

After any rollback:

- [ ] Update this rollback document with lessons learned
- [ ] Update deployment procedures to prevent similar issues
- [ ] Update monitoring and alerting configurations
- [ ] Update team training materials

---

**Remember**: Rollback is a safety mechanism, not a failure. The goal is to restore service quickly and learn from the experience to improve future deployments.