#!/usr/bin/env node

/**
 * Integration test for Alibaba Cloud Configuration Validator
 */

const fs = require('fs').promises;
const path = require('path');

async function runIntegrationTest() {
  console.log('Running Alibaba Cloud Validator integration test...');
  
  // Test 1: Load validator module
  try {
    const { AlibabaCloudValidator } = require('./validator');
    console.log('✓ Validator module loaded successfully');
  } catch (error) {
    console.error('✗ Failed to load validator module:', error.message);
    process.exit(1);
  }

  // Test 2: Basic validation without credentials
  try {
    const { AlibabaCloudValidator } = require('./validator');
    const validator = new AlibabaCloudValidator();
    
    // Test with missing credentials
    const configWithoutCreds = {
      providers: {
        'alibaba-cloud': {
          baseUrl: 'https://coding.dashscope.aliyuncs.com/v1',
          api: 'openai-completions'
        }
      }
    };
    
    const result = await validator.validateConfig(configWithoutCreds);
    console.log('✓ Basic validation working:', result.hasValidCredentials ? 'has credentials' : 'missing credentials');
    
    if (!result.hasValidCredentials) {
      console.log('✓ Correctly detected missing credentials');
    }
  } catch (error) {
    console.error('✗ Basic validation failed:', error.message);
    process.exit(1);
  }

  // Test 3: Validation with mock credentials
  try {
    const { AlibabaCloudValidator } = require('./validator');
    const validator = new AlibabaCloudValidator();
    
    // Mock environment with credentials
    process.env.ALIBABA_CLOUD_API_KEY = 'sk-test-key-12345';
    
    const configWithCreds = {
      providers: {
        'alibaba-cloud': {
          baseUrl: 'https://coding.dashscope.aliyuncs.com/v1',
          api: 'openai-completions'
        }
      }
    };
    
    const result = await validator.validateConfig(configWithCreds);
    console.log('✓ Validation with credentials:', result.hasValidCredentials ? 'has credentials' : 'missing credentials');
    
    if (result.hasValidCredentials) {
      console.log('✓ Correctly detected valid credentials');
    }
    
    // Clean up
    delete process.env.ALIBABA_CLOUD_API_KEY;
  } catch (error) {
    console.error('✗ Credential validation failed:', error.message);
    process.exit(1);
  }

  // Test 4: Fallback model selection
  try {
    const { AlibabaCloudValidator } = require('./validator');
    const validator = new AlibabaCloudValidator();
    
    const availableModels = [
      { id: 'alibaba-cloud/qwen3-max-2026-01-23', name: 'qwen3-max-thinking' },
      { id: 'google/gemini-2.0-flash-001', name: 'gemini-2.0-flash-001' }
    ];
    
    const fallbackModel = validator.getFallbackModel(availableModels, 'alibaba-cloud/qwen3-max-2026-01-23');
    console.log('✓ Fallback model selection:', fallbackModel?.id || 'none found');
    
    if (fallbackModel && fallbackModel.id === 'google/gemini-2.0-flash-001') {
      console.log('✓ Correctly selected Google Gemini as fallback');
    }
  } catch (error) {
    console.error('✗ Fallback model selection failed:', error.message);
    process.exit(1);
  }

  // Test 5: Error handling
  try {
    const { AlibabaCloudValidator } = require('./validator');
    const validator = new AlibabaCloudValidator();
    
    // Test error handling for invalid config
    const invalidConfig = null;
    const result = await validator.validateConfig(invalidConfig);
    console.log('✓ Error handling working:', result.hasValidCredentials === false);
  } catch (error) {
    console.error('✗ Error handling failed:', error.message);
    process.exit(1);
  }

  console.log('Integration test passed!');
}

if (require.main === module) {
  runIntegrationTest().catch(error => {
    console.error('Integration test failed:', error.message);
    process.exit(1);
  });
}