/**
 * @file main.gs
 * @description Main entry point for the V4.0 Google Apps Script project.
 *              This file acts as a dispatcher for webhook calls and scheduled tasks.
 */

/**
 * Handles HTTP POST requests. This is the entry point for webhooks.
 * It delegates the processing to WebhookHandler.gs
 * @param {GoogleAppsScript.Events.DoPost} e The event object from the POST request.
 * @returns {GoogleAppsScript.Content.TextOutput} A JSON response.
 */
function doPost(e) {
  // Delegate to the WebhookHandler's doPost function
  return WebhookHandler.doPost(e);
}

/**
 * Entry point for the scheduled follow-up email task.
 * This function should be set up as a time-driven trigger.
 */
function runFollowUpEngine() {
  checkAndSendFollowUpEmails();
}

/**
 * Entry point for the scheduled PII masking task.
 * This function should be set up as a time-driven trigger.
 */
function runPiiMasking() {
  maskOldPiiData();
}

/**
 * A setup function that can be run once to initialize any configurations or triggers.
 * (Optional) Can be used for initial setup or verification.
 */
function setupV4Project() {
  Logger.log("V4.0 Project Setup Initiated.");
  // You can add any one-time setup logic here, e.g., creating default sheet if not exists.
  // For now, it just logs a message.
  Logger.log("V4.0 Project Setup Completed.");
}

// Expose functions for easier access if needed (e.g., for testing or manual trigger setup)
// These might not be strictly necessary if using clasp for deployment and direct trigger setup
Object.assign(this, {
  doPost: doPost,
  runFollowUpEngine: runFollowUpEngine,
  runPiiMasking: runPiiMasking,
  setupV4Project: setupV4Project
});
