/**
 * Chart Intelligence & Optimization Platform - Phase 1 Integration Tests
 * 
 * Tests the three new MCP tools:
 * - lightdash_analyze_chart_performance
 * - lightdash_extract_chart_patterns
 * - lightdash_discover_chart_relationships
 */

const { StdioServerTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');

// Test configuration
const TEST_CONFIG = {
  // These would need to be real UUIDs from your Lightdash instance
  CHART_UUID: process.env.TEST_CHART_UUID || 'test-chart-uuid-1',
  CHART_UUIDS: [
    process.env.TEST_CHART_UUID_1 || 'test-chart-uuid-1',
    process.env.TEST_CHART_UUID_2 || 'test-chart-uuid-2',
    process.env.TEST_CHART_UUID_3 || 'test-chart-uuid-3',
  ],
  TIMEOUT: 30000, // 30 seconds
};

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function logError(message, error) {
  console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error?.message || error);
}

async function createClient() {
  const transport = new StdioServerTransport({
    command: 'node',
    args: ['dist/index.js'],
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  });

  const client = new Client(
    {
      name: 'chart-intelligence-test-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);
  return client;
}

async function testChartPerformanceAnalysis(client) {
  log('🔍 Testing Chart Performance Analysis...');
  
  try {
    const result = await client.request(
      {
        method: 'tools/call',
        params: {
          name: 'lightdash_analyze_chart_performance',
          arguments: {
            chartUuid: TEST_CONFIG.CHART_UUID,
            performanceThreshold: 'moderate',
            includeOptimizations: true,
          },
        },
      },
      { timeout: TEST_CONFIG.TIMEOUT }
    );

    if (result.content && result.content[0] && result.content[0].text) {
      const analysis = JSON.parse(result.content[0].text);
      
      // Validate response structure
      if (!analysis.chartUuid || !analysis.performance || !analysis.configuration) {
        throw new Error('Invalid analysis response structure');
      }

      log(`✅ Chart Performance Analysis completed successfully`);
      log(`   - Chart UUID: ${analysis.chartUuid}`);
      log(`   - Performance Score: ${analysis.performance.performanceScore}/100`);
      log(`   - Execution Time: ${analysis.performance.queryExecutionTime}ms`);
      log(`   - Threshold: ${analysis.performance.threshold}`);
      log(`   - Bottlenecks: ${analysis.performance.bottlenecks.length}`);
      log(`   - Recommendations: ${analysis.performance.recommendations.length}`);
      
      return { success: true, data: analysis };
    } else {
      throw new Error('No content in response');
    }
  } catch (error) {
    logError('Chart Performance Analysis failed', error);
    return { success: false, error: error.message };
  }
}

async function testChartPatternExtraction(client) {
  log('🎯 Testing Chart Pattern Extraction...');
  
  try {
    const result = await client.request(
      {
        method: 'tools/call',
        params: {
          name: 'lightdash_extract_chart_patterns',
          arguments: {
            chartUuids: TEST_CONFIG.CHART_UUIDS,
            patternType: 'metric_breakdown',
            minConfidence: 0.6,
            includeExamples: true,
          },
        },
      },
      { timeout: TEST_CONFIG.TIMEOUT }
    );

    if (result.content && result.content[0] && result.content[0].text) {
      const extraction = JSON.parse(result.content[0].text);
      
      // Validate response structure
      if (!extraction.patterns || !Array.isArray(extraction.patterns)) {
        throw new Error('Invalid pattern extraction response structure');
      }

      log(`✅ Chart Pattern Extraction completed successfully`);
      log(`   - Charts Analyzed: ${extraction.summary?.totalChartsAnalyzed || 0}`);
      log(`   - Patterns Found: ${extraction.patterns.length}`);
      log(`   - Explores Analyzed: ${extraction.summary?.exploresAnalyzed || 0}`);
      log(`   - Average Confidence: ${(extraction.summary?.averageConfidence || 0).toFixed(2)}`);
      
      if (extraction.patterns.length > 0) {
        const firstPattern = extraction.patterns[0];
        log(`   - First Pattern: ${firstPattern.name} (${firstPattern.patternType})`);
        log(`   - Confidence: ${firstPattern.confidence.toFixed(2)}`);
        log(`   - Frequency: ${firstPattern.frequency}`);
      }
      
      return { success: true, data: extraction };
    } else {
      throw new Error('No content in response');
    }
  } catch (error) {
    logError('Chart Pattern Extraction failed', error);
    return { success: false, error: error.message };
  }
}

async function testChartRelationshipDiscovery(client) {
  log('🕸️ Testing Chart Relationship Discovery...');
  
  try {
    const result = await client.request(
      {
        method: 'tools/call',
        params: {
          name: 'lightdash_discover_chart_relationships',
          arguments: {
            chartUuid: TEST_CONFIG.CHART_UUID,
            relationshipType: 'all',
            minStrength: 0.3,
            includeImpactAnalysis: true,
            maxResults: 10,
          },
        },
      },
      { timeout: TEST_CONFIG.TIMEOUT }
    );

    if (result.content && result.content[0] && result.content[0].text) {
      const relationships = JSON.parse(result.content[0].text);
      
      // Validate response structure
      if (!relationships.sourceChartUuid || !relationships.relationships || !Array.isArray(relationships.relationships)) {
        throw new Error('Invalid relationship discovery response structure');
      }

      log(`✅ Chart Relationship Discovery completed successfully`);
      log(`   - Source Chart: ${relationships.sourceChartUuid}`);
      log(`   - Related Charts Found: ${relationships.relationships.length}`);
      log(`   - Strong Relationships: ${relationships.summary.strongRelationships}`);
      log(`   - Weak Relationships: ${relationships.summary.weakRelationships}`);
      log(`   - Critical Dependencies: ${relationships.summary.criticalDependencies}`);
      
      if (relationships.relationships.length > 0) {
        const firstRelationship = relationships.relationships[0];
        log(`   - Top Relationship: ${firstRelationship.relatedChartName}`);
        log(`   - Relationship Type: ${firstRelationship.relationshipType}`);
        log(`   - Strength: ${firstRelationship.strength}`);
        log(`   - Change Risk: ${firstRelationship.impactAnalysis.changeRisk}`);
      }
      
      return { success: true, data: relationships };
    } else {
      throw new Error('No content in response');
    }
  } catch (error) {
    logError('Chart Relationship Discovery failed', error);
    return { success: false, error: error.message };
  }
}

async function testEnhancedChartResource(client) {
  log('📊 Testing Enhanced Chart Resource...');
  
  try {
    const result = await client.request(
      {
        method: 'resources/read',
        params: {
          uri: `lightdash://charts/${TEST_CONFIG.CHART_UUID}?analysis=true`,
        },
      },
      { timeout: TEST_CONFIG.TIMEOUT }
    );

    if (result.contents && result.contents[0] && result.contents[0].text) {
      const chartData = JSON.parse(result.contents[0].text);
      
      // Check if analysis data was added
      const hasAnalysis = chartData._analysis !== undefined;
      
      log(`✅ Enhanced Chart Resource completed successfully`);
      log(`   - Chart Name: ${chartData.name || 'Unknown'}`);
      log(`   - Analysis Included: ${hasAnalysis ? 'Yes' : 'No'}`);
      
      if (hasAnalysis) {
        log(`   - Performance Score: ${chartData._analysis.performance.performanceScore}/100`);
        log(`   - Execution Time: ${chartData._analysis.performance.executionTime}ms`);
        log(`   - Threshold: ${chartData._analysis.performance.threshold}`);
        log(`   - Dimensions: ${chartData._analysis.configuration.dimensionCount}`);
        log(`   - Metrics: ${chartData._analysis.configuration.metricCount}`);
      }
      
      return { success: true, data: chartData, hasAnalysis };
    } else {
      throw new Error('No content in response');
    }
  } catch (error) {
    logError('Enhanced Chart Resource failed', error);
    return { success: false, error: error.message };
  }
}

async function testToolsListing(client) {
  log('📋 Testing Tools Listing (includes new tools)...');
  
  try {
    const result = await client.request({
      method: 'tools/list',
      params: {},
    });

    const newTools = [
      'lightdash_analyze_chart_performance',
      'lightdash_extract_chart_patterns',
      'lightdash_discover_chart_relationships',
    ];

    const availableTools = result.tools.map(tool => tool.name);
    const foundNewTools = newTools.filter(tool => availableTools.includes(tool));

    log(`✅ Tools Listing completed successfully`);
    log(`   - Total Tools: ${result.tools.length}`);
    log(`   - New Chart Intelligence Tools Found: ${foundNewTools.length}/${newTools.length}`);
    
    foundNewTools.forEach(tool => {
      const toolInfo = result.tools.find(t => t.name === tool);
      log(`   - ${tool}: ${toolInfo.description.substring(0, 80)}...`);
    });

    return { 
      success: true, 
      totalTools: result.tools.length,
      newToolsFound: foundNewTools.length,
      expectedNewTools: newTools.length 
    };
  } catch (error) {
    logError('Tools Listing failed', error);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  log('🚀 Starting Chart Intelligence & Optimization Platform Tests...');
  log(`📋 Test Configuration:`);
  log(`   - Chart UUID: ${TEST_CONFIG.CHART_UUID}`);
  log(`   - Chart UUIDs for patterns: ${TEST_CONFIG.CHART_UUIDS.join(', ')}`);
  log(`   - Timeout: ${TEST_CONFIG.TIMEOUT}ms`);
  log('');

  const results = {
    toolsListing: null,
    performanceAnalysis: null,
    patternExtraction: null,
    relationshipDiscovery: null,
    enhancedResource: null,
  };

  let client;
  
  try {
    client = await createClient();
    log('✅ MCP Client connected successfully');
    
    // Test 1: Tools Listing
    results.toolsListing = await testToolsListing(client);
    
    // Test 2: Chart Performance Analysis
    results.performanceAnalysis = await testChartPerformanceAnalysis(client);
    
    // Test 3: Chart Pattern Extraction
    results.patternExtraction = await testChartPatternExtraction(client);
    
    // Test 4: Chart Relationship Discovery
    results.relationshipDiscovery = await testChartRelationshipDiscovery(client);
    
    // Test 5: Enhanced Chart Resource
    results.enhancedResource = await testEnhancedChartResource(client);
    
  } catch (error) {
    logError('Failed to create MCP client or run tests', error);
    return;
  } finally {
    if (client) {
      try {
        await client.close();
        log('✅ MCP Client disconnected successfully');
      } catch (error) {
        logError('Failed to disconnect MCP client', error);
      }
    }
  }

  // Summary
  log('');
  log('📊 TEST SUMMARY');
  log('================');
  
  const testNames = Object.keys(results);
  const successCount = testNames.filter(name => results[name]?.success).length;
  const totalTests = testNames.length;
  
  log(`Overall Success Rate: ${successCount}/${totalTests} (${((successCount/totalTests)*100).toFixed(1)}%)`);
  log('');
  
  testNames.forEach(testName => {
    const result = results[testName];
    const status = result?.success ? '✅ PASS' : '❌ FAIL';
    const displayName = testName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    log(`${status} - ${displayName}`);
    if (!result?.success && result?.error) {
      log(`      Error: ${result.error}`);
    }
  });
  
  log('');
  
  if (successCount === totalTests) {
    log('🎉 All Chart Intelligence tests passed! Phase 1 implementation is working correctly.');
  } else {
    log('⚠️  Some tests failed. Please check the errors above and verify your configuration.');
    log('💡 Make sure you have valid chart UUIDs in your environment variables:');
    log('   - TEST_CHART_UUID');
    log('   - TEST_CHART_UUID_1');
    log('   - TEST_CHART_UUID_2');
    log('   - TEST_CHART_UUID_3');
  }
  
  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    logError('Test execution failed', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testChartPerformanceAnalysis,
  testChartPatternExtraction,
  testChartRelationshipDiscovery,
  testEnhancedChartResource,
  testToolsListing,
};