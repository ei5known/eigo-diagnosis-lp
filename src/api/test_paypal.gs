/**
 * Test function to simulate a PayPal PAYMENT.SALE.COMPLETED webhook.
 * This function creates a dummy event object and calls handlePayPalWebhook.
 * Before running, ensure you have set up dummy values for PAYPAL_TRANSACTIONS_SHEET_ID,
 * PAYPAL_TRANSACTIONS_SHEET_NAME, ERROR_LOGS_SHEET_ID, and ERROR_LOGS_SHEET_NAME
 * in src/api/paypal.gs (or globally in your GAS project).
 *
 * MANUAL VERIFICATION STEPS:
 * 1. Ensure a row with custom_id: 'TEST_CUSTOM_ID_123' exists in your
 *    'PayPal Transactions' (or configured) spreadsheet with a non-'決済済み' status.
 * 2. After running this test, check the 'PayPal Transactions' spreadsheet:
 *    - The row with 'TEST_CUSTOM_ID_123' should now have '決済済み' in the payment_status column.
 *    - The payment_date column should be updated with the current date/time.
 * 3. Check the 'Error Logs' (or configured) spreadsheet:
 *    - There should be no new error entries related to handlePayPalWebhook.
 * 4. Check the Google Apps Script execution logs (Logger.log) for success messages.
 */
function testPayPalWebhook() {
  Logger.log('Starting testPayPalWebhook...');

  // Dummy PayPal Webhook payload for PAYMENT.SALE.COMPLETED
  const dummyWebhookPayload = {
    "id": "wh-1234567890ABCDEFGHIJKLMN",
    "event_version": "1.0",
    "create_time": "2023-04-28T10:00:00Z",
    "resource_type": "sale",
    "event_type": "PAYMENT.SALE.COMPLETED",
    "summary": "Payment completed for TEST_CUSTOM_ID_123",
    "resource": {
      "amount": {
        "total": "10.00",
        "currency": "USD"
      },
      "create_time": "2023-04-28T09:55:00Z",
      "id": "1A2B3C4D5E6F7G8H9I0J",
      "invoice_number": "TEST_CUSTOM_ID_123", // This will be used as custom_id
      "parent_payment": "PAYID-XXXXXXXXXXXXXXXXX",
      "state": "completed",
      "update_time": "2023-04-28T10:00:00Z"
    }
  };

  // Simulate the event object passed to doPost
  const e = {
    postData: {
      contents: JSON.stringify(dummyWebhookPayload),
      type: 'application/json'
    },
    queryString: '',
    parameters: {},
    contextPath: '',
    contentLength: JSON.stringify(dummyWebhookPayload).length
  };

  try {
    // Assuming handlePayPalWebhook is globally accessible or included via clasp run --function handlePayPalWebhook
    // In a real GAS project, if paypal.gs and test_paypal.gs are in the same project,
    // handlePayPalWebhook will be accessible.
    const result = handlePayPalWebhook(e);
    Logger.log('handlePayPalWebhook result: ' + result.getContent());
  } catch (error) {
    Logger.log('Error during testPayPalWebhook execution: ' + error.message);
    // It's good practice to also log to the error log sheet in a real scenario
    // logError('testPayPalWebhook', error, 'Simulated webhook processing error');
  }

  Logger.log('Finished testPayPalWebhook. Please perform manual verification as described in the function comments.');
}

/**
 * Debug function to verify the functionality of verifyPayPalPaymentStatus.
 * This function is intended to be run manually to check direct PayPal API calls.
 * Before running, ensure your PAYPAL_API_CLIENT_ID, PAYPAL_API_SECRET,
 * and PAYPAL_API_BASE_URL (for sandbox testing) are correctly configured.
 *
 * @param {string} transactionId The PayPal transaction ID to verify.
 * @returns {string} The payment status from PayPal (e.g., 'COMPLETED', 'PENDING').
 */
function debugVerifyPayPalPaymentStatus(transactionId) {
  Logger.log('Starting debugVerifyPayPalPaymentStatus for transaction ID: ' + transactionId);

  try {
    // Assuming verifyPayPalPaymentStatus is globally accessible or included.
    const status = verifyPayPalPaymentStatus(transactionId);
    Logger.log('PayPal payment status for ' + transactionId + ': ' + status);
    return status;
  } catch (error) {
    Logger.log('Error verifying PayPal payment status for ' + transactionId + ': ' + error.message);
    // logError('debugVerifyPayPalPaymentStatus', error, 'Error during payment status verification.');
    return 'ERROR: ' + error.message;
  }
}
