/**
 * Session Lock Manager
 * Handles concurrent access to session files with proper timeout and retry logic
 * Addresses the "session file locked (timeout 10000ms)" error
 */

const fs = require('fs');
const path = require('path');

class SessionLockManager {
  constructor() {
    this.lockTimeout = 15000; // 15 seconds timeout
    this.retryDelay = 100; // 100ms between retries
    this.maxRetries = 50; // Maximum number of retries
  }

  /**
   * Acquire a lock on a session file with timeout and retry logic
   * @param {string} sessionPath - Path to the session file
   * @returns {Promise<Object>} - Lock object with release function
   */
  async acquireLock(sessionPath) {
    const lockPath = `${sessionPath}.lock`;
    let attempts = 0;

    while (attempts < this.maxRetries) {
      try {
        // Try to create the lock file
        fs.writeFileSync(lockPath, `${process.pid}`, { flag: 'wx' });
        
        // Successfully acquired lock
        return {
          release: () => {
            try {
              if (fs.existsSync(lockPath)) {
                const lockPid = fs.readFileSync(lockPath, 'utf8').trim();
                if (lockPid === process.pid.toString()) {
                  fs.unlinkSync(lockPath);
                }
              }
            } catch (error) {
              // Ignore errors during unlock
            }
          },
          path: sessionPath
        };
      } catch (error) {
        if (error.code === 'EEXIST') {
          // Lock file exists, check if it's stale
          try {
            const lockStat = fs.statSync(lockPath);
            const lockAge = Date.now() - lockStat.mtimeMs;
            
            // If lock is older than 30 seconds, assume it's stale
            if (lockAge > 30000) {
              console.warn(`Stale lock detected for ${sessionPath}, removing...`);
              fs.unlinkSync(lockPath);
              continue; // Retry immediately
            }
          } catch (statError) {
            // Lock file might have been removed by another process
          }
          
          // Wait before retrying
          await this.sleep(this.retryDelay);
          attempts++;
        } else {
          // Unexpected error
          throw new Error(`Failed to acquire lock for ${sessionPath}: ${error.message}`);
        }
      }
    }

    throw new Error(`Timeout acquiring lock for ${sessionPath} after ${this.maxRetries} attempts`);
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Safely read a session file with locking
   * @param {string} sessionPath - Path to the session file
   * @returns {Promise<Object>} - Session data
   */
  async readSession(sessionPath) {
    const lock = await this.acquireLock(sessionPath);
    try {
      if (!fs.existsSync(sessionPath)) {
        return null;
      }
      
      const content = fs.readFileSync(sessionPath, 'utf8');
      return JSON.parse(content);
    } finally {
      lock.release();
    }
  }

  /**
   * Safely write a session file with locking
   * @param {string} sessionPath - Path to the session file
   * @param {Object} data - Session data to write
   * @returns {Promise<void>}
   */
  async writeSession(sessionPath, data) {
    const lock = await this.acquireLock(sessionPath);
    try {
      // Ensure directory exists
      const dir = path.dirname(sessionPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(sessionPath, JSON.stringify(data, null, 2));
    } finally {
      lock.release();
    }
  }
}

// Singleton instance
const sessionLockManager = new SessionLockManager();

module.exports = sessionLockManager;