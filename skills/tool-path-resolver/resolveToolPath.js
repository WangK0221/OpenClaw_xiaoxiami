const fs = require('fs').promises;
const path = require('path');

async function resolveToolPath(toolName) {
  // Common paths to search
  const searchPaths = [
    '/usr/local/bin',
    '/usr/bin',
    '/bin',
    '/opt/openclaw/bin',
    '/home/admin/.local/bin',
    '/home/admin/.npm-global/bin',
    process.env.HOME + '/.local/bin',
    process.env.HOME + '/.npm-global/bin',
    process.cwd(),
    '/home/admin/.openclaw/workspace',
    '/home/admin/.openclaw'
  ];

  // Add PATH environment paths
  if (process.env.PATH) {
    const envPaths = process.env.PATH.split(':');
    searchPaths.push(...envPaths);
  }

  // Remove duplicates
  const uniquePaths = [...new Set(searchPaths)];

  // Check each path
  for (const searchPath of uniquePaths) {
    const fullPath = path.join(searchPath, toolName);
    try {
      await fs.access(fullPath, fs.constants.X_OK);
      return fullPath;
    } catch (error) {
      // File doesn't exist or isn't executable, continue
    }
  }

  // Try 'which' command as fallback
  try {
    const { execSync } = require('child_process');
    const result = execSync(`which ${toolName}`, { encoding: 'utf8' }).trim();
    if (result) {
      return result;
    }
  } catch (error) {
    // which command failed
  }

  // Not found
  return null;
}

module.exports = resolveToolPath;