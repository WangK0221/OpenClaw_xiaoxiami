#!/usr/bin/env node

/**
 * Skill Installation Manager - Handles proper ClawHub skill installations
 * Provides robust error handling and validation for skill management
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');

class SkillInstallationManager {
  constructor() {
    this.skillsDir = '/home/admin/.openclaw/workspace/skills';
    this.supportedSources = ['clawhub', 'github', 'local'];
  }

  /**
   * Validates a skill name or URL
   * @param {string} skillIdentifier - Skill name or URL
   * @returns {Object} - Validation result with source type and parsed info
   */
  validateSkillIdentifier(skillIdentifier) {
    // Check if it's a ClawHub skill (username/skillname format)
    const clawhubPattern = /^([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)$/;
    if (clawhubPattern.test(skillIdentifier)) {
      const [, username, skillname] = skillIdentifier.match(clawhubPattern);
      return {
        valid: true,
        source: 'clawhub',
        username: username,
        skillname: skillname,
        identifier: `${username}/${skillname}`
      };
    }

    // Check if it's a GitHub URL
    const githubPattern = /^https:\/\/github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)(\.git)?$/;
    if (githubPattern.test(skillIdentifier)) {
      const [, username, reponame] = skillIdentifier.match(githubPattern);
      return {
        valid: true,
        source: 'github',
        username: username,
        reponame: reponame,
        url: skillIdentifier
      };
    }

    // Check if it's a local path
    if (skillIdentifier.startsWith('/') || skillIdentifier.startsWith('./') || skillIdentifier.startsWith('../')) {
      return {
        valid: true,
        source: 'local',
        path: skillIdentifier
      };
    }

    return {
      valid: false,
      error: 'Invalid skill identifier format. Expected: username/skillname, GitHub URL, or local path'
    };
  }

  /**
   * Installs a skill using the appropriate method
   * @param {string} skillIdentifier - Skill to install
   * @returns {Promise<Object>} - Installation result
   */
  async installSkill(skillIdentifier) {
    const validation = this.validateSkillIdentifier(skillIdentifier);
    
    if (!validation.valid) {
      throw new Error(`Invalid skill identifier: ${validation.error}`);
    }

    console.log(`[SkillInstallationManager] Installing ${validation.identifier || validation.url || validation.path}...`);

    switch (validation.source) {
      case 'clawhub':
        return await this.installFromClawHub(validation.username, validation.skillname);
      case 'github':
        return await this.installFromGitHub(validation.url);
      case 'local':
        return await this.installFromLocal(validation.path);
      default:
        throw new Error(`Unsupported source: ${validation.source}`);
    }
  }

  /**
   * Installs a skill from ClawHub
   */
  async installFromClawHub(username, skillname) {
    return new Promise((resolve, reject) => {
      const child = exec(`clawhub install ${username}/${skillname}`, {
        cwd: '/home/admin/.openclaw/workspace'
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
          console.log(`[SkillInstallationManager] Successfully installed ${username}/${skillname}`);
          resolve({
            success: true,
            skill: `${username}/${skillname}`,
            message: 'Skill installed successfully'
          });
        } else {
          const errorMessage = stderr.includes('Skill not found') 
            ? 'Skill not found on ClawHub. Please check the skill name and try again.'
            : `Installation failed: ${stderr}`;
          
          console.error(`[SkillInstallationManager] Failed to install ${username}/${skillname}: ${errorMessage}`);
          reject(new Error(errorMessage));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Lists all installed skills
   */
  async listInstalledSkills() {
    try {
      const skills = await fs.readdir(this.skillsDir);
      const skillDetails = [];
      
      for (const skill of skills) {
        const skillPath = path.join(this.skillsDir, skill);
        const stat = await fs.stat(skillPath);
        
        if (stat.isDirectory()) {
          // Check if it's a valid skill by looking for package.json or index.js
          const hasPackageJson = await this.fileExists(path.join(skillPath, 'package.json'));
          const hasIndexJs = await this.fileExists(path.join(skillPath, 'index.js'));
          
          if (hasPackageJson || hasIndexJs) {
            skillDetails.push({
              name: skill,
              path: skillPath,
              type: hasPackageJson ? 'npm' : 'module'
            });
          }
        }
      }
      
      return skillDetails;
    } catch (error) {
      console.error('[SkillInstallationManager] Error listing skills:', error.message);
      return [];
    }
  }

  /**
   * Checks if a file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets information about a specific skill
   */
  async getSkillInfo(skillName) {
    const skillPath = path.join(this.skillsDir, skillName);
    
    try {
      const stat = await fs.stat(skillPath);
      if (!stat.isDirectory()) {
        return null;
      }

      const info = {
        name: skillName,
        path: skillPath,
        exists: true
      };

      // Try to read package.json for version and description
      try {
        const packageJsonPath = path.join(skillPath, 'package.json');
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
        info.version = packageJson.version;
        info.description = packageJson.description;
        info.main = packageJson.main;
      } catch (error) {
        // package.json not found or invalid, that's okay
      }

      return info;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validates the current skill installation state
   */
  async validateInstallationState() {
    const issues = [];
    
    // Check if skills directory exists
    try {
      await fs.access(this.skillsDir);
    } catch (error) {
      issues.push('Skills directory does not exist');
      return { valid: false, issues };
    }

    // List all skills and check for common issues
    const skills = await this.listInstalledSkills();
    
    if (skills.length === 0) {
      issues.push('No skills found in skills directory');
    }

    // Check for specific required skills
    const requiredSkills = ['feishu-evolver-wrapper', 'evolver'];
    const installedSkillNames = skills.map(s => s.name);
    
    for (const requiredSkill of requiredSkills) {
      if (!installedSkillNames.includes(requiredSkill)) {
        issues.push(`Required skill '${requiredSkill}' is not installed`);
      }
    }

    return {
      valid: issues.length === 0,
      issues: issues,
      skillsCount: skills.length
    };
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: installManager.js [install <skill> | list | validate | info <skill>]');
    process.exit(1);
  }

  const command = args[0];
  const manager = new SkillInstallationManager();

  try {
    switch (command) {
      case 'install':
        if (args.length < 2) {
          console.log('Usage: installManager.js install <skill-name>');
          process.exit(1);
        }
        const result = await manager.installSkill(args[1]);
        console.log(JSON.stringify(result, null, 2));
        break;
        
      case 'list':
        const skills = await manager.listInstalledSkills();
        console.log(JSON.stringify(skills, null, 2));
        break;
        
      case 'validate':
        const validation = await manager.validateInstallationState();
        console.log(JSON.stringify(validation, null, 2));
        break;
        
      case 'info':
        if (args.length < 2) {
          console.log('Usage: installManager.js info <skill-name>');
          process.exit(1);
        }
        const info = await manager.getSkillInfo(args[1]);
        console.log(JSON.stringify(info, null, 2));
        break;
        
      default:
        console.log('Unknown command:', command);
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SkillInstallationManager;