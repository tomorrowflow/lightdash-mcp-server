#!/usr/bin/env node

/**
 * Basic test to validate server startup and health endpoint
 */

import { spawn } from 'child_process';

const TEST_PORT = 8090;

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testHealthEndpoint() {
  try {
    const response = await fetch(`http://localhost:${TEST_PORT}/health`);
    const data = await response.json();
    
    if (response.ok) {
      log(`Health check passed: ${data.status}`, 'success');
      return true;
    } else {
      log(`Health check failed: ${response.status}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Health check error: ${error.message}`, 'error');
    return false;
  }
}

async function runBasicTest() {
  log('🚀 Starting basic server test');
  
  let serverProcess = null;
  
  try {
    // Start server
    log('Starting server...');
    serverProcess = spawn('node', ['--import', './ts-node-loader.js', 'src/index.ts', '-port', TEST_PORT.toString()], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { 
        ...process.env, 
        NODE_ENV: 'test',
        LIGHTDASH_API_KEY: 'test-key',
        LIGHTDASH_API_URL: 'https://app.lightdash.cloud'
      }
    });
    
    let serverReady = false;
    
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Server output:', output);
      if (output.includes('MCP Server is listening') && !serverReady) {
        serverReady = true;
        log('Server started successfully', 'success');
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error('Server error:', data.toString());
    });
    
    // Wait for server to start
    await sleep(5000);
    
    if (!serverReady) {
      throw new Error('Server failed to start');
    }
    
    // Test health endpoint
    const healthOk = await testHealthEndpoint();
    
    if (healthOk) {
      log('✅ Basic test PASSED', 'success');
      return true;
    } else {
      log('❌ Basic test FAILED', 'error');
      return false;
    }
    
  } catch (error) {
    log(`Test failed: ${error.message}`, 'error');
    return false;
  } finally {
    if (serverProcess) {
      log('Stopping server...');
      serverProcess.kill();
      await sleep(1000);
    }
  }
}

// Run test
runBasicTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    log(`Unexpected error: ${error.message}`, 'error');
    process.exit(1);
  });