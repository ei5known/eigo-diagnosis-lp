/**
 * @file FollowUpEngine.gs
 * @description Implements the follow-up engine, including PayPal API double-check and email sending.
 */

/**
 * Regularly checks for pending payments and sends follow-up emails after a PayPal API double-check.
 * This function is intended to be run by a time-driven trigger.
 */
function checkAndSendFollowUpEmails() {
  Logger.log("Starting Follow-up Engine: checkAndSendFollowUpEmails");

  // Acquire a lock to prevent concurrent executions of this critical process.
  withLock(() => {
    const recordsToFollowUp = getRecordsForFollowUp("pending", ""); // Get records with pending status and no follow-up email sent yet

    if (recordsToFollowUp.length === 0) {
      Logger.log("No records found for follow-up.");
      return;
    }

    Logger.log("Found %s records to check for follow-up.", recordsToFollowUp.length);

    recordsToFollowUp.forEach(({ rowIndex, record }) => {
      const orderId = record.OrderID;
      const payerEmail = record.PayerEmail;
      const payerName = record.PayerID; // Assuming PayerID can serve as a temporary name if no explicit name field
      const currentPaymentStatus = record.PaymentStatus;

      if (!orderId || !payerEmail) {
        Logger.log("Skipping record at row %s due to missing OrderID or PayerEmail.", rowIndex);
        return;
      }

      try {
        Logger.log("Performing PayPal double-check for OrderID %s (Row %s).", orderId, rowIndex);
        const verifiedStatus = verifyPayPalPaymentStatus(orderId);

        if (verifiedStatus === "paid") {
          // Payment is now confirmed as paid. Update the sheet and skip follow-up email.
          Logger.log("Payment for OrderID %s is now PAID. Updating sheet.", orderId);
          updateRecord(rowIndex, { PaymentStatus: "paid", LastActivityDate: new Date().toISOString() });
        } else if (verifiedStatus === "pending") {
          // Payment is still pending. Send follow-up email.
          Logger.log("Payment for OrderID %s is still PENDING. Sending follow-up email.", orderId);
          const emailSent = sendFollowUpEmail(payerEmail, payerName || "お客様", "24hour_followup");

          if (emailSent) {
            updateRecord(rowIndex, { FollowUpEmailSent: "24h_sent", LastActivityDate: new Date().toISOString() });
            Logger.log("24-hour follow-up email sent for OrderID %s (Row %s).", orderId, rowIndex);
          } else {
            Logger.log("Failed to send 24-hour follow-up email for OrderID %s (Row %s).", orderId, rowIndex);
          }
        } else {
          // Payment status is something else (e.g., refunded, failed, unknown). Update accordingly.
          Logger.log("Payment for OrderID %s has status: %s. Updating sheet.", orderId, verifiedStatus);
          updateRecord(rowIndex, { PaymentStatus: verifiedStatus, LastActivityDate: new Date().toISOString() });
        }
      } catch (error) {
        Logger.log("Error during PayPal verification or email sending for OrderID %s (Row %s): %s", orderId, rowIndex, error.message);
        // Log to external service if critical
        logErrorToExternalService(`Follow-up Engine Error for OrderID ${orderId}: ${error.message}`);
      }
    });
  });
  Logger.log("Follow-up Engine finished.");
}
