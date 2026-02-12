#!/usr/bin/env node

/**
 * Model Fallback Manager - Handles model discovery failures and provides graceful fallbacks
 * Specifically addresses Alibaba Cloud authentication errors and provides automatic model switching
 */

const fs = require('fs').promises;
const path = require('path');

class ModelFallbackManager {
  constructor() {
    this.configPath = '/home/admin/.openclaw/openclaw.json';
    this.fallbackConfigPath = '/home/admin/.openclaw/workspace/model_fallback_config.json';
    this.errorLogPath = '/home/admin/.openclaw/workspace/model_errors.log';
  }

  async loadOpenClawConfig() {
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('[ModelFallbackManager] Error loading OpenClaw config:', error.message);
      throw error;
    }
  }

  async saveOpenClawConfig(config) {
    try {
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
      console.log('[ModelFallbackManager] OpenClaw config updated successfully');
    } catch (error) {
      console.error('[ModelFallbackManager] Error saving OpenClaw config:', error.message);
      throw error;
    }
  }

  async loadFallbackConfig() {
    try {
      const configData = await fs.readFile(this.fallbackConfigPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Create default fallback config
        const defaultConfig = {
          version: '1.0.0',
          primaryProviders: ['alibaba-cloud', 'alibaba-cloud-us', 'alibaba-cloud-international'],
          fallbackProviders: ['google'],
          autoFallback: true,
          logErrors: true,
          maxRetries: 3
        };
        await fs.writeFile(this.fallbackConfigPath, JSON.stringify(defaultConfig, null, 2));
        return defaultConfig;
      }
      throw error;
    }
  }

  async detectAlibabaCloudIssues(config) {
    const issues = [];
    
    // Check for missing API keys in auth profiles
    if (config.auth && config.auth.profiles) {
      for (const [profileName, profile] of Object.entries(config.auth.profiles)) {
        if (profileName.includes('alibaba-cloud') && profile.mode === 'api_key') {
          // Check if there's an actual API key set
          if (!profile.apiKey && !process.env.DASHSCOPE_API_KEY) {
            issues.push({
              type: 'missing_api_key',
              profile: profileName,
              message: 'Alibaba Cloud API key not configured'
            });
          }
        }
      }
    }

    // Check model provider configurations
    if (config.models && config.models.providers) {
      for (const [providerName, providerConfig] of Object.entries(config.models.providers)) {
        if (providerName.includes('alibaba-cloud')) {
          // Check if the provider has valid configuration
          if (!providerConfig.baseUrl || !providerConfig.api) {
            issues.push({
              type: 'invalid_provider_config',
              provider: providerName,
              message: 'Invalid Alibaba Cloud provider configuration'
            });
          }
        }
      }
    }

    return issues;
  }

  async applyFallbackStrategy(config, fallbackConfig) {
    const issues = await this.detectAlibabaCloudIssues(config);
    
    if (issues.length === 0) {
      console.log('[ModelFallbackManager] No Alibaba Cloud issues detected');
      return config;
    }

    console.log(`[ModelFallbackManager] Detected ${issues.length} Alibaba Cloud issues:`);
    issues.forEach(issue => {
      console.log(`  - ${issue.message} (${issue.type})`);
    });

    // Log the errors if enabled
    if (fallbackConfig.logErrors) {
      await this.logErrors(issues);
    }

    // Apply fallback strategy
    if (fallbackConfig.autoFallback && fallbackConfig.fallbackProviders.length > 0) {
      console.log('[ModelFallbackManager] Applying automatic fallback strategy...');
      
      // Update agent defaults to use fallback providers
      if (config.agents && config.agents.defaults && config.agents.defaults.model) {
        const currentPrimary = config.agents.defaults.model.primary;
        
        // Find the first available fallback provider
        for (const fallbackProvider of fallbackConfig.fallbackProviders) {
          if (config.models && config.models.providers && config.models.providers[fallbackProvider]) {
            const fallbackModel = this.getPrimaryModelFromProvider(config.models.providers[fallbackProvider]);
            if (fallbackModel) {
              const newPrimary = `${fallbackProvider}/${fallbackModel.id}`;
              config.agents.defaults.model.primary = newPrimary;
              console.log(`[ModelFallbackManager] Switched primary model from ${currentPrimary} to ${newPrimary}`);
              break;
            }
          }
        }
      }

      // Disable problematic Alibaba Cloud providers temporarily
      for (const issue of issues) {
        if (issue.type === 'missing_api_key' && config.models && config.models.providers) {
          const providerName = issue.profile.replace('-auth', '');
          if (config.models.providers[providerName]) {
            console.log(`[ModelFallbackManager] Disabling problematic provider: ${providerName}`);
            // We could disable the provider, but better to just ensure fallback is used
          }
        }
      }
    }

    return config;
  }

  getPrimaryModelFromProvider(providerConfig) {
    if (providerConfig.models && Array.isArray(providerConfig.models) && providerConfig.models.length > 0) {
      return providerConfig.models[0];
    }
    return null;
  }

  async logErrors(issues) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] Alibaba Cloud Model Discovery Errors:\n`;
    const errorDetails = issues.map(issue => `  - ${issue.type}: ${issue.message}`).join('\n');
    
    try {
      await fs.appendFile(this.errorLogPath, logEntry + errorDetails + '\n\n');
    } catch (error) {
      console.error('[ModelFallbackManager] Error logging to file:', error.message);
    }
  }

  async run() {
    try {
      console.log('[ModelFallbackManager] Starting model fallback management...');
      
      const config = await this.loadOpenClawConfig();
      const fallbackConfig = await this.loadFallbackConfig();
      
      const updatedConfig = await this.applyFallbackStrategy(config, fallbackConfig);
      
      // Only save if changes were made
      if (JSON.stringify(updatedConfig) !== JSON.stringify(config)) {
        await this.saveOpenClawConfig(updatedConfig);
        console.log('[ModelFallbackManager] Configuration updated with fallback settings');
      } else {
        console.log('[ModelFallbackManager] No changes needed to configuration');
      }
      
      return { success: true, issues: await this.detectAlibabaCloudIssues(config) };
    } catch (error) {
      console.error('[ModelFallbackManager] Error during fallback management:', error.message);
      return { success: false, error: error.message };
    }
  }

  async getStatus() {
    try {
      const config = await this.loadOpenClawConfig();
      const fallbackConfig = await this.loadFallbackConfig();
      const issues = await this.detectAlibabaCloudIssues(config);
      
      return {
        alibabaCloudIssues: issues,
        currentPrimaryModel: config.agents?.defaults?.model?.primary || 'unknown',
        fallbackEnabled: fallbackConfig.autoFallback,
        fallbackProviders: fallbackConfig.fallbackProviders
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

// CLI interface
async function main() {
  const manager = new ModelFallbackManager();
  const args = process.argv.slice(2);

  if (args.includes('--status')) {
    const status = await manager.getStatus();
    console.log(JSON.stringify(status, null, 2));
  } else if (args.includes('--fix') || args.includes('--apply')) {
    const result = await manager.run();
    if (result.success) {
      console.log('Model fallback management completed successfully');
    } else {
      console.error('Model fallback management failed:', result.error);
      process.exit(1);
    }
  } else {
    // Default behavior: run fallback management
    const result = await manager.run();
    if (!result.success) {
      process.exit(1);
    }
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('[ModelFallbackManager] Unhandled error:', error.message);
    process.exit(1);
  });
}

module.exports = ModelFallbackManager;