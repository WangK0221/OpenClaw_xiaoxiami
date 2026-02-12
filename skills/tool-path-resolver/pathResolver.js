#!/usr/bin/env node

/**
 * Tool Path Resolver - Resolves PATH issues for exec commands
 * Ensures tools like OpenClaw can be found regardless of execution environment
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class ToolPathResolver {
  constructor() {
    this.knownPaths = [
      '/usr/local/bin',
      '/usr/bin', 
      '/bin',
      '/opt/openclaw/bin',
      '/home/admin/.local/bin',
      '/home/admin/.npm-global/bin',
      process.env.HOME + '/.local/bin',
      process.env.HOME + '/.npm-global/bin'
    ];
    
    // Add current working directory and workspace paths
    this.knownPaths.push(
      process.cwd(),
      '/home/admin/.openclaw/workspace',
      '/home/admin/.openclaw'
    );
    
    // Add any custom paths from environment
    if (process.env.PATH) {
      const envPaths = process.env.PATH.split(':');
      this.knownPaths.push(...envPaths);
    }
    
    // Remove duplicates while preserving order
    this.knownPaths = [...new Set(this.knownPaths)];
  }

  async findExecutable(executableName) {
    // First, check if it's already in PATH
    try {
      await fs.access(executableName, fs.constants.X_OK);
      return executableName;
    } catch (error) {
      // Not directly accessible, continue searching
    }

    // Check each known path
    for (const searchPath of this.knownPaths) {
      const fullPath = path.join(searchPath, executableName);
      try {
        await fs.access(fullPath, fs.constants.X_OK);
        console.log(`[ToolPathResolver] Found ${executableName} at: ${fullPath}`);
        return fullPath;
      } catch (error) {
        // File doesn't exist or isn't executable, continue
      }
    }

    // Try to find via which command as fallback
    try {
      const { execSync } = require('child_process');
      const result = execSync(`which ${executableName}`, { encoding: 'utf8' }).trim();
      if (result) {
        console.log(`[ToolPathResolver] Found ${executableName} via which: ${result}`);
        return result;
      }
    } catch (error) {
      // which command failed, continue
    }

    // If not found, return original name (let system handle it)
    console.warn(`[ToolPathResolver] Could not find ${executableName}, using original name`);
    return executableName;
  }

  async resolveCommand(command) {
    // Parse the command to extract the executable
    const parts = command.trim().split(/\s+/);
    if (parts.length === 0) {
      return command;
    }

    const executable = parts[0];
    
    // Skip if it's a built-in shell command or contains path separators
    if (executable.includes('/') || executable.includes('\\') || this.isShellBuiltin(executable)) {
      return command;
    }

    // Resolve the executable path
    const resolvedExecutable = await this.findExecutable(executable);
    
    // Reconstruct the command
    parts[0] = resolvedExecutable;
    return parts.join(' ');
  }

  isShellBuiltin(command) {
    const builtins = new Set([
      'cd', 'echo', 'exit', 'export', 'pwd', 'source', 'unset', 'alias', 'bg', 'fg', 'jobs', 'kill', 'read', 'test', 'true', 'false'
    ]);
    return builtins.has(command);
  }

  // Enhanced exec function that uses path resolution
  async execWithResolvedPath(command, options = {}) {
    const resolvedCommand = await this.resolveCommand(command);
    
    return new Promise((resolve, reject) => {
      const { exec } = require('child_process');
      const child = exec(resolvedCommand, options);

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

  // Static method for easy integration
  static async resolveAndExec(command, options = {}) {
    const resolver = new ToolPathResolver();
    return resolver.execWithResolvedPath(command, options);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: pathResolver.js <command> [args...]');
    console.log('Or use as module: require("tool-path-resolver").ToolPathResolver');
    process.exit(1);
  }

  const command = args.join(' ');
  const resolver = new ToolPathResolver();
  
  try {
    const resolvedCommand = await resolver.resolveCommand(command);
    console.log(`Resolved command: ${resolvedCommand}`);
    
    // Execute the resolved command
    const { exec } = require('child_process');
    const child = exec(resolvedCommand);
    
    child.stdout?.pipe(process.stdout);
    child.stderr?.pipe(process.stderr);
    
    child.on('close', (code) => {
      process.exit(code);
    });
  } catch (error) {
    console.error('[ToolPathResolver] Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ToolPathResolver };