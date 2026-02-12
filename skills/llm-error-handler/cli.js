#!/usr/bin/env node

/**
 * LLM Error Handler - CLI interface for managing LLM error handling and fallbacks
 */

const { ErrorHandler } = require('./errorHandler');
const fs = require('fs').promises;
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
LLM Error Handler CLI

Usage:
  cli.js --test                    Test error handling configuration
  cli.js --status                  Show current error handling status
  cli.js --reset                   Reset error handling state
  cli.js --config <file>           Load configuration from file
  cli.js --fallback-model <model>  Set fallback model
  cli.js --retry-limit <number>    Set retry limit
`);
    return;
  }

  const errorHandler = new ErrorHandler();
  
  try {
    if (args.includes('--test')) {
      // Test error handling
      console.log('[LLMErrorHandler] Testing error handling configuration...');
      const testResult = await errorHandler.testConfiguration();
      console.log(`Test result: ${testResult.success ? 'PASSED' : 'FAILED'}`);
      if (!testResult.success) {
        console.error('Test errors:', testResult.errors);
      }
    } else if (args.includes('--status')) {
      // Show status
      const status = await errorHandler.getStatus();
      console.log(JSON.stringify(status, null, 2));
    } else if (args.includes('--reset')) {
      // Reset state
      await errorHandler.resetState();
      console.log('[LLMErrorHandler] State reset complete');
    } else if (args.includes('--config')) {
      // Load config from file
      const configFileIndex = args.indexOf('--config') + 1;
      if (configFileIndex < args.length) {
        const configFile = args[configFileIndex];
        const config = JSON.parse(await fs.readFile(configFile, 'utf8'));
        await errorHandler.loadConfig(config);
        console.log(`[LLMErrorHandler] Configuration loaded from ${configFile}`);
      } else {
        console.error('[LLMErrorHandler] Error: --config requires a file path');
        process.exit(1);
      }
    } else if (args.includes('--fallback-model')) {
      // Set fallback model
      const modelIndex = args.indexOf('--fallback-model') + 1;
      if (modelIndex < args.length) {
        const fallbackModel = args[modelIndex];
        await errorHandler.setFallbackModel(fallbackModel);
        console.log(`[LLMErrorHandler] Fallback model set to: ${fallbackModel}`);
      } else {
        console.error('[LLMErrorHandler] Error: --fallback-model requires a model name');
        process.exit(1);
      }
    } else if (args.includes('--retry-limit')) {
      // Set retry limit
      const limitIndex = args.indexOf('--retry-limit') + 1;
      if (limitIndex < args.length) {
        const retryLimit = parseInt(args[limitIndex], 10);
        if (!isNaN(retryLimit) && retryLimit >= 0) {
          await errorHandler.setRetryLimit(retryLimit);
          console.log(`[LLMErrorHandler] Retry limit set to: ${retryLimit}`);
        } else {
          console.error('[LLMErrorHandler] Error: --retry-limit requires a valid number');
          process.exit(1);
        }
      } else {
        console.error('[LLMErrorHandler] Error: --retry-limit requires a number');
        process.exit(1);
      }
    } else {
      // Default: show help
      console.log('LLM Error Handler CLI\nUse --help for usage information');
    }
  } catch (error) {
    console.error('[LLMErrorHandler] Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}