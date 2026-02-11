/**
 * Exec Automation Configuration
 * Handles both exec and write tool operations with intelligent workflow detection
 */

const DEFAULT_CONFIG = {
  // Maximum number of repeated patterns to auto-automate
  maxAutoPatterns: 5,
  
  // Minimum confidence threshold for automation suggestions
  minConfidence: 0.7,
  
  // API key validation settings
  validateApiKeys: true,
  
  // Fallback behavior when API keys are missing
  fallbackToEmbedded: true,
  
  // Tool usage tracking window (in minutes)
  trackingWindow: 60,
  
  // Enable write operation automation
  enableWriteAutomation: true,
  
  // Enable exec operation automation  
  enableExecAutomation: true,
  
  // Cloud provider configuration
  cloudProviders: {
    gemini: {
      envVar: 'GEMINI_API_KEY',
      placeholder: 'your_gemini_api_key_here'
    },
    elevenlabs: {
      envVar: 'ELEVENLABS_API_KEY', 
      placeholder: 'your_elevenlabs_api_key_here'
    }
  }
};

module.exports = {
  getConfig: () => {
    // Load from environment or use defaults
    const config = { ...DEFAULT_CONFIG };
    
    // Override from environment variables if available
    if (process.env.EXEC_AUTOMATION_MAX_PATTERNS) {
      config.maxAutoPatterns = parseInt(process.env.EXEC_AUTOMATION_MAX_PATTERNS);
    }
    
    if (process.env.EXEC_AUTOMATION_MIN_CONFIDENCE) {
      config.minConfidence = parseFloat(process.env.EXEC_AUTOMATION_MIN_CONFIDENCE);
    }
    
    return config;
  }
};