/**
 * @file handler.gs
 * @description Handles incoming webhooks from SYSTEME.IO, processing diagnosis data and payment notifications.
 */

/**
 * The main entry point for HTTP POST requests (webhooks).
 * Processes incoming data from SYSTEME.IO for diagnosis submissions and payment events.
 * Uses LockService to prevent concurrent data corruption.
 * @param {GoogleAppsScript.Events.DoPost} e The event object containing the POST data.
 * @returns {GoogleAppsScript.Content.TextOutput} A JSON response indicating success or failure.
 */
function doPost(e) {
  let response = { success: false, message: "An unknown error occurred." };

  if (!e || !e.postData || !e.postData.contents) {
    response.message = "No data received.";
    Logger.log(response.message);
    return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    // Attempt to parse the incoming JSON payload from SYSTEME.IO.
    // SYSTEME.IO webhooks typically send JSON in the 'postData.contents'.
    const requestData = JSON.parse(e.postData.contents);
    Logger.log("Received Webhook Data: %s", JSON.stringify(requestData));

    // Use a lock to prevent concurrent modifications to the spreadsheet.
    return withLock(() => {
      // Determine the type of webhook event. This needs to be adapted based on SYSTEME.IO's actual payload structure.
      // For example, SYSTEME.IO might send a 'type' field or a specific structure for different events.
      // Assuming SYSTEME.IO sends data for 'order_confirmed' or 'form_submission'.
      const eventType = requestData.event || (requestData.payment_status ? 'payment_notification' : 'diagnosis_submission');

      let email = requestData.email || (requestData.contact ? requestData.contact.email : null);
      let name = requestData.name || (requestData.contact ? `${requestData.contact.first_name} ${requestData.contact.last_name}` : null);
      let transactionId = requestData.order_id || requestData.transaction_id || null;
      let paymentStatus = requestData.payment_status || null; // e.g., 'paid', 'refunded', 'failed'

      if (!email || !name) {
        throw new Error("Missing essential user information (email or name) in webhook payload.");
      }

      let record = findRecordByColumn('email', email);
      const currentTimestamp = new Date().toISOString();
      let diagnosisId = requestData.diagnosisId || `lead-${currentTimestamp}-${Utilities.getUuid()}`;

      if (record) {
        // Existing record found, update it.
        const updatedData = {
          timestamp: currentTimestamp,
          lastAccessed: currentTimestamp, // Update last accessed on any interaction
        };

        // Update payment status if a payment notification
        if (eventType === 'payment_notification' && paymentStatus) {
          updatedData.paymentStatus = paymentStatus;
          updatedData.transactionId = transactionId;
          if (paymentStatus === 'paid') {
            updatedData.followUpFlag = 'initial'; // Mark for initial follow-up
          }
        }

        // If diagnosis data is present in the webhook, update it
        if (requestData.diagnosis) { // Assuming diagnosis data comes nested
          const existingDiagnosisData = JSON.parse(record.record.diagnosisDataJson || '{}');
          // Merge new diagnosis data with existing. Deep merge might be needed for complex objects.
          const mergedDiagnosisData = { ...existingDiagnosisData, ...requestData.diagnosis };
          updatedData.diagnosisDataJson = JSON.stringify(mergedDiagnosisData);
          updatedData.diagnosisId = diagnosisId; // Update diagnosisId if it changed or was newly provided
        }

        updateRecord(record.rowIndex, updatedData);
        response = { success: true, message: `Record updated for ${email}.` };
      } else {
        // No existing record, create a new one.
        const newRecordData = {
          timestamp: currentTimestamp,
          diagnosisId: diagnosisId,
          email: email,
          name: name,
          paymentStatus: paymentStatus || 'pending', // Default to 'pending' if not provided
          transactionId: transactionId || '',
          followUpFlag: (paymentStatus === 'paid') ? 'initial' : '',
          aiCurriculumUrl: '', // Will be generated later
          lastAccessed: currentTimestamp,
          isPiiMasked: false,
          diagnosisDataJson: JSON.stringify(requestData.diagnosis || {}),
        };
        appendRecord(newRecordData);
        response = { success: true, message: `New record created for ${email}.` };

        // Send initial follow-up email if payment is confirmed
        if (newRecordData.paymentStatus === 'paid') {
          sendFollowUpEmail(email, name, '24hour_followup');
        }
      }
    });
  } catch (e) {
    response.message = `Webhook processing failed: ${e.message}`;
    Logger.log(response.message);
  }

  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}
