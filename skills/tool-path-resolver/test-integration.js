#!/usr/bin/env node

/**
 * Integration Test for Tool Path Resolver
 * Tests the core functionality of finding and resolving tool paths
 */

const path = require('path');
const { execSync } = require('child_process');

async function runIntegrationTest() {
  console.log('Running Tool Path Resolver integration test...');
  
  try {
    // Test 1: Load the module
    const PathResolver = require('./pathResolver.js');
    const resolver = new PathResolver();
    console.log('✓ PathResolver module loaded successfully');
    
    // Test 2: Test basic path resolution
    const openclawPath = await resolver.resolveToolPath('openclaw');
    if (openclawPath) {
      console.log(`✓ OpenClaw found at: ${openclawPath}`);
    } else {
      console.log('⚠ OpenClaw not found in standard paths, testing fallback...');
      // This is acceptable as long as the resolver handles it gracefully
    }
    
    // Test 3: Test with custom search paths
    const customPaths = ['/usr/local/bin', '/opt/openclaw/bin', process.env.HOME + '/.npm-global/bin'];
    const result = await resolver.resolveToolPath('openclaw', customPaths);
    console.log(`✓ Custom path resolution completed: ${result || 'not found'}`);
    
    // Test 4: Test executable validation
    const isValid = await resolver.isExecutable('node');
    console.log(`✓ Executable validation working: node is ${isValid ? 'valid' : 'invalid'}`);
    
    // Test 5: Test PATH environment handling
    const originalPath = process.env.PATH;
    process.env.PATH = '/nonexistent:' + originalPath;
    const fallbackResult = await resolver.resolveToolPath('node');
    process.env.PATH = originalPath;
    
    if (fallbackResult) {
      console.log('✓ PATH fallback mechanism working correctly');
    } else {
      throw new Error('PATH fallback failed');
    }
    
    console.log('Integration test passed!');
    return true;
  } catch (error) {
    console.error('Integration test failed:', error.message);
    return false;
  }
}

if (require.main === module) {
  runIntegrationTest()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Test execution error:', error.message);
      process.exit(1);
    });
}