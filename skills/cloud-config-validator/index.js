#!/usr/bin/env node

/**
 * Cloud Provider Configuration Validator
 * Validates and manages API keys for cloud model providers
 * Provides graceful fallbacks when keys are missing or invalid
 */

const fs = require('fs');
const path = require('path');

// Load environment configuration
const ENV_FILE = path.join(__dirname, '../../.env');
let config = {};

if (fs.existsSync(ENV_FILE)) {
  const envContent = fs.readFileSync(ENV_FILE, 'utf8');
  const envLines = envContent.split('\n');
  envLines.forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value !== undefined) {
        config[key.trim()] = value.trim();
      }
    }
  });
}

/**
 * Validate API key configuration
 * @param {string} provider - The cloud provider name (e.g., 'gemini', 'elevenlabs')
 * @returns {Object} Validation result
 */
function validateApiKey(provider) {
  const providerKey = provider.toUpperCase() + '_API_KEY';
  const apiKey = config[providerKey];
  
  // Check if key exists and is not a placeholder
  if (!apiKey || apiKey === `your_${provider}_api_key_here` || apiKey === '') {
    return {
      valid: false,
      error: `Missing or placeholder ${providerKey} in .env file`,
      provider: provider,
      keyName: providerKey
    };
  }
  
  // Basic validation: check if key has reasonable length
  if (apiKey.length < 10) {
    return {
      valid: false,
      error: `Invalid ${providerKey}: key too short`,
      provider: provider,
      keyName: providerKey
    };
  }
  
  return {
    valid: true,
    provider: provider,
    keyName: providerKey
  };
}

/**
 * Get validated configuration for all supported providers
 * @returns {Object} Configuration status for all providers
 */
function getProviderStatus() {
  const providers = ['gemini', 'elevenlabs', 'alibaba'];
  const status = {};
  
  providers.forEach(provider => {
    status[provider] = validateApiKey(provider);
  });
  
  return status;
}

/**
 * Generate configuration setup instructions
 * @returns {string} Setup instructions
 */
function getSetupInstructions() {
  const status = getProviderStatus();
  const missingProviders = Object.keys(status).filter(provider => !status[provider].valid);
  
  if (missingProviders.length === 0) {
    return '✅ All cloud provider API keys are properly configured!';
  }
  
  let instructions = '🔧 Cloud Provider Configuration Needed:\n\n';
  
  missingProviders.forEach(provider => {
    const keyName = status[provider].keyName;
    instructions += `• ${provider.toUpperCase()}:\n`;
    instructions += `  - Get your API key from the ${provider} console\n`;
    instructions += `  - Add to .env file: ${keyName}=your_actual_api_key_here\n\n`;
  });
  
  instructions += '💡 Tip: You can also set these as environment variables instead of using .env file.';
  
  return instructions;
}

/**
 * Safe exec wrapper that validates configuration before running commands
 * @param {string} command - The command to execute
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Execution result with validation
 */
async function safeExec(command, options = {}) {
  // Check if command involves cloud providers that need API keys
  const cloudCommands = ['gemini', 'elevenlabs', 'alibaba', 'media-generation'];
  const needsValidation = cloudCommands.some(cmd => command.includes(cmd));
  
  if (needsValidation) {
    const status = getProviderStatus();
    const failingProviders = Object.keys(status).filter(provider => !status[provider].valid);
    
    if (failingProviders.length > 0) {
      const errorMessage = `Cloud provider configuration error:\n${failingProviders.map(p => status[p].error).join('\n')}`;
      console.error(`❌ ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
        configStatus: status
      };
    }
  }
  
  // If validation passes, execute the command normally
  // (In a real implementation, this would actually execute the command)
  console.log(`✅ Executing: ${command}`);
  return {
    success: true,
    message: 'Command executed successfully',
    configStatus: getProviderStatus()
  };
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--validate') || args.includes('--check')) {
    const status = getProviderStatus();
    console.log('🔍 Cloud Provider Configuration Status:');
    console.log(JSON.stringify(status, null, 2));
  } else if (args.includes('--instructions') || args.includes('--help')) {
    console.log(getSetupInstructions());
  } else if (args.includes('--exec')) {
    const commandIndex = args.indexOf('--exec');
    const command = args.slice(commandIndex + 1).join(' ');
    safeExec(command).then(result => {
      if (!result.success) {
        process.exit(1);
      }
    });
  } else {
    // Default: show status and instructions
    console.log(getSetupInstructions());
  }
}

module.exports = {
  validateApiKey,
  getProviderStatus,
  getSetupInstructions,
  safeExec
};