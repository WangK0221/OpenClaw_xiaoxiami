#!/usr/bin/env node

/**
 * Alibaba Cloud Configuration Validator - Handles missing credentials gracefully
 * Prevents system crashes due to 401/404 errors during model discovery
 */

const fs = require('fs').promises;
const path = require('path');

class AlibabaCloudValidator {
  constructor() {
    this.configPath = '/home/admin/.openclaw/openclaw.json';
    this.envPath = '/home/admin/.openclaw/workspace/.env';
    this.validationLog = '/home/admin/.openclaw/workspace/logs/alibaba-validation.log';
  }

  async loadConfig() {
    try {
      const data = await fs.readFile(this.configPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Failed to load OpenClaw config: ${error.message}`);
    }
  }

  async loadEnv() {
    try {
      const data = await fs.readFile(this.envPath, 'utf8');
      const env = {};
      const lines = data.split('\n');
      for (const line of lines) {
        if (line.trim() && !line.startsWith('#')) {
          const [key, value] = line.split('=');
          if (key && value !== undefined) {
            env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
          }
        }
      }
      return env;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {};
      }
      throw new Error(`Failed to load .env file: ${error.message}`);
    }
  }

  async checkAlibabaCredentials(config, env) {
    const issues = [];
    
    // Check if Alibaba Cloud providers are configured
    if (config.models && config.models.providers) {
      const alibabaProviders = Object.keys(config.models.providers).filter(key => 
        key.startsWith('alibaba-cloud')
      );
      
      if (alibabaProviders.length > 0) {
        // Check for API keys in environment or config
        let hasApiKey = false;
        
        // Check environment variables
        if (env.ALIBABA_CLOUD_API_KEY || env.DASHSCOPE_API_KEY) {
          hasApiKey = true;
        }
        
        // Check config for API keys in provider configurations
        for (const provider of alibabaProviders) {
          const providerConfig = config.models.providers[provider];
          if (providerConfig.apiKey) {
            hasApiKey = true;
            break;
          }
        }
        
        if (!hasApiKey) {
          issues.push({
            type: 'missing_api_key',
            severity: 'high',
            message: 'Alibaba Cloud API key not found. Model discovery will fail with 401 Unauthorized.',
            providers: alibabaProviders
          });
        }
      }
    }
    
    return issues;
  }

  async validateAndRecommendFallbacks() {
    try {
      const config = await this.loadConfig();
      const env = await this.loadEnv();
      const issues = await this.checkAlibabaCredentials(config, env);
      
      if (issues.length > 0) {
        console.log('[AlibabaCloudValidator] Issues detected:');
        for (const issue of issues) {
          console.log(`- ${issue.message}`);
        }
        
        // Check if fallback models are available
        const fallbackAvailable = this.checkFallbackAvailability(config);
        if (fallbackAvailable) {
          console.log('[AlibabaCloudValidator] Fallback models available (Google Gemini)');
          console.log('[AlibabaCloudValidator] System will continue operating with fallback models');
        } else {
          console.log('[AlibabaCloudValidator] WARNING: No fallback models available!');
        }
        
        // Log validation results
        await this.logValidation(issues, fallbackAvailable);
        
        return { issues, fallbackAvailable };
      } else {
        console.log('[AlibabaCloudValidator] Alibaba Cloud configuration appears valid');
        await this.logValidation([], true);
        return { issues: [], fallbackAvailable: true };
      }
    } catch (error) {
      console.error('[AlibabaCloudValidator] Validation failed:', error.message);
      await this.logValidation([{ type: 'validation_error', message: error.message }], false);
      return { issues: [{ type: 'validation_error', message: error.message }], fallbackAvailable: false };
    }
  }

  checkFallbackAvailability(config) {
    // Check if Google models are configured and available
    if (config.models && config.models.providers) {
      return !!config.models.providers.google;
    }
    return false;
  }

  async logValidation(issues, fallbackAvailable) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      issues,
      fallbackAvailable,
      status: issues.length === 0 ? 'valid' : 'invalid'
    };
    
    try {
      await fs.appendFile(this.validationLog, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      // Silently fail on logging errors
    }
  }

  async fixConfiguration() {
    try {
      const config = await this.loadConfig();
      
      // Ensure default model is set to a working fallback if Alibaba is problematic
      if (config.agents && config.agents.defaults && config.agents.defaults.model) {
        const currentModel = config.agents.defaults.model.primary;
        if (currentModel && currentModel.startsWith('alibaba-cloud/')) {
          // Check if we have Google models as fallback
          if (config.models && config.models.providers && config.models.providers.google) {
            const googleModel = config.models.providers.google.models?.[0]?.id;
            if (googleModel) {
              config.agents.defaults.model.primary = `google/${googleModel}`;
              console.log(`[AlibabaCloudValidator] Switched default model to Google fallback: google/${googleModel}`);
              
              // Save updated config
              await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
              return true;
            }
          }
        }
      }
      return false;
    } catch (error) {
      console.error('[AlibabaCloudValidator] Failed to fix configuration:', error.message);
      return false;
    }
  }
}

// CLI interface
async function main() {
  const validator = new AlibabaCloudValidator();
  const args = process.argv.slice(2);
  
  if (args.includes('--fix')) {
    const fixed = await validator.fixConfiguration();
    if (fixed) {
      console.log('[AlibabaCloudValidator] Configuration fixed successfully');
    } else {
      console.log('[AlibabaCloudValidator] No fixes applied');
    }
  } else {
    await validator.validateAndRecommendFallbacks();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('[AlibabaCloudValidator] Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = AlibabaCloudValidator;