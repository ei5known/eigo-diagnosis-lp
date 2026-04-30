/**
 * @file WebhookHandler.gs
 * @description Handles incoming webhooks, processes data, and updates the Google Sheet.
 */

/**
 * Main function to handle HTTP POST requests (webhooks).
 * This function serves as the entry point for incoming webhook notifications.
 * It ensures exclusive execution using LockService and updates the spreadsheet.
 * @param {GoogleAppsScript.Events.DoPost} e The event object from the POST request.
 * @returns {GoogleAppsScript.Content.TextOutput} A JSON response indicating success or failure.
 */
function doPost(e) {
  let response = {};
  try {
    // Acquire a lock to prevent concurrent modifications to the spreadsheet.
    return withLock(() => {
      Logger.log("Webhook received. Processing...");
      const postData = JSON.parse(e.postData.contents);

      // Log the full webhook payload for debugging
      Logger.log("Incoming Webhook Payload: %s", JSON.stringify(postData));

      // Extract relevant data from the webhook payload.
      // This structure needs to be adapted based on the actual webhook payload from Systeme.io or PayPal.
      const orderId = postData.data?.order_id || postData.resource?.purchase_units?.[0]?.payments?.captures?.[0]?.id || null; // Example path for PayPal capture ID
      const payerEmail = postData.data?.customer_email || postData.resource?.payer?.email_address || null;
      const paymentStatus = postData.data?.payment_status || postData.resource?.status || null; // Example: 'COMPLETED', 'PENDING'
      const amount = postData.data?.amount || postData.resource?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || null;
      const currency = postData.data?.currency || postData.resource?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.currency_code || null;
      const itemName = postData.data?.item_name || postData.resource?.description || null;
      const systemeioContactID = postData.data?.contact_id || null;

      if (!orderId) {
        throw new Error("Missing Order ID in webhook payload.");
      }

      const timestamp = new Date().toISOString();
      const lastActivityDate = timestamp; // Initial last activity date

      // Prepare data for the spreadsheet.
      const recordData = {
        'Timestamp': timestamp,
        'OrderID': orderId,
        'PayerID': postData.resource?.payer?.payer_id || null,
        'PayerEmail': payerEmail,
        'PaymentStatus': paymentStatus,
        'Amount': amount,
        'Currency': currency,
        'ItemName': itemName,
        'SystemeioContactID': systemeioContactID,
        'FollowUpEmailSent': '', // Initialize as empty
        'LastActivityDate': lastActivityDate,
        'PersonalInfoMasked': false,
        'company_name': postData.data?.company_name || '',
        'dept_name': postData.data?.dept_name || '',
        // Diagnosis data will be populated by a separate process or updated later
        'assignment_timing': '',
        'assignment_type': '',
        'assignment_subject': '',
        'assignment_difficulty': '',
        'ai_interaction_style': '',
        'learning_goal': '',
        'previous_experience': '',
        'motivation_level': '',
        'family_support_req': '',
        'assignment_rank': '',
        'ai_curriculum_url': ''
      };

      // Check if a record with this OrderID already exists.
      const existingRecord = findRecordByColumn('OrderID', orderId);

      if (existingRecord) {
        // Update existing record
        updateRecord(existingRecord.rowIndex, recordData);
        Logger.log("Updated existing record for OrderID: %s at row %s", orderId, existingRecord.rowIndex);
      } else {
        // Append new record
        appendRecord(recordData);
        Logger.log("Appended new record for OrderID: %s", orderId);
      }

      response = { status: 'success', message: 'Webhook processed successfully.' };
      return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
    });
  } catch (error) {
    Logger.log("Error processing webhook: %s", error.message);
    response = { status: 'error', message: error.message };
    return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Dummy function to simulate external logging for errors. Replace with actual logging service if needed.
 * @param {string} message The error message to log.
 */
function logErrorToExternalService(message) {
  Logger.log("EXTERNAL ERROR LOG: %s", message);
  // Example: You could send an email, write to a log sheet, or use an external logging API here.
}
