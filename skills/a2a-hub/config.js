// A2A Hub Configuration
// This file contains default configuration for A2A Hub integration

const config = {
  // EvoMap Hub endpoint (can be overridden via environment variables)
  hubEndpoint: process.env.A2A_HUB_ENDPOINT || 'https://evomap.ai',
  
  // API key for authentication (optional, can be set via environment)
  apiKey: process.env.A2A_API_KEY || null,
  
  // Node registration settings
  node: {
    // Unique node identifier (will be generated if not provided)
    id: process.env.A2A_NODE_ID || null,
    // Node name/description
    name: process.env.A2A_NODE_NAME || 'OpenClaw Agent',
    // Node capabilities (auto-detected from skills)
    capabilities: [],
    // Node metadata
    metadata: {
      agentId: 'main',
      evolverVersion: '1.10.2',
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version
    }
  },
  
  // Network settings
  network: {
    // Timeout for requests (in milliseconds)
    timeout: parseInt(process.env.A2A_TIMEOUT) || 30000,
    // Maximum number of retries for failed requests
    maxRetries: parseInt(process.env.A2A_MAX_RETRIES) || 3,
    // Retry delay (in milliseconds)
    retryDelay: parseInt(process.env.A2A_RETRY_DELAY) || 1000,
    // Enable/disable SSL verification
    rejectUnauthorized: process.env.A2A_REJECT_UNAUTHORIZED !== 'false'
  },
  
  // Capsule settings
  capsules: {
    // Auto-publish successful evolution capsules
    autoPublish: process.env.A2A_AUTO_PUBLISH === 'true',
    // Minimum confidence threshold for auto-publishing
    minConfidence: parseFloat(process.env.A2A_MIN_CONFIDENCE) || 0.8,
    // Include environment fingerprint in capsules
    includeEnvFingerprint: process.env.A2A_INCLUDE_ENV_FINGERPRINT !== 'false'
  },
  
  // Asset fetching settings
  assets: {
    // Auto-fetch relevant assets before evolution cycles
    autoFetch: process.env.A2A_AUTO_FETCH === 'true',
    // Maximum number of assets to fetch per cycle
    maxAssetsPerCycle: parseInt(process.env.A2A_MAX_ASSETS_PER_CYCLE) || 5,
    // Cache TTL for fetched assets (in milliseconds)
    cacheTtl: parseInt(process.env.A2A_CACHE_TTL) || 3600000 // 1 hour
  },
  
  // Logging settings
  logging: {
    // Enable detailed logging
    verbose: process.env.A2A_VERBOSE === 'true',
    // Log level ('debug', 'info', 'warn', 'error')
    level: process.env.A2A_LOG_LEVEL || 'info'
  }
};

module.exports = config;