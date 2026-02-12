#!/usr/bin/env node

/**
 * Heartbeat Optimizer - Reduces unnecessary heartbeat executions by tracking state changes
 * Works alongside task-scheduler to only execute when meaningful work is needed
 */

const fs = require('fs').promises;
const path = require('path');

class HeartbeatOptimizer {
  constructor() {
    this.stateFile = path.join(__dirname, 'heartbeat_state.json');
    this.lastCheckFile = path.join(__dirname, 'last_check.json');
  }

  async loadState() {
    try {
      const data = await fs.readFile(this.stateFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { lastChecks: {}, lastModified: {} };
      }
      throw error;
    }
  }

  async saveState(state) {
    await fs.writeFile(this.stateFile, JSON.stringify(state, null, 2));
  }

  async getLastCheck() {
    try {
      const data = await fs.readFile(this.lastCheckFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { lastRun: 0 };
      }
      throw error;
    }
  }

  async saveLastCheck(timestamp) {
    await fs.writeFile(this.lastCheckFile, JSON.stringify({ lastRun: timestamp }, null, 2));
  }

  async getFileModificationTime(filepath) {
    try {
      const stats = await fs.stat(filepath);
      return stats.mtimeMs;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async shouldExecuteHeartbeat() {
    const now = Date.now();
    const state = await this.loadState();
    const lastCheck = await this.getLastCheck();

    // Check if enough time has passed since last execution
    const minInterval = 30 * 60 * 1000; // 30 minutes minimum
    if (now - lastCheck.lastRun < minInterval) {
      console.log('[HeartbeatOptimizer] Skipping: Too soon since last execution');
      return false;
    }

    // Check for file modifications that might require attention
    const filesToMonitor = [
      '/home/admin/.openclaw/workspace/HEARTBEAT.md',
      '/home/admin/.openclaw/workspace/memory_bridge.js',
      '/home/admin/.openclaw/workspace/tasks.json'
    ];

    let needsExecution = false;
    
    for (const filepath of filesToMonitor) {
      const currentModTime = await this.getFileModificationTime(filepath);
      const lastModTime = state.lastModified[filepath] || 0;

      if (currentModTime && currentModTime > lastModTime) {
        console.log(`[HeartbeatOptimizer] File modified: ${filepath}`);
        needsExecution = true;
        state.lastModified[filepath] = currentModTime;
      }
    }

    // Check if any scheduled tasks are due
    try {
      const tasksFile = '/home/admin/.openclaw/workspace/tasks.json';
      const tasksData = await fs.readFile(tasksFile, 'utf8');
      const tasks = JSON.parse(tasksData);
      
      if (tasks.tasks && Array.isArray(tasks.tasks)) {
        for (const task of tasks.tasks) {
          if (task.enabled) {
            const lastRunTime = state.lastChecks[task.id] || 0;
            if (this.shouldRunTask(task, lastRunTime)) {
              console.log(`[HeartbeatOptimizer] Task due: ${task.name}`);
              needsExecution = true;
              break;
            }
          }
        }
      }
    } catch (error) {
      // No tasks file or invalid format, continue without task checking
    }

    // Update state and save
    await this.saveState(state);
    
    if (needsExecution) {
      await this.saveLastCheck(now);
      return true;
    } else {
      console.log('[HeartbeatOptimizer] No changes detected, skipping heartbeat execution');
      return false;
    }
  }

  shouldRunTask(task, lastRunTime) {
    const now = Date.now();
    
    if (!task.schedule) return false;
    
    switch (task.schedule.type) {
      case 'interval':
        const intervalMs = task.schedule.interval * 1000;
        return !lastRunTime || (now - lastRunTime) >= intervalMs;
      
      case 'cron':
        const lastRun = new Date(lastRunTime || 0);
        const current = new Date(now);
        
        if (task.schedule.minute !== undefined) {
          if (current.getMinutes() === task.schedule.minute && 
              (lastRun.getMinutes() !== task.schedule.minute || 
               current.getHours() !== lastRun.getHours() || 
               current.getDate() !== lastRun.getDate())) {
            return true;
          }
        }
        if (task.schedule.hour !== undefined) {
          if (current.getHours() === task.schedule.hour && 
              (lastRun.getHours() !== task.schedule.hour || 
               current.getDate() !== lastRun.getDate())) {
            return true;
          }
        }
        return false;
      
      default:
        return false;
    }
  }

  async resetState() {
    const emptyState = { lastChecks: {}, lastModified: {} };
    await this.saveState(emptyState);
    await this.saveLastCheck(0);
    console.log('[HeartbeatOptimizer] State reset complete');
  }
}

// CLI interface
async function main() {
  const optimizer = new HeartbeatOptimizer();
  const args = process.argv.slice(2);

  if (args.includes('--reset')) {
    await optimizer.resetState();
  } else if (args.includes('--check')) {
    const shouldExecute = await optimizer.shouldExecuteHeartbeat();
    process.exit(shouldExecute ? 0 : 1);
  } else {
    // Default behavior: check if heartbeat should execute
    const shouldExecute = await optimizer.shouldExecuteHeartbeat();
    if (shouldExecute) {
      console.log('HEARTBEAT_EXECUTE');
    } else {
      console.log('HEARTBEAT_SKIP');
    }
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('[HeartbeatOptimizer] Error:', error.message);
    process.exit(1);
  });
}

module.exports = HeartbeatOptimizer;