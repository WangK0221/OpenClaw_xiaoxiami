#!/usr/bin/env node

/**
 * Skill Installation Validator - Prevents incorrect skill installation attempts
 * Validates skill names and installation sources before attempting installation
 */

const fs = require('fs').promises;
const path = require('path');

class SkillInstallationValidator {
  constructor() {
    // Valid skill name patterns
    this.validSkillPatterns = [
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$/, // lowercase alphanumeric with hyphens
      /^[a-z0-9]+$/, // simple alphanumeric
    ];
    
    // Known valid skill sources
    this.validSources = [
      'clawhub.com',
      'github.com',
      'npmjs.com'
    ];
    
    // Blocked patterns that indicate invalid attempts
    this.blockedPatterns = [
      /\.html?$/i, // HTML files
      /\.tar\.gz$/i, // Direct tar.gz without proper source
      /skills_pack/i, // Generic skill pack attempts
      /autogame-17\/.*\.tar\.gz/i // Specific invalid pattern from logs
    ];
  }

  /**
   * Validates a skill name
   * @param {string} skillName - The skill name to validate
   * @returns {Object} - Validation result with isValid and reason
   */
  validateSkillName(skillName) {
    if (!skillName || typeof skillName !== 'string') {
      return { isValid: false, reason: 'Skill name must be a non-empty string' };
    }
    
    // Check against blocked patterns first
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(skillName)) {
        return { 
          isValid: false, 
          reason: `Skill name matches blocked pattern: ${pattern.toString()}` 
        };
      }
    }
    
    // Check against valid patterns
    for (const pattern of this.validSkillPatterns) {
      if (pattern.test(skillName)) {
        return { isValid: true, reason: 'Valid skill name pattern' };
      }
    }
    
    return { 
      isValid: false, 
      reason: 'Skill name does not match any valid pattern (must be lowercase alphanumeric with optional hyphens)' 
    };
  }

  /**
   * Validates a skill source/URL
   * @param {string} source - The source URL or identifier
   * @returns {Object} - Validation result
   */
  validateSource(source) {
    if (!source || typeof source !== 'string') {
      return { isValid: true, reason: 'No source specified, using default' };
    }
    
    // Check if it's a valid URL format
    try {
      const url = new URL(source.startsWith('http') ? source : `https://${source}`);
      const hostname = url.hostname.toLowerCase();
      
      // Check if hostname is in valid sources
      for (const validSource of this.validSources) {
        if (hostname.includes(validSource)) {
          return { isValid: true, reason: `Valid source: ${validSource}` };
        }
      }
      
      return { 
        isValid: false, 
        reason: `Source hostname ${hostname} not in allowed sources` 
      };
    } catch (error) {
      // Not a valid URL, treat as skill name
      return { isValid: true, reason: 'Treated as skill name rather than URL' };
    }
  }

  /**
   * Comprehensive validation of skill installation request
   * @param {Object} installRequest - Installation request object
   * @param {string} installRequest.skillName - Skill name
   * @param {string} installRequest.source - Source (optional)
   * @returns {Object} - Full validation result
   */
  validateInstallation(installRequest) {
    const { skillName, source } = installRequest;
    
    // Validate skill name
    const nameValidation = this.validateSkillName(skillName);
    if (!nameValidation.isValid) {
      return {
        isValid: false,
        reason: nameValidation.reason,
        errorType: 'invalid_skill_name',
        suggestion: 'Use a valid skill name like "feishu-evolver-wrapper" or "evolver"'
      };
    }
    
    // Validate source if provided
    if (source) {
      const sourceValidation = this.validateSource(source);
      if (!sourceValidation.isValid) {
        return {
          isValid: false,
          reason: sourceValidation.reason,
          errorType: 'invalid_source',
          suggestion: 'Use official sources like clawhub.com or github.com'
        };
      }
    }
    
    return {
      isValid: true,
      reason: 'Installation request is valid',
      validatedSkillName: skillName,
      validatedSource: source || 'default'
    };
  }

  /**
   * Provides helpful suggestions for common invalid patterns
   * @param {string} invalidInput - The invalid input that was detected
   * @returns {string} - Suggested correction
   */
  getSuggestion(invalidInput) {
    // Common patterns and their corrections
    const suggestions = {
      'skills_pack.tar.gz': 'Use specific skill names like "feishu-evolver-wrapper" instead of generic packs',
      'autogame-17/skills_pack.tar.gz': 'Install skills individually using their proper names from ClawHub',
      '.html': 'HTML files are not installable skills; use the actual skill name from the page'
    };
    
    for (const [pattern, suggestion] of Object.entries(suggestions)) {
      if (invalidInput.includes(pattern)) {
        return suggestion;
      }
    }
    
    return 'Ensure you are using a valid skill name from ClawHub or GitHub';
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: validator.js <skill-name> [source]');
    process.exit(1);
  }
  
  const skillName = args[0];
  const source = args[1] || null;
  
  const validator = new SkillInstallationValidator();
  const result = validator.validateInstallation({ skillName, source });
  
  if (result.isValid) {
    console.log('✅ Valid installation request');
    console.log(`   Skill: ${result.validatedSkillName}`);
    console.log(`   Source: ${result.validatedSource}`);
  } else {
    console.error('❌ Invalid installation request');
    console.error(`   Reason: ${result.reason}`);
    console.error(`   Suggestion: ${result.suggestion || validator.getSuggestion(skillName)}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Error in validation:', error.message);
    process.exit(1);
  });
}

module.exports = SkillInstallationValidator;