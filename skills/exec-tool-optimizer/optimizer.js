#!/usr/bin/env node

/**
 * Exec Tool Optimizer - Handles PATH resolution and error handling for exec commands
 * Fixes recurring "spawn /home/admin/.npm-global/bin/openclaw ENOENT" errors
 */

const fs = require('fs').promises;
const path = require('path');
const { exec, spawn } = require('child_process');

class ExecToolOptimizer {
  constructor() {
    this.configFile = path.join(__dirname, 'config.json');
    this.pathCache = new Map();
  }

  async loadConfig() {
    try {
      const data = await fs.readFile(this.configFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Create default config
        const defaultConfig = {
          version: '1.0.0',
          pathResolvers: {
            openclaw: {
              searchPaths: [
                '/home/admin/.openclaw/bin/openclaw',
                '/opt/openclaw/bin/openclaw',
                '/usr/local/bin/openclaw',
                '/usr/bin/openclaw'
              ],
              fallbackCommand: 'node /opt/openclaw/index.js'
            }
          },
          errorHandling: {
            retryAttempts: 2,
            timeoutMs: 60000
          }
        };
        await fs.writeFile(this.configFile, JSON.stringify(defaultConfig, null, 2));
        return defaultConfig;
      }
      throw error;
    }
  }

  async findExecutable(commandName, searchPaths) {
    // Check cache first
    if (this.pathCache.has(commandName)) {
      return this.pathCache.get(commandName);
    }

    // Try each search path
    for (const searchPath of searchPaths) {
      try {
        await fs.access(searchPath, fs.constants.X_OK);
        this.pathCache.set(commandName, searchPath);
        return searchPath;
      } catch (error) {
        // Path doesn't exist or isn't executable, continue to next
        continue;
      }
    }

    // Not found in any search path
    return null;
  }

  async executeCommand(command, options = {}) {
    const config = await this.loadConfig();
    const commandParts = command.split(' ');
    const executable = commandParts[0];
    
    // Check if we have a resolver for this executable
    if (config.pathResolvers[executable]) {
      const resolver = config.pathResolvers[executable];
      const resolvedPath = await this.findExecutable(executable, resolver.searchPaths);
      
      if (resolvedPath) {
        // Use resolved path
        const newCommand = resolvedPath + ' ' + commandParts.slice(1).join(' ');
        return this.executeWithRetry(newCommand, options, config.errorHandling);
      } else if (resolver.fallbackCommand) {
        // Use fallback command
        const fallbackCommand = resolver.fallbackCommand + ' ' + commandParts.slice(1).join(' ');
        console.warn(`[ExecToolOptimizer] Using fallback for ${executable}: ${fallbackCommand}`);
        return this.executeWithRetry(fallbackCommand, options, config.errorHandling);
      }
    }

    // No resolver, execute as-is with retry
    return this.executeWithRetry(command, options, config.errorHandling);
  }

  executeWithRetry(command, options, errorConfig) {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      
      const tryExecute = () => {
        attempts++;
        
        const child = exec(command, { 
          ...options,
          timeout: errorConfig.timeoutMs || 60000
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
            resolve({ success: true, stdout, stderr, code });
          } else if (attempts < errorConfig.retryAttempts + 1) {
            console.warn(`[ExecToolOptimizer] Command failed (attempt ${attempts}), retrying...`);
            setTimeout(tryExecute, 1000 * attempts);
          } else {
            reject(new Error(`Command failed after ${attempts} attempts: ${stderr || 'exit code ' + code}`));
          }
        });

        child.on('error', (error) => {
          if (attempts < errorConfig.retryAttempts + 1) {
            console.warn(`[ExecToolOptimizer] Command error (attempt ${attempts}), retrying...`);
            setTimeout(tryExecute, 1000 * attempts);
          } else {
            reject(error);
          }
        });
      };

      tryExecute();
    });
  }

  async getOptimizedCommand(originalCommand) {
    const config = await this.loadConfig();
    const commandParts = originalCommand.split(' ');
    const executable = commandParts[0];
    
    if (config.pathResolvers[executable]) {
      const resolver = config.pathResolvers[executable];
      const resolvedPath = await this.findExecutable(executable, resolver.searchPaths);
      
      if (resolvedPath) {
        return resolvedPath + ' ' + commandParts.slice(1).join(' ');
      } else if (resolver.fallbackCommand) {
        return resolver.fallbackCommand + ' ' + commandParts.slice(1).join(' ');
      }
    }
    
    return originalCommand;
  }
}

// CLI interface
async function main() {
  const optimizer = new ExecToolOptimizer();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: optimizer.js <command>');
    process.exit(1);
  }
  
  const command = args.join(' ');
  
  try {
    const result = await optimizer.executeCommand(command);
    console.log(result.stdout);
    if (result.stderr) {
      console.error(result.stderr);
    }
    process.exit(0);
  } catch (error) {
    console.error('[ExecToolOptimizer] Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ExecToolOptimizer;