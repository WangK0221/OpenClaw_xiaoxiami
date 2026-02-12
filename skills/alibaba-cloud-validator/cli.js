#!/usr/bin/env node

/**
 * Alibaba Cloud Configuration Validator CLI
 * Validates Alibaba Cloud credentials and provides fallback recommendations
 */

const { AlibabaCloudValidator } = require('./validator');

async function main() {
  const validator = new AlibabaCloudValidator();
  const args = process.argv.slice(2);

  if (args.includes('--validate') || args.length === 0) {
    try {
      const result = await validator.validateConfiguration();
      console.log(JSON.stringify(result, null, 2));
      
      if (!result.valid) {
        console.log('\n[AlibabaCloudValidator] Recommendations:');
        if (result.missingCredentials) {
          console.log('- Add ALIBABA_CLOUD_API_KEY to your .env file');
          console.log('- Or configure auth profiles in openclaw.json');
        }
        if (result.fallbackAvailable) {
          console.log('- System will use Google Gemini as fallback model');
        }
      }
    } catch (error) {
      console.error('[AlibabaCloudValidator] Validation failed:', error.message);
      process.exit(1);
    }
  } else if (args.includes('--fix')) {
    try {
      await validator.applyFallbackConfiguration();
      console.log('[AlibabaCloudValidator] Fallback configuration applied successfully');
    } catch (error) {
      console.error('[AlibabaCloudValidator] Failed to apply fallback:', error.message);
      process.exit(1);
    }
  } else {
    console.log('Usage: validator.js [--validate | --fix]');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}