#!/usr/bin/env node

/**
 * Task Scheduler CLI - Command line interface for the task scheduler
 */

const path = require('path');
const TaskScheduler = require('./scheduler.js');

async function main() {
  const scheduler = new TaskScheduler();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--run') || args.length === 0) {
    // Run scheduled tasks (default behavior)
    try {
      const results = await scheduler.runScheduledTasks();
      console.log(`[TaskScheduler] Completed ${results.length} tasks`);
    } catch (error) {
      console.error('[TaskScheduler] Error running tasks:', error.message);
      process.exit(1);
    }
  } else if (args.includes('--list')) {
    // List all tasks
    try {
      const tasks = await scheduler.listTasks();
      console.log(JSON.stringify(tasks, null, 2));
    } catch (error) {
      console.error('[TaskScheduler] Error listing tasks:', error.message);
      process.exit(1);
    }
  } else {
    console.log('Usage: cli.js [--run | --list]');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}