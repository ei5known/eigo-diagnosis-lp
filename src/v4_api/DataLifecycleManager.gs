/**
 * @file DataLifecycleManager.gs
 * @description Manages the data lifecycle, including masking/deletion of Personal Identifiable Information (PII).
 */

/**
 * Periodically checks for and masks PII data for records that are older than the configured PII_MASKING_DAYS.
 * This function is intended to be run by a time-driven trigger.
 */
function maskOldPiiData() {
  Logger.log("Starting Data Lifecycle Manager: maskOldPiiData");

  // Acquire a lock to prevent concurrent modifications during PII masking.
  withLock(() => {
    const recordsToMask = getRecordsForPiiMasking();

    if (recordsToMask.length === 0) {
      Logger.log("No records found for PII masking.");
      return;
    }

    Logger.log("Found %s records for PII masking.", recordsToMask.length);

    recordsToMask.forEach(({ rowIndex, record }) => {
      const orderId = record.OrderID;
      try {
        Logger.log("Attempting to mask PII for record at row %s (OrderID: %s).", rowIndex, orderId);
        maskPiiInRow(rowIndex);
        Logger.log("PII successfully masked for record at row %s (OrderID: %s).", rowIndex, orderId);
      } catch (error) {
        Logger.log("Error masking PII for record at row %s (OrderID: %s): %s", rowIndex, orderId, error.message);
        // Log to external service if critical
        logErrorToExternalService(`PII Masking Error for OrderID ${orderId}: ${error.message}`);
      }
    });
  });
  Logger.log("Data Lifecycle Manager finished.");
}
