/**
 * Session Integration Module
 * Integrates the SessionLockManager with the evolver's main execution flow
 */

const { SessionLockManager } = require('./session_lock_manager');

// Global session lock manager instance
let sessionLockManager = null;

/**
 * Initialize the session lock manager for the current evolver run
 */
function initializeSessionLockManager() {
  if (!sessionLockManager) {
    sessionLockManager = new SessionLockManager({
      timeoutMs: 15000, // 15 seconds timeout (was 10000ms causing failures)
      retryDelayMs: 1000, // 1 second between retries
      maxRetries: 3 // Try up to 3 times before failing
    });
  }
  return sessionLockManager;
}

/**
 * Acquire session lock with proper error handling
 * @param {string} sessionId - The session ID to lock
 * @returns {Promise<boolean>} - True if lock acquired successfully
 */
async function acquireSessionLock(sessionId) {
  const manager = initializeSessionLockManager();
  try {
    const result = await manager.acquireLock(sessionId);
    if (!result.success) {
      console.warn(`[SessionLock] Failed to acquire lock for session ${sessionId}: ${result.error}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[SessionLock] Unexpected error acquiring lock for session ${sessionId}:`, error.message);
    return false;
  }
}

/**
 * Release session lock
 * @param {string} sessionId - The session ID to unlock
 */
async function releaseSessionLock(sessionId) {
  if (sessionLockManager) {
    try {
      await sessionLockManager.releaseLock(sessionId);
    } catch (error) {
      console.warn(`[SessionLock] Error releasing lock for session ${sessionId}:`, error.message);
    }
  }
}

/**
 * Execute a function with session locking
 * @param {string} sessionId - The session ID to lock
 * @param {Function} fn - The function to execute
 * @returns {Promise<any>} - The result of the function
 */
async function withSessionLock(sessionId, fn) {
  const lockAcquired = await acquireSessionLock(sessionId);
  if (!lockAcquired) {
    throw new Error(`Could not acquire session lock for ${sessionId} within timeout`);
  }
  
  try {
    return await fn();
  } finally {
    await releaseSessionLock(sessionId);
  }
}

module.exports = {
  initializeSessionLockManager,
  acquireSessionLock,
  releaseSessionLock,
  withSessionLock
};