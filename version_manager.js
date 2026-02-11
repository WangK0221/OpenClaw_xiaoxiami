#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 版本管理器 - 自动管理AI助手的版本和更新
class VersionManager {
  constructor() {
    this.versionFile = path.join(__dirname, 'VERSION.md');
    this.changelogFile = path.join(__dirname, 'CHANGELOG.md');
  }

  // 获取当前版本
  getCurrentVersion() {
    try {
      if (fs.existsSync(this.versionFile)) {
        const content = fs.readFileSync(this.versionFile, 'utf8').trim();
        return content;
      }
    } catch (e) {
      console.log('No version file found, starting with v0.1.0');
    }
    return 'v0.1.0';
  }

  // 递增版本号
  incrementVersion(version, type = 'patch') {
    const match = version.match(/^v(\d+)\.(\d+)\.(\d+)$/);
    if (!match) {
      throw new Error('Invalid version format');
    }
    
    let [major, minor, patch] = match.slice(1).map(Number);
    
    switch (type) {
      case 'major':
        major++;
        minor = 0;
        patch = 0;
        break;
      case 'minor':
        minor++;
        patch = 0;
        break;
      case 'patch':
        patch++;
        break;
      default:
        patch++;
    }
    
    return `v${major}.${minor}.${patch}`;
  }

  // 更新版本文件
  updateVersion(newVersion, changes = []) {
    fs.writeFileSync(this.versionFile, newVersion, 'utf8');
    
    // 更新CHANGELOG
    const timestamp = new Date().toISOString().split('T')[0];
    const changelogEntry = `## ${newVersion} (${timestamp})\n\n${changes.map(c => `- ${c}`).join('\n')}\n\n`;
    
    let changelog = '';
    if (fs.existsSync(this.changelogFile)) {
      changelog = fs.readFileSync(this.changelogFile, 'utf8');
    }
    
    fs.writeFileSync(this.changelogFile, changelogEntry + changelog, 'utf8');
    
    console.log(`✅ Version updated to ${newVersion}`);
    console.log(`📝 Changes logged in CHANGELOG.md`);
  }

  // 检查是否有重大变更
  detectChangeType(evolutionEvent) {
    if (!evolutionEvent) return 'patch';
    
    const intent = evolutionEvent.intent;
    const signals = evolutionEvent.signals || [];
    
    // 如果是创新意图，通常是minor版本
    if (intent === 'innovate') {
      return 'minor';
    }
    
    // 如果是修复严重错误，可能是patch
    if (intent === 'repair' && signals.some(s => s.includes('error') || s.includes('crash'))) {
      return 'patch';
    }
    
    // 如果是优化，通常是patch
    if (intent === 'optimize') {
      return 'patch';
    }
    
    return 'patch';
  }

  // 自动提交并推送
  async autoCommitAndPush(changes = [], evolutionEvent = null) {
    try {
      // 检测变更类型
      const currentVersion = this.getCurrentVersion();
      const changeType = this.detectChangeType(evolutionEvent);
      const newVersion = this.incrementVersion(currentVersion, changeType);
      
      // 更新版本
      this.updateVersion(newVersion, changes);
      
      // Git操作
      execSync('git add .', { stdio: 'inherit' });
      execSync(`git commit -m "🚀 Auto-update to ${newVersion}\n\nEvolution: ${changeType} update\nChanges:\n${changes.map(c => `  - ${c}`).join('\n')}"`, { stdio: 'inherit' });
      execSync('git push origin main', { stdio: 'inherit' });
      
      console.log(`✅ Successfully pushed version ${newVersion} to GitHub`);
      return newVersion;
    } catch (error) {
      console.error('❌ Failed to auto-commit and push:', error.message);
      return null;
    }
  }
}

// 导出模块
module.exports = VersionManager;

// 如果直接运行
if (require.main === module) {
  const vm = new VersionManager();
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // 手动更新版本
    const changeType = args[0] || 'patch';
    const changes = args.slice(1);
    const current = vm.getCurrentVersion();
    const newVersion = vm.incrementVersion(current, changeType);
    vm.updateVersion(newVersion, changes);
  } else {
    console.log('Usage: node version_manager.js [major|minor|patch] [change1] [change2] ...');
  }
}