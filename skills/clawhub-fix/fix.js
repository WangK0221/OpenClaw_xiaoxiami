#!/usr/bin/env node

/**
 * ClawHub CLI Fix - Ensures proper skill installation
 * Prevents attempts to install from invalid sources like HTML files
 */

const fs = require('fs');
const path = require('path');

// Simple validation function for skill names
function isValidSkillName(skillName) {
  // Valid skill names should:
  // - Not contain file extensions like .tar.gz, .html, etc.
  // - Follow the format: username/skill-name or skill-name
  // - Not contain invalid characters
  
  if (!skillName || typeof skillName !== 'string') {
    return false;
  }
  
  // Check for common invalid patterns
  const invalidPatterns = [
    /\.tar\.gz$/,
    /\.zip$/,
    /\.html?$/,
    /\.js$/,
    /\.json$/,
    /skills_pack/,
    /\/\//
  ];
  
  for (const pattern of invalidPatterns) {
    if (pattern.test(skillName)) {
      return false;
    }
  }
  
  // Check for valid format: either "username/skill-name" or "skill-name"
  const parts = skillName.split('/');
  if (parts.length > 2) {
    return false;
  }
  
  // Each part should be alphanumeric with hyphens and underscores allowed
  const validPartRegex = /^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$/;
  for (const part of parts) {
    if (!validPartRegex.test(part)) {
      return false;
    }
  }
  
  return true;
}

// Wrapper function for clawhub install
async function safeClawhubInstall(skillName, options = {}) {
  if (!isValidSkillName(skillName)) {
    console.error(`❌ Invalid skill name: ${skillName}`);
    console.error('Valid skill names should be in format: username/skill-name or skill-name');
    console.error('Examples: autogame-17/feishu-evolver-wrapper, task-scheduler');
    return { success: false, error: 'Invalid skill name' };
  }
  
  try {
    // Execute the actual clawhub install command
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
      const cmd = `clawhub install ${skillName} ${options.force ? '--force' : ''}`;
      console.log(`📦 Installing skill: ${skillName}`);
      
      const child = exec(cmd, { cwd: '/home/admin/.openclaw/workspace' });
      
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
          console.log(`✅ Successfully installed: ${skillName}`);
          resolve({ success: true, stdout, stderr });
        } else {
          console.error(`❌ Failed to install ${skillName}: ${stderr}`);
          resolve({ success: false, error: stderr, code });
        }
      });
      
      child.on('error', (error) => {
        console.error(`❌ Error installing ${skillName}: ${error.message}`);
        resolve({ success: false, error: error.message });
      });
    });
  } catch (error) {
    console.error(`❌ Unexpected error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node fix.js <skill-name> [--force]');
    console.log('Example: node fix.js autogame-17/feishu-evolver-wrapper');
    process.exit(1);
  }
  
  const skillName = args[0];
  const force = args.includes('--force');
  
  safeClawhubInstall(skillName, { force })
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unexpected error:', error.message);
      process.exit(1);
    });
}

module.exports = { isValidSkillName, safeClawhubInstall };