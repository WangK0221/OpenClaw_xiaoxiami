#!/usr/bin/env node

/**
 * Heartbeat Optimizer CLI - Command line interface for heartbeat optimization
 */

const fs = require('fs').promises;
const path = require('path');
const { HeartbeatOptimizer } = require('./optimizer');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--optimize') || args.length === 0) {
    // Run optimization check
    try {
      const optimizer = new HeartbeatOptimizer();
      const shouldExecute = await optimizer.shouldExecuteHeartbeat();
      
      if (shouldExecute) {
        console.log('HEARTBEAT_EXECUTE');
        process.exit(0);
      } else {
        console.log('HEARTBEAT_SKIP');
        process.exit(1); // Exit with code 1 to indicate skip
      }
    } catch (error) {
      console.error('[HeartbeatOptimizer] Error during optimization check:', error.message);
      // On error, default to executing (fail-safe)
      console.log('HEARTBEAT_EXECUTE');
      process.exit(0);
    }
  } else if (args.includes('--status')) {
    // Show current status and statistics
    try {
      const optimizer = new HeartbeatOptimizer();
      const stats = await optimizer.getStatistics();
      console.log(JSON.stringify(stats, null, 2));
    } catch (error) {
      console.error('[HeartbeatOptimizer] Error getting status:', error.message);
      process.exit(1);
    }
  } else if (args.includes('--reset')) {
    // Reset optimization state
    try {
      const optimizer = new HeartbeatOptimizer();
      await optimizer.resetState();
      console.log('[HeartbeatOptimizer] State reset successfully');
    } catch (error) {
      console.error('[HeartbeatOptimizer] Error resetting state:', error.message);
      process.exit(1);
    }
  } else {
    console.log('Usage: cli.js [--optimize | --status | --reset]');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}