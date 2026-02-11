#!/usr/bin/env node

/**
 * Exec Automation - Intelligent Command Execution Manager
 * Automatically handles repeated exec tool usage patterns
 * Reduces manual repetition and improves execution reliability
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Configuration
const EXEC_CACHE_DIR = path.join(__dirname, 'cache');
const MAX_CACHE_SIZE = 100; // Maximum number of cached command patterns
const CACHE_TTL_HOURS = 24; // Cache expiration time

// Ensure cache directory exists
if (!fs.existsSync(EXEC_CACHE_DIR)) {
  fs.mkdirSync(EXEC_CACHE_DIR, { recursive: true });
}

/**
 * Analyze command patterns and detect repetition
 * @param {string} command - The command to analyze
 * @returns {Object} Analysis result with pattern info
 */
function analyzeCommandPattern(command) {
  // Extract command name and common parameters
  const parts = command.trim().split(/\s+/);
  const cmdName = parts[0];
  const args = parts.slice(1);
  
  // Identify common patterns (e.g., git commands, npm commands, etc.)
  const patterns = {
    isGit: cmdName === 'git',
    isNpm: cmdName === 'npm' || cmdName === 'yarn' || cmdName === 'pnpm',
    isSystem: ['ls', 'cd', 'pwd', 'mkdir', 'rm', 'cp', 'mv'].includes(cmdName),
    hasFilePath: args.some(arg => arg.includes('/') || arg.includes('\\') || arg.includes('.')),
    hasFlags: args.some(arg => arg.startsWith('-')),
  };
  
  return {
    command,
    cmdName,
    args,
    patterns,
    hash: Buffer.from(command).toString('base64').substring(0, 32)
  };
}

/**
 * Cache execution results for repeated commands
 * @param {string} command - The command executed
 * @param {Object} result - Execution result
 */
function cacheExecutionResult(command, result) {
  try {
    const analysis = analyzeCommandPattern(command);
    const cacheFile = path.join(EXEC_CACHE_DIR, `${analysis.hash}.json`);
    
    const cacheEntry = {
      command,
      timestamp: Date.now(),
      result,
      analysis
    };
    
    fs.writeFileSync(cacheFile, JSON.stringify(cacheEntry, null, 2));
    
    // Clean up old cache files if we exceed the limit
    cleanupCache();
  } catch (error) {
    console.warn(`Failed to cache execution result: ${error.message}`);
  }
}

/**
 * Check if a command has been executed recently
 * @param {string} command - The command to check
 * @returns {Object|null} Cached result or null if not found/expired
 */
function getCachedResult(command) {
  try {
    const analysis = analyzeCommandPattern(command);
    const cacheFile = path.join(EXEC_CACHE_DIR, `${analysis.hash}.json`);
    
    if (!fs.existsSync(cacheFile)) {
      return null;
    }
    
    const cacheEntry = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    const now = Date.now();
    const ttlMs = CACHE_TTL_HOURS * 60 * 60 * 1000;
    
    // Check if cache is still valid
    if (now - cacheEntry.timestamp > ttlMs) {
      fs.unlinkSync(cacheFile); // Remove expired cache
      return null;
    }
    
    return cacheEntry.result;
  } catch (error) {
    console.warn(`Failed to get cached result: ${error.message}`);
    return null;
  }
}

/**
 * Clean up cache directory to maintain size limits
 */
function cleanupCache() {
  try {
    const files = fs.readdirSync(EXEC_CACHE_DIR);
    if (files.length <= MAX_CACHE_SIZE) {
      return;
    }
    
    // Sort files by modification time (oldest first)
    const fileStats = files.map(file => {
      const fullPath = path.join(EXEC_CACHE_DIR, file);
      return {
        name: file,
        mtime: fs.statSync(fullPath).mtimeMs
      };
    }).sort((a, b) => a.mtime - b.mtime);
    
    // Remove oldest files beyond the limit
    const toRemove = fileStats.slice(MAX_CACHE_SIZE);
    toRemove.forEach(file => {
      fs.unlinkSync(path.join(EXEC_CACHE_DIR, file.name));
    });
    
    console.log(`🧹 Cleaned up ${toRemove.length} old cache entries`);
  } catch (error) {
    console.warn(`Failed to cleanup cache: ${error.message}`);
  }
}

/**
 * Execute a command with intelligent caching and error handling
 * @param {string} command - Command to execute
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Execution result
 */
async function executeCommand(command, options = {}) {
  // Check cache first for non-mutating commands
  const analysis = analyzeCommandPattern(command);
  const isSafeToCache = !analysis.patterns.isSystem && 
                       !command.includes('rm ') && 
                       !command.includes('mv ') && 
                       !command.includes('cp ') &&
                       !command.includes('>') &&
                       !command.includes('|');
  
  if (isSafeToCache) {
    const cached = getCachedResult(command);
    if (cached) {
      console.log(`📦 Using cached result for: ${command}`);
      return cached;
    }
  }
  
  console.log(`⚡ Executing: ${command}`);
  
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const child = spawn(command, [], {
      shell: true,
      cwd: options.cwd || process.cwd(),
      env: { ...process.env, ...options.env }
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      const executionTime = Date.now() - startTime;
      const result = {
        code,
        stdout,
        stderr,
        executionTime,
        success: code === 0
      };
      
      // Cache successful results for safe commands
      if (result.success && isSafeToCache) {
        cacheExecutionResult(command, result);
      }
      
      if (code === 0) {
        resolve(result);
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Get execution statistics
 * @returns {Object} Statistics about command usage
 */
function getExecutionStats() {
  try {
    const files = fs.readdirSync(EXEC_CACHE_DIR);
    const stats = {
      totalCommands: files.length,
      lastCleanup: null,
      mostUsedCommands: []
    };
    
    // Read all cache entries to build statistics
    const entries = files.map(file => {
      try {
        return JSON.parse(fs.readFileSync(path.join(EXEC_CACHE_DIR, file), 'utf8'));
      } catch (error) {
        return null;
      }
    }).filter(Boolean);
    
    // Count command frequencies
    const commandCounts = {};
    entries.forEach(entry => {
      const cmd = entry.command.split(' ')[0];
      commandCounts[cmd] = (commandCounts[cmd] || 0) + 1;
    });
    
    // Get top 5 most used commands
    stats.mostUsedCommands = Object.entries(commandCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([cmd, count]) => ({ command: cmd, count }));
    
    return stats;
  } catch (error) {
    console.warn(`Failed to get execution stats: ${error.message}`);
    return { totalCommands: 0, mostUsedCommands: [] };
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--stats')) {
    const stats = getExecutionStats();
    console.log('📊 Exec Automation Statistics:');
    console.log(`Total cached commands: ${stats.totalCommands}`);
    console.log('Most used commands:');
    stats.mostUsedCommands.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.command} (${item.count} times)`);
    });
  } else if (args.length > 0) {
    const command = args.join(' ');
    executeCommand(command)
      .then(result => {
        if (result.stdout) console.log(result.stdout);
        if (result.stderr) console.error(result.stderr);
        process.exit(result.code);
      })
      .catch(error => {
        console.error(`❌ Execution failed: ${error.message}`);
        process.exit(1);
      });
  } else {
    console.log('Exec Automation - Intelligent Command Execution Manager');
    console.log('Usage:');
    console.log('  exec-automation <command>     # Execute with caching');
    console.log('  exec-automation --stats      # Show execution statistics');
  }
}

module.exports = {
  executeCommand,
  analyzeCommandPattern,
  getCachedResult,
  cacheExecutionResult,
  getExecutionStats
};