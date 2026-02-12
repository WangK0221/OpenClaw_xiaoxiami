#!/usr/bin/env node

/**
 * Tool Path Resolver CLI
 * Provides command-line interface for managing tool path resolution
 */

const PathResolver = require('./pathResolver');
const fs = require('fs').promises;
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Tool Path Resolver CLI

Usage:
  cli.js --resolve <tool-name>     Resolve path for a specific tool
  cli.js --list                    List all known tool paths
  cli.js --update                  Update tool path cache
  cli.js --validate                Validate current tool paths
  cli.js --config <path>           Use custom config file
    `);
    return;
  }

  const resolver = new PathResolver();
  
  // Handle custom config
  const configIndex = args.indexOf('--config');
  if (configIndex !== -1 && configIndex + 1 < args.length) {
    const configPath = args[configIndex + 1];
    await resolver.loadConfig(configPath);
  }

  try {
    if (args.includes('--resolve')) {
      const toolIndex = args.indexOf('--resolve');
      if (toolIndex + 1 < args.length) {
        const toolName = args[toolIndex + 1];
        const resolvedPath = await resolver.resolveToolPath(toolName);
        if (resolvedPath) {
          console.log(resolvedPath);
          process.exit(0);
        } else {
          console.error(`Tool '${toolName}' not found`);
          process.exit(1);
        }
      } else {
        console.error('Missing tool name for --resolve');
        process.exit(1);
      }
    } else if (args.includes('--list')) {
      const paths = await resolver.listAllToolPaths();
      console.log(JSON.stringify(paths, null, 2));
    } else if (args.includes('--update')) {
      await resolver.updateToolPathCache();
      console.log('Tool path cache updated successfully');
    } else if (args.includes('--validate')) {
      const results = await resolver.validateToolPaths();
      console.log(JSON.stringify(results, null, 2));
    } else {
      // Default: show help
      console.log('No command specified. Use --help for usage.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}