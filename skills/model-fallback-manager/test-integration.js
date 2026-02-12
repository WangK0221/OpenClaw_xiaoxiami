#!/usr/bin/env node

/**
 * Integration Test for Model Fallback Manager
 * Tests the core functionality of model discovery, error handling, and fallback mechanisms
 */

const fs = require('fs').promises;
const path = require('path');

async function runIntegrationTest() {
  console.log('Running Model Fallback Manager integration test...');
  
  try {
    // Test 1: Load the fallback manager module
    const FallbackManager = require('./fallbackManager');
    const manager = new FallbackManager();
    console.log('✓ Fallback manager module loaded successfully');
    
    // Test 2: Test configuration loading
    await manager.loadConfig();
    console.log('✓ Configuration loaded successfully');
    
    // Test 3: Test model discovery with simulated errors
    const mockProviders = [
      {
        id: 'alibaba-cloud',
        baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
        apiKey: null, // Missing API key to simulate 401 error
        models: ['qwen3-max-2026-01-23']
      },
      {
        id: 'google',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        apiKey: 'AIzaSyDMMHVVzgl5QgPMOHp7ooZB1h6GEN_J3BI',
        models: ['gemini-2.0-flash-001']
      }
    ];
    
    // Test 4: Simulate model discovery with errors
    const availableModels = await manager.discoverAvailableModels(mockProviders);
    console.log(`✓ Model discovery completed with ${availableModels.length} available models`);
    
    // Should have at least the Google model available
    if (availableModels.length === 0) {
      throw new Error('No models discovered - fallback mechanism failed');
    }
    
    // Test 5: Test fallback selection
    const primaryModel = 'alibaba-cloud/qwen3-max-2026-01-23';
    const fallbackModel = manager.getFallbackModel(primaryModel, availableModels);
    console.log(`✓ Fallback model selected: ${fallbackModel}`);
    
    if (!fallbackModel) {
      throw new Error('Fallback model selection failed');
    }
    
    // Test 6: Test health check
    const healthStatus = await manager.checkModelHealth();
    console.log(`✓ Health check completed: ${JSON.stringify(healthStatus)}`);
    
    // Test 7: Test error logging
    manager.logModelError('alibaba-cloud', '401 Unauthorized', 'Missing API key');
    console.log('✓ Error logging working correctly');
    
    console.log('Integration test passed!');
    return true;
  } catch (error) {
    console.error('Integration test failed:', error.message);
    return false;
  }
}

if (require.main === module) {
  runIntegrationTest().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test execution error:', error.message);
    process.exit(1);
  });
}