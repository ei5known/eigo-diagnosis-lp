/**
 * @file Scheduler.gs
 * @description Contains scheduled functions for 24-hour follow-up checks and PII masking.
 */

/**
 * Checks for records that require a 24-hour follow-up email.
 * This function should be scheduled to run periodically (e.g., hourly).
 * It includes the "two-tier check logic" by verifying PayPal payment status before sending emails.
 */
function check24HourFollowUp() {
  Logger.log("Starting 24-hour follow-up check.");
  const records = getRecordsFor24HourCheck(); // From sheet_management.gs

  if (records.length === 0) {
    Logger.log("No records found for 24-hour follow-up.");
    return;
  }

  records.forEach(({ rowIndex, record }) => {
    const email = record.email;
    const name = record.name;
    const transactionId = record.transactionId;

    if (!email || !name) {
      Logger.log("Skipping follow-up for row %s: Missing email or name.", rowIndex);
      return;
    }

    Logger.log("Processing record for 24-hour follow-up: %s (Row: %s)", email, rowIndex);

    // Implement the "double-check logic" - re-query PayPal API
    try {
      const verifiedPaymentStatus = verifyPayPalPaymentStatus(transactionId);
      Logger.log("PayPal verified status for %s (Transaction: %s): %s", email, transactionId, verifiedPaymentStatus);

      if (verifiedPaymentStatus === 'paid') {
        // Generate AI curriculum URL
        let aiCurriculumUrl = '';
        try {
          const diagnosisData = JSON.parse(record.diagnosisDataJson || '{}');
          aiCurriculumUrl = generateAiCurriculumUrl(diagnosisData, email);
        } catch (e) {
          Logger.log("Error generating AI curriculum URL for %s: %s", email, e.message);
          // Continue without AI curriculum URL if generation fails, or handle as needed
        }

        // Send AI curriculum email
        const emailSent = sendAiCurriculumEmail(email, name, aiCurriculumUrl);
        if (emailSent) {
          // Update sheet with new followUpFlag and aiCurriculumUrl
          updateRecord(rowIndex, {
            followUpFlag: 'course_sent',
            aiCurriculumUrl: aiCurriculumUrl,
            timestamp: new Date().toISOString() // Update timestamp on successful action
          });
          Logger.log("AI curriculum email sent and record updated for %s.", email);
        } else {
          Logger.log("Failed to send AI curriculum email for %s.", email);
        }
      } else {
        Logger.log("Payment status for %s is not paid (%s) after double-check. Skipping AI curriculum email.", email, verifiedPaymentStatus);
        // Optionally update payment status in sheet if it changed from 'paid' (e.g., 'refunded')
        if (verifiedPaymentStatus !== record.paymentStatus) {
          updateRecord(rowIndex, {
            paymentStatus: verifiedPaymentStatus,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (e) {
      Logger.log("Error during PayPal verification for %s (Transaction: %s): %s", email, transactionId, e.message);
      // Log the error but continue processing other records
    }
  });
  Logger.log("Finished 24-hour follow-up check.");
}

/**
 * Masks PII (Personally Identifiable Information) for records older than PII_MASKING_DAYS.
 * This function should be scheduled to run periodically (e.g., daily or weekly).
 */
function maskPiiDataBatch() {
  Logger.log("Starting PII masking batch process.");
  const recordsToMask = getRecordsForPiiMasking(); // From sheet_management.gs

  if (recordsToMask.length === 0) {
    Logger.log("No records found for PII masking.");
    return;
  }

  recordsToMask.forEach(({ rowIndex, record }) => {
    Logger.log("Masking PII for record at row: %s (Email: %s)", rowIndex, record.email);
    try {
      maskPiiInRow(rowIndex); // From sheet_management.gs
      Logger.log("PII masking successful for row: %s.", rowIndex);
    } catch (e) {
      Logger.log("Failed to mask PII for row %s: %s", rowIndex, e.message);
    }
  });
  Logger.log("Finished PII masking batch process.");
}
