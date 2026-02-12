#!/usr/bin/env node

/**
 * Skill Installation Validator CLI
 * Validates skill installation requests before execution
 */

const { validateSkillInstallation, getValidSkillNames } = require('./validator');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.length === 0) {
    console.log('Usage:');
    console.log('  cli.js --validate <skill-name>     # Validate a skill name');
    console.log('  cli.js --list-valid                # List all valid skill names');
    console.log('  cli.js --check-url <url>          # Check if URL is a valid skill source');
    return;
  }
  
  if (args.includes('--validate')) {
    const skillName = args[args.indexOf('--validate') + 1];
    if (!skillName) {
      console.error('Error: Missing skill name');
      process.exit(1);
    }
    
    const result = await validateSkillInstallation(skillName);
    if (result.valid) {
      console.log(`✅ Skill "${skillName}" is valid for installation`);
      console.log(`   Source: ${result.source}`);
      console.log(`   Type: ${result.type}`);
    } else {
      console.log(`❌ Skill "${skillName}" is NOT valid for installation`);
      console.log(`   Reason: ${result.reason}`);
      console.log(`   Suggestions: ${result.suggestions.join(', ')}`);
    }
    
    process.exit(result.valid ? 0 : 1);
  }
  
  if (args.includes('--list-valid')) {
    const validSkills = await getValidSkillNames();
    console.log('Valid skill names:');
    validSkills.forEach(skill => console.log(`  - ${skill}`));
  }
  
  if (args.includes('--check-url')) {
    const url = args[args.indexOf('--check-url') + 1];
    if (!url) {
      console.error('Error: Missing URL');
      process.exit(1);
    }
    
    // Simple URL validation
    if (url.endsWith('.tar.gz') || url.includes('clawhub.com')) {
      console.log(`✅ URL appears to be a valid skill source: ${url}`);
    } else if (url.endsWith('.html') || url.includes('.html')) {
      console.log(`❌ URL appears to be an HTML page, not a skill package: ${url}`);
      console.log('   Tip: Use clawhub CLI with skill name instead of downloading HTML files');
    } else {
      console.log(`⚠️  URL format unknown: ${url}`);
      console.log('   Please use official ClawHub skill names or .tar.gz packages');
    }
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}