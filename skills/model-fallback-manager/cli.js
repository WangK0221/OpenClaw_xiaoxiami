#!/usr/bin/env node

/**
 * Model Fallback Manager CLI
 * Provides command-line interface for managing model fallback configurations
 */

const fs = require('fs').promises;
const path = require('path');
const { FallbackManager } = require('./fallbackManager');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Model Fallback Manager CLI

Usage:
  cli.js --test                    Test current fallback configuration
  cli.js --list                    List available models and providers
  cli.js --status                  Show current fallback status
  cli.js --reset                   Reset fallback configuration to defaults
  cli.js --config <file>           Load configuration from file
  cli.js --set-primary <model>     Set primary model
  cli.js --add-fallback <model>    Add fallback model
  cli.js --remove-fallback <model> Remove fallback model
    `);
    return;
  }

  const manager = new FallbackManager();
  
  try {
    if (args.includes('--test')) {
      console.log('Testing model fallback configuration...');
      const result = await manager.testFallbackConfiguration();
      console.log('Test result:', result.success ? 'PASSED' : 'FAILED');
      if (result.message) {
        console.log('Details:', result.message);
      }
    } 
    else if (args.includes('--list')) {
      const models = await manager.getAvailableModels();
      console.log('Available models:');
      console.table(models);
    }
    else if (args.includes('--status')) {
      const status = await manager.getFallbackStatus();
      console.log('Fallback Status:');
      console.log(JSON.stringify(status, null, 2));
    }
    else if (args.includes('--reset')) {
      await manager.resetToDefaults();
      console.log('Fallback configuration reset to defaults');
    }
    else if (args.includes('--config')) {
      const configFileIndex = args.indexOf('--config');
      if (configFileIndex + 1 < args.length) {
        const configPath = args[configFileIndex + 1];
        await manager.loadConfigurationFromFile(configPath);
        console.log(`Configuration loaded from: ${configPath}`);
      } else {
        console.error('Error: --config requires a file path');
        process.exit(1);
      }
    }
    else if (args.includes('--set-primary')) {
      const modelIndex = args.indexOf('--set-primary');
      if (modelIndex + 1 < args.length) {
        const model = args[modelIndex + 1];
        await manager.setPrimaryModel(model);
        console.log(`Primary model set to: ${model}`);
      } else {
        console.error('Error: --set-primary requires a model name');
        process.exit(1);
      }
    }
    else if (args.includes('--add-fallback')) {
      const modelIndex = args.indexOf('--add-fallback');
      if (modelIndex + 1 < args.length) {
        const model = args[modelIndex + 1];
        await manager.addFallbackModel(model);
        console.log(`Fallback model added: ${model}`);
      } else {
        console.error('Error: --add-fallback requires a model name');
        process.exit(1);
      }
    }
    else if (args.includes('--remove-fallback')) {
      const modelIndex = args.indexOf('--remove-fallback');
      if (modelIndex + 1 < args.length) {
        const model = args[modelIndex + 1];
        await manager.removeFallbackModel(model);
        console.log(`Fallback model removed: ${model}`);
      } else {
        console.error('Error: --remove-fallback requires a model name');
        process.exit(1);
      }
    }
    else {
      // Default: test configuration
      console.log('Testing model fallback configuration...');
      const result = await manager.testFallbackConfiguration();
      console.log('Test result:', result.success ? 'PASSED' : 'FAILED');
      if (result.message) {
        console.log('Details:', result.message);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}