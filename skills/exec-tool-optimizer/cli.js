#!/usr/bin/env node

/**
 * Exec Tool Optimizer CLI - Provides optimized exec command execution with proper PATH handling
 */

const { ExecToolOptimizer } = require('./optimizer');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Exec Tool Optimizer CLI');
    console.log('Usage:');
    console.log('  cli.js --exec "<command>" [options]     Execute command with optimized PATH');
    console.log('  cli.js --validate                        Validate current PATH configuration');
    console.log('  cli.js --fix-path                        Fix common PATH issues');
    console.log('  cli.js --list-tools                      List available tools in PATH');
    return;
  }

  const optimizer = new ExecToolOptimizer();
  
  try {
    if (args.includes('--exec')) {
      const commandIndex = args.indexOf('--exec');
      if (commandIndex + 1 >= args.length) {
        throw new Error('Missing command for --exec');
      }
      const command = args[commandIndex + 1];
      const result = await optimizer.executeCommand(command);
      console.log(JSON.stringify(result, null, 2));
    } else if (args.includes('--validate')) {
      const validation = await optimizer.validatePath();
      console.log(JSON.stringify(validation, null, 2));
    } else if (args.includes('--fix-path')) {
      await optimizer.fixCommonPathIssues();
      console.log('PATH issues fixed successfully');
    } else if (args.includes('--list-tools')) {
      const tools = await optimizer.listAvailableTools();
      console.log(JSON.stringify(tools, null, 2));
    } else {
      // Default: validate and show status
      const validation = await optimizer.validatePath();
      console.log('Exec Tool Optimizer Status:');
      console.log(`- OpenClaw found: ${validation.openclawFound}`);
      console.log(`- Node found: ${validation.nodeFound}`);
      console.log(`- NPM found: ${validation.npmFound}`);
      console.log(`- Issues detected: ${validation.issues.length}`);
      if (validation.issues.length > 0) {
        console.log('Issues:');
        validation.issues.forEach(issue => console.log(`  - ${issue}`));
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