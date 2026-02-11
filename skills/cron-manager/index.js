#!/usr/bin/env node

/**
 * Cron Manager - Enhanced cron job management for OpenClaw
 * Provides better visualization, deduplication, and management of cron jobs
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class CronManager {
  constructor() {
    this.jobsFile = '/home/admin/.openclaw/cron/jobs.json';
  }

  // Load current cron jobs
  loadJobs() {
    try {
      if (fs.existsSync(this.jobsFile)) {
        const data = fs.readFileSync(this.jobsFile, 'utf8');
        return JSON.parse(data);
      }
      return { jobs: [] };
    } catch (error) {
      console.error('Error loading cron jobs:', error);
      return { jobs: [] };
    }
  }

  // Save updated cron jobs
  saveJobs(jobs) {
    try {
      fs.writeFileSync(this.jobsFile, JSON.stringify(jobs, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving cron jobs:', error);
      return false;
    }
  }

  // Get formatted job list with cards
  getFormattedJobs() {
    const jobsData = this.loadJobs();
    const jobs = jobsData.jobs || [];
    
    if (jobs.length === 0) {
      return "📭 **Cron 配置状态**\n\n**调度器状态：** ✅ 已启用\n**任务总数：** 0 个\n\n目前没有定时任务。";
    }

    // Group jobs by type
    const greetingJobs = jobs.filter(job => job.name.includes('问候'));
    const healthJobs = jobs.filter(job => job.name.includes('喝水') || job.name.includes('健康'));
    const interactionJobs = jobs.filter(job => job.name.includes('互动'));
    const otherJobs = jobs.filter(job => !job.name.includes('问候') && !job.name.includes('喝水') && !job.name.includes('健康') && !job.name.includes('互动'));

    let output = "📊 **Cron 配置状态**\n\n";
    output += `**调度器状态：** ✅ 已启用\n`;
    output += `**任务总数：** ${jobs.length} 个\n`;
    output += `**存储路径：** \`${this.jobsFile}\`\n`;
    output += `**时区：** Asia/Shanghai\n\n`;

    output += "---\n\n📋 **主要任务概览**\n\n";

    if (greetingJobs.length > 0) {
      output += "**🌅 日常问候**\n";
      greetingJobs.forEach(job => {
        const time = this.parseCronTime(job.schedule.expr);
        output += `- ${job.name}: ${time}\n`;
      });
      output += "\n";
    }

    if (healthJobs.length > 0) {
      output += "**💧 健康提醒**\n";
      healthJobs.forEach(job => {
        const time = this.parseCronTime(job.schedule.expr);
        output += `- ${job.name}: ${time}\n`;
      });
      output += "\n";
    }

    if (interactionJobs.length > 0) {
      output += "**🤖 主动互动**\n";
      interactionJobs.forEach(job => {
        const time = this.parseCronTime(job.schedule.expr);
        output += `- ${job.name}: ${time}\n`;
      });
      output += "\n";
    }

    if (otherJobs.length > 0) {
      output += "**🔧 其他任务**\n";
      otherJobs.forEach(job => {
        const time = this.parseCronTime(job.schedule.expr);
        output += `- ${job.name}: ${time}\n`;
      });
      output += "\n";
    }

    // Check for duplicates
    const duplicateCount = this.findDuplicates(jobs);
    if (duplicateCount > 0) {
      output += "⚠️ **发现问题**\n";
      output += `检测到 ${duplicateCount} 个重复任务，建议清理以避免重复提醒。\n\n`;
    }

    output += "🔧 **可用操作**\n";
    output += "- `cron list` - 查看所有任务\n";
    output += "- `cron clean` - 清理重复任务\n";
    output += "- `cron add` - 添加新任务\n";
    output += "- `cron remove <id>` - 删除指定任务\n";

    return output;
  }

  // Parse cron expression to human readable time
  parseCronTime(cronExpr) {
    const parts = cronExpr.split(' ');
    if (parts.length !== 5) return '未知时间';

    const [minute, hour, day, month, weekday] = parts;

    // Simple parsing for common cases
    if (minute === '0' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
      return '整点触发';
    }
    if (minute === '0' && hour !== '*' && day === '*' && month === '*' && weekday === '*') {
      return `${hour}:00 每天`;
    }
    if (minute === '0' && hour.includes(',')) {
      const hours = hour.split(',').map(h => `${h}:00`).join(', ');
      return `${hours} 每天`;
    }

    return cronExpr;
  }

  // Find duplicate jobs
  findDuplicates(jobs) {
    const jobNames = jobs.map(job => job.name);
    const uniqueNames = new Set(jobNames);
    return jobNames.length - uniqueNames.size;
  }

  // Clean duplicate jobs
  cleanDuplicates() {
    const jobsData = this.loadJobs();
    const jobs = jobsData.jobs || [];
    
    const seen = new Set();
    const uniqueJobs = [];
    let removedCount = 0;

    for (const job of jobs) {
      if (!seen.has(job.name)) {
        seen.add(job.name);
        uniqueJobs.push(job);
      } else {
        removedCount++;
      }
    }

    if (removedCount > 0) {
      jobsData.jobs = uniqueJobs;
      this.saveJobs(jobsData);
      return removedCount;
    }

    return 0;
  }
}

// Main execution
if (require.main === module) {
  const manager = new CronManager();
  const args = process.argv.slice(2);
  
  if (args[0] === 'list') {
    console.log(manager.getFormattedJobs());
  } else if (args[0] === 'clean') {
    const removed = manager.cleanDuplicates();
    if (removed > 0) {
      console.log(`✅ 成功清理了 ${removed} 个重复任务`);
    } else {
      console.log('✅ 没有发现重复任务');
    }
  } else {
    // Default: show formatted list
    console.log(manager.getFormattedJobs());
  }
}