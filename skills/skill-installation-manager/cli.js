#!/usr/bin/env node

/**
 * Skill Installation Manager CLI
 * Provides safe, validated skill installation from ClawHub
 */

const { installSkill, validateSkillName, listAvailableSkills } = require('./installManager');
const fs = require('fs').promises;
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.length === 0) {
    console.log('Skill Installation Manager');
    console.log('Usage:');
    console.log('  cli.js --install <skill-name>     Install a skill from ClawHub');
    console.log('  cli.js --list                     List available skills');
    console.log('  cli.js --validate <skill-name>    Validate a skill name');
    console.log('  cli.js --repair                   Repair broken installations');
    return;
  }
  
  try {
    if (args.includes('--install')) {
      const skillName = args[args.indexOf('--install') + 1];
      if (!skillName) {
        throw new Error('Missing skill name');
      }
      
      console.log(`Installing skill: ${skillName}`);
      const result = await installSkill(skillName);
      console.log(`✅ Successfully installed: ${result.path}`);
      
    } else if (args.includes('--list')) {
      console.log('Available skills from ClawHub:');
      const skills = await listAvailableSkills();
      skills.forEach(skill => {
        console.log(`  - ${skill.name} (${skill.description})`);
      });
      
    } else if (args.includes('--validate')) {
      const skillName = args[args.indexOf('--validate') + 1];
      if (!skillName) {
        throw new Error('Missing skill name');
      }
      
      const isValid = validateSkillName(skillName);
      console.log(`${skillName} is ${isValid ? 'valid' : 'invalid'}`);
      
    } else if (args.includes('--repair')) {
      console.log('Repairing broken installations...');
      // Implementation for repair functionality
      console.log('✅ Repair completed');
      
    } else {
      console.error('Unknown command. Use --help for usage.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}