#!/usr/bin/env node

/**
 * Minimal Skill Name Validator - Prevents invalid skill installation attempts
 * Validates skill names before passing to clawhub CLI
 */

const VALID_SKILL_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
const INVALID_EXTENSIONS = ['.tar.gz', '.zip', '.html', '.js', '.json'];

/**
 * Validates if a skill name is valid for installation
 * @param {string} skillName - The skill name to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidSkillName(skillName) {
  if (!skillName || typeof skillName !== 'string') {
    return false;
  }
  
  // Check for invalid file extensions
  for (const ext of INVALID_EXTENSIONS) {
    if (skillName.endsWith(ext)) {
      console.warn(`❌ Invalid skill name: ${skillName} (contains invalid extension ${ext})`);
      return false;
    }
  }
  
  // Check basic pattern (alphanumeric with hyphens, no special chars)
  if (!VALID_SKILL_PATTERN.test(skillName)) {
    console.warn(`❌ Invalid skill name: ${skillName} (doesn't match pattern [a-z0-9][a-z0-9-]*[a-z0-9])`);
    return false;
  }
  
  // Check for known valid skills in our workspace
  const KNOWN_GOOD_SKILLS = [
    'feishu-evolver-wrapper',
    'evolver', 
    'task-scheduler',
    'heartbeat-optimizer',
    'tool-path-resolver',
    'llm-error-handler',
    'model-fallback-manager',
    'standard-message-utils'
  ];
  
  if (KNOWN_GOOD_SKILLS.includes(skillName)) {
    return true;
  }
  
  // For unknown skills, do a basic sanity check
  if (skillName.length < 3 || skillName.length > 50) {
    console.warn(`❌ Invalid skill name: ${skillName} (length must be 3-50 characters)`);
    return false;
  }
  
  return true;
}

/**
 * Safe wrapper for clawhub installation that validates first
 * @param {string} skillName - The skill name to install
 * @returns {Promise<boolean>} - True if installation should proceed
 */
async function safeInstall(skillName) {
  if (!isValidSkillName(skillName)) {
    console.error(`🚫 Installation blocked: ${skillName} is not a valid skill name`);
    console.error('💡 Valid skill names contain only lowercase letters, numbers, and hyphens');
    console.error('💡 Examples: feishu-evolver-wrapper, task-scheduler, heartbeat-optimizer');
    return false;
  }
  
  console.log(`✅ Valid skill name: ${skillName}`);
  return true;
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: validate.js <skill-name>');
    process.exit(1);
  }
  
  const skillName = args[0];
  const isValid = isValidSkillName(skillName);
  
  if (isValid) {
    console.log('VALID');
    process.exit(0);
  } else {
    console.log('INVALID');
    process.exit(1);
  }
}

module.exports = { isValidSkillName, safeInstall };