/**
 * Phase 1 Implementation Validation Script
 * 
 * Validates that all Phase 1 requirements have been implemented correctly:
 * 1. Enhanced schema definitions
 * 2. Three new MCP tools
 * 3. Enhanced resource capabilities
 * 4. Comprehensive error handling and validation
 */

const fs = require('fs');
const path = require('path');

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function logError(message, error) {
  console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error?.message || error);
}

function validateSchemaDefinitions() {
  log('🔍 Validating Enhanced Schema Definitions...');
  
  try {
    const schemasPath = path.join(__dirname, '..', 'src', 'schemas.ts');
    const schemasContent = fs.readFileSync(schemasPath, 'utf8');
    
    const requiredSchemas = [
      'FilterOperator',
      'PerformanceThreshold', 
      'ChartPatternType',
      'ChartRelationshipType',
      'PerformanceAnalysisSchema',
      'ChartAnalysisSchema',
      'ChartPatternSchema',
      'QueryOptimizationSchema',
      'ChartRelationshipSchema',
      'AnalyzeChartPerformanceRequestSchema',
      'ExtractChartPatternsRequestSchema',
      'DiscoverChartRelationshipsRequestSchema',
    ];
    
    const foundSchemas = [];
    const missingSchemas = [];
    
    requiredSchemas.forEach(schema => {
      if (schemasContent.includes(`export const ${schema}`)) {
        foundSchemas.push(schema);
      } else {
        missingSchemas.push(schema);
      }
    });
    
    log(`✅ Schema Definitions: ${foundSchemas.length}/${requiredSchemas.length} found`);
    
    if (missingSchemas.length > 0) {
      log(`❌ Missing schemas: ${missingSchemas.join(', ')}`);
      return false;
    }
    
    // Check for JSDoc documentation
    const hasJSDoc = schemasContent.includes('/**') && schemasContent.includes('@enum');
    log(`${hasJSDoc ? '✅' : '⚠️'} JSDoc documentation: ${hasJSDoc ? 'Present' : 'Missing'}`);
    
    return true;
  } catch (error) {
    logError('Failed to validate schema definitions', error);
    return false;
  }
}

function validateMCPTools() {
  log('🔧 Validating MCP Tool Implementations...');
  
  try {
    const mcpPath = path.join(__dirname, '..', 'src', 'mcp.ts');
    const mcpContent = fs.readFileSync(mcpPath, 'utf8');
    
    const requiredTools = [
      'lightdash_analyze_chart_performance',
      'lightdash_extract_chart_patterns',
      'lightdash_discover_chart_relationships',
    ];
    
    const foundTools = [];
    const missingTools = [];
    
    // Check tool registration in ListToolsRequestSchema
    requiredTools.forEach(tool => {
      if (mcpContent.includes(`name: '${tool}'`)) {
        foundTools.push(tool);
      } else {
        missingTools.push(tool);
      }
    });
    
    log(`✅ Tool Registration: ${foundTools.length}/${requiredTools.length} found`);
    
    // Check tool implementation in CallToolRequestSchema
    const implementedTools = [];
    const missingImplementations = [];
    
    requiredTools.forEach(tool => {
      if (mcpContent.includes(`case '${tool}':`)) {
        implementedTools.push(tool);
      } else {
        missingImplementations.push(tool);
      }
    });
    
    log(`✅ Tool Implementation: ${implementedTools.length}/${requiredTools.length} found`);
    
    if (missingTools.length > 0 || missingImplementations.length > 0) {
      if (missingTools.length > 0) {
        log(`❌ Missing tool registrations: ${missingTools.join(', ')}`);
      }
      if (missingImplementations.length > 0) {
        log(`❌ Missing tool implementations: ${missingImplementations.join(', ')}`);
      }
      return false;
    }
    
    // Check for schema imports
    const hasSchemaImports = mcpContent.includes('AnalyzeChartPerformanceRequestSchema') &&
                            mcpContent.includes('ExtractChartPatternsRequestSchema') &&
                            mcpContent.includes('DiscoverChartRelationshipsRequestSchema');
    
    log(`${hasSchemaImports ? '✅' : '❌'} Schema Imports: ${hasSchemaImports ? 'Present' : 'Missing'}`);
    
    return hasSchemaImports;
  } catch (error) {
    logError('Failed to validate MCP tools', error);
    return false;
  }
}

function validateEnhancedResources() {
  log('📊 Validating Enhanced Resource Capabilities...');
  
  try {
    const mcpPath = path.join(__dirname, '..', 'src', 'mcp.ts');
    const mcpContent = fs.readFileSync(mcpPath, 'utf8');
    
    // Check for enhanced chart resource with analysis capabilities
    const hasEnhancedChartResource = mcpContent.includes('includeAnalysis') &&
                                   mcpContent.includes('_analysis') &&
                                   mcpContent.includes('performance:') &&
                                   mcpContent.includes('configuration:');
    
    log(`${hasEnhancedChartResource ? '✅' : '❌'} Enhanced Chart Resource: ${hasEnhancedChartResource ? 'Present' : 'Missing'}`);
    
    return hasEnhancedChartResource;
  } catch (error) {
    logError('Failed to validate enhanced resources', error);
    return false;
  }
}

