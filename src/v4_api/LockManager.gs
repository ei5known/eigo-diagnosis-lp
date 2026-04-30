/**
 * @file LockManager.gs
 * @description Manages Google Apps Script LockService for exclusive execution.
 */

/**
 * Executes a given function within an exclusive lock.
 * This prevents concurrent executions of critical sections of code.
 * If a lock cannot be obtained within a reasonable time, it throws an error.
 *
 * @param {function} callbackFunction The function to execute under lock.
 * @returns {*} The result of the callback function.
 * @throws {Error} If the lock cannot be acquired.
 */
function withLock(callbackFunction) {
  const lock = LockService.getScriptLock();
  const LOCK_WAIT_TIMEOUT = 30000; // Wait up to 30 seconds for a lock

  try {
    // Attempt to acquire the lock. If another process has the lock, wait.
    const lockAcquired = lock.tryLock(LOCK_WAIT_TIMEOUT);

    if (!lockAcquired) {
      Logger.log("Could not acquire lock after %s ms. Another process might be running.", LOCK_WAIT_TIMEOUT);
      throw new Error("Failed to acquire lock. Another process is running.");
    }

    Logger.log("Lock acquired. Executing callback function.");
    const result = callbackFunction();
    Logger.log("Callback function executed. Releasing lock.");
    return result;
  } catch (e) {
    Logger.log("Error during locked execution: %s", e.message);
    throw e; // Re-throw the error after logging
  } finally {
    // Always release the lock, even if an error occurred
    if (lock) {
      lock.releaseLock();
    }
  }
}
