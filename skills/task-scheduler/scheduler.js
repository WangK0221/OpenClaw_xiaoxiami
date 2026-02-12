#!/usr/bin/env node

/**
 * Task Scheduler - Lightweight recurring task manager for OpenClaw
 * Integrates with HEARTBEAT.md system for efficient background operations
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');

class TaskScheduler {
  constructor() {
    this.tasksFile = path.join(__dirname, 'tasks.json');
    this.stateFile = path.join(__dirname, 'state.json');
  }

  async loadTasks() {
    try {
      const data = await fs.readFile(this.tasksFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Create default tasks file
        const defaultTasks = {
          version: '1.0.0',
          tasks: []
        };
        await fs.writeFile(this.tasksFile, JSON.stringify(defaultTasks, null, 2));
        return defaultTasks;
      }
      throw error;
    }
  }

  async saveTasks(tasks) {
    await fs.writeFile(this.tasksFile, JSON.stringify(tasks, null, 2));
  }

  async loadState() {
    try {
      const data = await fs.readFile(this.stateFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { lastRun: {} };
      }
      throw error;
    }
  }

  async saveState(state) {
    await fs.writeFile(this.stateFile, JSON.stringify(state, null, 2));
  }

  async executeTask(task) {
    return new Promise((resolve, reject) => {
      const child = exec(task.command, { 
        cwd: task.workdir || process.cwd(),
        timeout: task.timeout || 30000 // 30 seconds default
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, stdout, stderr });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  shouldRunTask(task, lastRunTime) {
    const now = Date.now();
    
    switch (task.schedule.type) {
      case 'interval':
        const intervalMs = task.schedule.interval * 1000;
        return !lastRunTime || (now - lastRunTime) >= intervalMs;
      
      case 'cron':
        // Simple cron-like scheduling (minute/hour patterns)
        const lastRun = new Date(lastRunTime || 0);
        const current = new Date(now);
        
        // Check if we've passed the scheduled time since last run
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

  async runScheduledTasks() {
    const tasksConfig = await this.loadTasks();
    const state = await this.loadState();
    const results = [];

    for (const task of tasksConfig.tasks) {
      if (!task.enabled) continue;

      const lastRunTime = state.lastRun[task.id];
      
      if (this.shouldRunTask(task, lastRunTime)) {
        try {
          console.log(`[TaskScheduler] Executing task: ${task.name}`);
          const result = await this.executeTask(task);
          results.push({ taskId: task.id, success: true, result });
          
          // Update last run time
          state.lastRun[task.id] = Date.now();
        } catch (error) {
          console.error(`[TaskScheduler] Task ${task.name} failed:`, error.message);
          results.push({ taskId: task.id, success: false, error: error.message });
        }
      }
    }

    // Save updated state
    await this.saveState(state);
    return results;
  }

  async addTask(taskConfig) {
    const tasks = await this.loadTasks();
    
    // Validate task config
    if (!taskConfig.name || !taskConfig.command) {
      throw new Error('Task must have name and command');
    }

    const newTask = {
      id: `task_${Date.now()}`,
      enabled: true,
      ...taskConfig
    };

    tasks.tasks.push(newTask);
    await this.saveTasks(tasks);
    return newTask.id;
  }

  async listTasks() {
    const tasks = await this.loadTasks();
    return tasks.tasks;
  }
}

// CLI interface
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
  } else if (args.includes('--add')) {
    // Add a new task (example usage)
    console.log('Use the OpenClaw interface to add tasks via the task_scheduler skill');
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
    console.log('Usage: scheduler.js [--run | --list]');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = TaskScheduler;