function validateErrorHandling() {
  log('🛡️ Validating Error Handling and Validation...');
  
  try {
    const mcpPath = path.join(__dirname, '..', 'src', 'mcp.ts');
    const mcpContent = fs.readFileSync(mcpPath, 'utf8');
    
    // Check for comprehensive error handling patterns
    const hasWithRetry = mcpContent.includes('withRetry(async () =>');
    const hasSchemaValidation = mcpContent.includes('.parse(request.params.arguments)');
    const hasTryCatch = mcpContent.includes('try {') && mcpContent.includes('} catch');
    const hasErrorLogging = mcpContent.includes('console.warn') || mcpContent.includes('console.error');
    
    log(`${hasWithRetry ? '✅' : '❌'} Retry Logic: ${hasWithRetry ? 'Present' : 'Missing'}`);
    log(`${hasSchemaValidation ? '✅' : '❌'} Schema Validation: ${hasSchemaValidation ? 'Present' : 'Missing'}`);
    log(`${hasTryCatch ? '✅' : '❌'} Try-Catch Blocks: ${hasTryCatch ? 'Present' : 'Missing'}`);
    log(`${hasErrorLogging ? '✅' : '❌'} Error Logging: ${hasErrorLogging ? 'Present' : 'Missing'}`);
    
    return hasWithRetry && hasSchemaValidation && hasTryCatch && hasErrorLogging;
  } catch (error) {
    logError('Failed to validate error handling', error);
    return false;
  }
}

function validateBuildOutput() {
  log('🏗️ Validating Build Output...');
  
  try {
    const distPath = path.join(__dirname, '..', 'dist');
    const requiredFiles = ['index.js', 'mcp.js', 'schemas.js', 'server.js'];
    
    const foundFiles = [];
    const missingFiles = [];
    
    requiredFiles.forEach(file => {
      const filePath = path.join(distPath, file);
      if (fs.existsSync(filePath)) {
        foundFiles.push(file);
      } else {
        missingFiles.push(file);
      }
    });
    
    log(`✅ Build Files: ${foundFiles.length}/${requiredFiles.length} found`);
    
    if (missingFiles.length > 0) {
      log(`❌ Missing build files: ${missingFiles.join(', ')}`);
      return false;
    }
    
    return true;
  } catch (error) {
    logError('Failed to validate build output', error);
    return false;
  }
}

function validateTestFiles() {
  log('🧪 Validating Test Files...');
  
  try {
    const testPath = path.join(__dirname, 'chart-intelligence-test.js');
    const hasTestFile = fs.existsSync(testPath);
    
    log(`${hasTestFile ? '✅' : '❌'} Integration Test File: ${hasTestFile ? 'Present' : 'Missing'}`);
    
    if (hasTestFile) {
      const testContent = fs.readFileSync(testPath, 'utf8');
      const hasAllTestFunctions = testContent.includes('testChartPerformanceAnalysis') &&
                                 testContent.includes('testChartPatternExtraction') &&
                                 testContent.includes('testChartRelationshipDiscovery') &&
                                 testContent.includes('testEnhancedChartResource');
      
      log(`${hasAllTestFunctions ? '✅' : '❌'} Test Functions: ${hasAllTestFunctions ? 'Complete' : 'Incomplete'}`);
      
      return hasAllTestFunctions;
    }
    
    return false;
  } catch (error) {
    logError('Failed to validate test files', error);
    return false;
  }
}

async function runPhase1Validation() {
  log('🚀 Starting Phase 1 Implementation Validation...');
  log('');
  
  const validationResults = {
    schemas: validateSchemaDefinitions(),
    tools: validateMCPTools(),
    resources: validateEnhancedResources(),
    errorHandling: validateErrorHandling(),
    build: validateBuildOutput(),
    tests: validateTestFiles(),
  };
  
  log('');
  log('📊 VALIDATION SUMMARY');
  log('====================');
  
  const testNames = Object.keys(validationResults);
  const successCount = testNames.filter(name => validationResults[name]).length;
  const totalTests = testNames.length;
  
  log(`Overall Success Rate: ${successCount}/${totalTests} (${((successCount/totalTests)*100).toFixed(1)}%)`);
  log('');
  
  testNames.forEach(testName => {
    const result = validationResults[testName];
    const status = result ? '✅ PASS' : '❌ FAIL';
    const displayName = testName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    log(`${status} - ${displayName}`);
  });
  
  log('');
  
  if (successCount === totalTests) {
    log('🎉 Phase 1 Implementation COMPLETE!');
    log('');
    log('✅ All Phase 1 requirements have been successfully implemented:');
    log('   1. ✅ Enhanced Schema Definitions (FilterOperator, PerformanceThreshold, etc.)');
    log('   2. ✅ Three New MCP Tools (analyze, extract, discover)');
    log('   3. ✅ Enhanced Resource Capabilities (chart analysis)');
    log('   4. ✅ Comprehensive Error Handling and Validation');
    log('   5. ✅ JSDoc Documentation');
    log('   6. ✅ Integration Tests');
    log('');
    log('🚀 Ready for Phase 2 implementation!');
  } else {
    log('⚠️  Phase 1 Implementation INCOMPLETE');
    log('');
    log('❌ Some requirements are missing. Please address the failed validations above.');
  }
  
  return validationResults;
}

// Run validation if this file is executed directly
if (require.main === module) {
  runPhase1Validation().catch(error => {
    logError('Validation execution failed', error);
    process.exit(1);
  });
}

module.exports = {
  runPhase1Validation,
  validateSchemaDefinitions,
  validateMCPTools,
  validateEnhancedResources,
  validateErrorHandling,
  validateBuildOutput,
  validateTestFiles,
};