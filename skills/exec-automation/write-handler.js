/**
 * Write Operation Handler for Exec Automation
 * Provides specialized handling for high-frequency write operations
 */

const fs = require('fs');
const path = require('path');

/**
 * Enhanced write operation with validation and error handling
 * @param {string} filePath - Path to write to
 * @param {string} content - Content to write
 * @param {Object} options - Write options
 * @returns {Promise<Object>} Result object
 */
async function enhancedWrite(filePath, content, options = {}) {
  try {
    // Validate file path
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('Invalid file path provided');
    }
    
    // Ensure directory exists
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Backup existing file if it exists and backup is enabled
    if (options.backup && fs.existsSync(filePath)) {
      const backupPath = `${filePath}.backup.${Date.now()}`;
      fs.copyFileSync(filePath, backupPath);
      console.log(`📝 Created backup: ${backupPath}`);
    }
    
    // Write the content
    fs.writeFileSync(filePath, content, options);
    console.log(`✅ Successfully wrote to: ${filePath}`);
    
    return {
      success: true,
      filePath: filePath,
      bytesWritten: Buffer.byteLength(content, options.encoding || 'utf8'),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`❌ Write operation failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
      filePath: filePath
    };
  }
}

/**
 * Batch write operations for efficiency
 * @param {Array} operations - Array of write operations
 * @returns {Promise<Array>} Results array
 */
async function batchWrite(operations) {
  const results = [];
  
  for (const op of operations) {
    const result = await enhancedWrite(op.filePath, op.content, op.options);
    results.push(result);
  }
  
  return results;
}

module.exports = {
  enhancedWrite,
  batchWrite
};