// utils.js - A2A Hub Utility Functions
// Provides helper functions for A2A Hub operations

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Validates if a capsule has the required structure
 * @param {Object} capsule - The capsule object to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateCapsule(capsule) {
  if (!capsule || typeof capsule !== 'object') {
    return false;
  }
  
  const requiredFields = ['type', 'id', 'trigger', 'gene', 'summary', 'confidence'];
  return requiredFields.every(field => field in capsule);
}

/**
 * Generates a unique asset ID using SHA256 hash
 * @param {Object} asset - The asset object to hash
 * @returns {string} - SHA256 hash prefixed with 'sha256:'
 */
function generateAssetId(asset) {
  if (!asset) {
    throw new Error('Asset cannot be null or undefined');
  }
  
  const assetString = JSON.stringify(asset, Object.keys(asset).sort());
  const hash = crypto.createHash('sha256').update(assetString).digest('hex');
  return `sha256:${hash}`;
}

/**
 * Creates a safe filename from a capsule ID
 * @param {string} capsuleId - The capsule ID
 * @returns {string} - Safe filename
 */
function createSafeFilename(capsuleId) {
  return capsuleId.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Ensures directory exists
 * @param {string} dirPath - Directory path to ensure
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Reads all capsules from a directory
 * @param {string} dirPath - Directory path containing capsules
 * @returns {Array} - Array of capsule objects
 */
function readAllCapsules(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  
  const files = fs.readdirSync(dirPath);
  const capsules = [];
  
  for (const file of files) {
    if (file.endsWith('.json')) {
      try {
        const filePath = path.join(dirPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const capsule = JSON.parse(content);
        if (validateCapsule(capsule)) {
          capsules.push(capsule);
        }
      } catch (error) {
        console.warn(`Warning: Skipping invalid capsule file ${file}: ${error.message}`);
      }
    }
  }
  
  return capsules;
}

/**
 * Finds matching capsules based on trigger signals
 * @param {Array} capsules - Array of capsule objects
 * @param {Array} signals - Array of trigger signals to match
 * @returns {Array} - Matching capsules sorted by confidence (highest first)
 */
function findMatchingCapsules(capsules, signals) {
  if (!Array.isArray(signals) || signals.length === 0) {
    return [];
  }
  
  const matches = capsules.filter(capsule => {
    if (!Array.isArray(capsule.trigger)) {
      return false;
    }
    
    // Check if any signal in the input matches any trigger in the capsule
    return signals.some(signal => 
      capsule.trigger.some(trigger => 
        signal.includes(trigger) || trigger.includes(signal)
      )
    );
  });
  
  // Sort by confidence (highest first)
  return matches.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
}

/**
 * Creates an environment fingerprint for capsule compatibility
 * @returns {Object} - Environment fingerprint object
 */
function createEnvFingerprint() {
  return {
    node_version: process.version,
    platform: process.platform,
    arch: process.arch,
    os_release: require('os').release(),
    evolver_version: '1.10.2', // Current evolver version from context
    cwd: process.cwd(),
    captured_at: new Date().toISOString()
  };
}

/**
 * Checks if a capsule is compatible with current environment
 * @param {Object} capsule - Capsule object with env_fingerprint
 * @param {Object} currentEnv - Current environment fingerprint
 * @returns {boolean} - True if compatible, false otherwise
 */
function isCapsuleCompatible(capsule, currentEnv) {
  if (!capsule.env_fingerprint) {
    return true; // Assume compatible if no fingerprint
  }
  
  const capsuleEnv = capsule.env_fingerprint;
  
  // Basic compatibility checks
  if (capsuleEnv.node_version && 
      !currentEnv.node_version.startsWith(capsuleEnv.node_version.split('.')[0] + '.')) {
    return false;
  }
  
  if (capsuleEnv.platform && capsuleEnv.platform !== currentEnv.platform) {
    return false;
  }
  
  if (capsuleEnv.arch && capsuleEnv.arch !== currentEnv.arch) {
    return false;
  }
  
  return true;
}

module.exports = {
  validateCapsule,
  generateAssetId,
  createSafeFilename,
  ensureDir,
  readAllCapsules,
  findMatchingCapsules,
  createEnvFingerprint,
  isCapsuleCompatible
};