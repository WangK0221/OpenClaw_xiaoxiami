#!/usr/bin/env node

/**
 * LLM Error Handler - Provides robust error handling and fallback mechanisms for LLM API calls
 * Specifically handles Google Gemini API errors and provides graceful degradation
 */

const fs = require('fs').promises;
const path = require('path');

class LLMErrorHandler {
  constructor() {
    this.configFile = path.join(__dirname, 'config.json');
    this.errorLog = path.join(__dirname, 'error_log.json');
  }

  async loadConfig() {
    try {
      const data = await fs.readFile(this.configFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Create default config
        const defaultConfig = {
          version: '1.0.0',
          maxRetries: 3,
          retryDelayMs: 1000,
          fallbackEnabled: true,
          errorPatterns: {
            '400': {
              message: 'Bad request - check input format',
              action: 'validate_input'
            },
            '401': {
              message: 'Unauthorized - check API key',
              action: 'check_auth'
            },
            '429': {
              message: 'Rate limited - implement backoff',
              action: 'rate_limit_backoff'
            },
            '500': {
              message: 'Server error - retry with backoff',
              action: 'retry_with_backoff'
            }
          }
        };
        await fs.writeFile(this.configFile, JSON.stringify(defaultConfig, null, 2));
        return defaultConfig;
      }
      throw error;
    }
  }

  async logError(error, context = {}) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        error: error.message || String(error),
        stack: error.stack,
        context: context
      };

      let logs = [];
      try {
        const existing = await fs.readFile(this.errorLog, 'utf8');
        logs = JSON.parse(existing);
      } catch (e) {
        // Log file doesn't exist or is empty
      }

      logs.push(logEntry);
      
      // Keep only last 100 errors to prevent log bloat
      if (logs.length > 100) {
        logs = logs.slice(-100);
      }

      await fs.writeFile(this.errorLog, JSON.stringify(logs, null, 2));
    } catch (logError) {
      console.error('[LLMErrorHandler] Failed to log error:', logError.message);
    }
  }

  async handleLLMError(error, context = {}) {
    await this.logError(error, context);
    
    const config = await this.loadConfig();
    const errorCode = this.extractErrorCode(error);
    
    if (errorCode && config.errorPatterns[errorCode]) {
      const pattern = config.errorPatterns[errorCode];
      console.warn(`[LLMErrorHandler] Detected error pattern: ${pattern.message}`);
      
      switch (pattern.action) {
        case 'validate_input':
          return this.handleInputValidationError(error, context);
        case 'check_auth':
          return this.handleAuthError(error, context);
        case 'rate_limit_backoff':
          return this.handleRateLimitError(error, context);
        case 'retry_with_backoff':
          return this.handleServerError(error, context);
        default:
          return { success: false, error: error, handled: false };
      }
    }
    
    // Generic error handling
    return { success: false, error: error, handled: false };
  }

  extractErrorCode(error) {
    // Extract error code from various error formats
    const errorStr = error.message || String(error);
    
    // Look for HTTP status codes
    const httpMatch = errorStr.match(/(400|401|403|404|429|500|502|503|504)/);
    if (httpMatch) {
      return httpMatch[1];
    }
    
    // Look for specific error patterns
    if (errorStr.includes('GenerateContent') && errorStr.includes('400')) {
      return '400';
    }
    
    if (errorStr.includes('API key') || errorStr.includes('unauthorized')) {
      return '401';
    }
    
    if (errorStr.includes('rate limit') || errorStr.includes('quota')) {
      return '429';
    }
    
    if (errorStr.includes('server error') || errorStr.includes('internal server')) {
      return '500';
    }
    
    return null;
  }

  async handleInputValidationError(error, context) {
    console.warn('[LLMErrorHandler] Input validation error detected. Attempting to clean input...');
    
    // Try to sanitize input if provided
    if (context.input) {
      const cleanedInput = this.sanitizeInput(context.input);
      if (cleanedInput !== context.input) {
        console.log('[LLMErrorHandler] Input sanitized, retrying with cleaned input');
        return { success: true, retry: true, cleanedInput: cleanedInput };
      }
    }
    
    return { success: false, error: error, handled: true, message: 'Input validation failed' };
  }

  async handleAuthError(error, context) {
    console.error('[LLMErrorHandler] Authentication error detected. Please check your API key configuration.');
    return { success: false, error: error, handled: true, message: 'Authentication failed' };
  }

  async handleRateLimitError(error, context) {
    console.warn('[LLMErrorHandler] Rate limit error detected. Implementing exponential backoff...');
    const config = await this.loadConfig();
    const delay = config.retryDelayMs * Math.pow(2, context.retryCount || 0);
    return { success: true, retry: true, delay: delay, message: 'Rate limited, backing off' };
  }

  async handleServerError(error, context) {
    console.warn('[LLMErrorHandler] Server error detected. Retrying with backoff...');
    const config = await this.loadConfig();
    const delay = config.retryDelayMs * (context.retryCount || 1);
    return { success: true, retry: true, delay: delay, message: 'Server error, retrying' };
  }

  sanitizeInput(input) {
    // Remove problematic characters that might cause API errors
    if (typeof input === 'string') {
      // Remove null bytes and other problematic characters
      return input.replace(/\u0000/g, '').replace(/\ufffd/g, '');
    }
    return input;
  }

  async getErrorStats() {
    try {
      const data = await fs.readFile(this.errorLog, 'utf8');
      const logs = JSON.parse(data);
      
      const stats = {
        totalErrors: logs.length,
        errorTypes: {},
        lastError: logs.length > 0 ? logs[logs.length - 1] : null
      };
      
      logs.forEach(log => {
        const errorCode = this.extractErrorCode({ message: log.error });
        if (errorCode) {
          stats.errorTypes[errorCode] = (stats.errorTypes[errorCode] || 0) + 1;
        }
      });
      
      return stats;
    } catch (error) {
      return { totalErrors: 0, errorTypes: {}, lastError: null };
    }
  }
}

// CLI interface
async function main() {
  const handler = new LLMErrorHandler();
  const args = process.argv.slice(2);
  
  if (args.includes('--stats')) {
    const stats = await handler.getErrorStats();
    console.log(JSON.stringify(stats, null, 2));
  } else if (args.includes('--clear')) {
    try {
      await fs.unlink(handler.errorLog);
      console.log('[LLMErrorHandler] Error log cleared');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('[LLMErrorHandler] Error clearing log:', error.message);
      }
    }
  } else {
    console.log('Usage: errorHandler.js [--stats | --clear]');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = LLMErrorHandler;