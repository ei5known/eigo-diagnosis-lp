// src/api/paypal.gs

/**
 * Handles incoming PayPal Webhook events, specifically PAYMENT.SALE.COMPLETED.
 * Updates the payment status in a Google Sheet based on the custom_id.
 * Implements idempotency to prevent duplicate processing.
 * Uses LockService for exclusive control to prevent race conditions during updates.
 * @param {GoogleAppsScript.Events.DoPost} e The event object from the doPost function.
 */
function handlePayPalWebhook(e) {
  const lock = LockService.getScriptLock();
  // Wait for up to 30 seconds for the lock. If it's not acquired, an exception is thrown.
  try {
    lock.waitLock(30000);
  } catch (e) {
    logError('handlePayPalWebhook', e, 'Failed to acquire LockService lock.');
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Failed to acquire lock: ' + e.message })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const payload = JSON.parse(e.postData.contents);

    // Verify event type
    if (payload.event_type !== 'PAYMENT.SALE.COMPLETED') {
      Logger.log('Received non-PAYMENT.SALE.COMPLETED event: ' + payload.event_type);
      return ContentService.createTextOutput(JSON.stringify({ status: 'ignored', message: 'Event type not PAYMENT.SALE.COMPLETED' })).setMimeType(ContentService.MimeType.JSON);
    }

    // Extract custom_id
    let customId = null;
    if (payload.resource && payload.resource.invoice_number) {
      customId = payload.resource.invoice_number;
    } else if (payload.resource && payload.resource.custom) {
      customId = payload.resource.custom;
    }

    if (!customId) {
      logError('handlePayPalWebhook', new Error('Custom ID not found in PayPal webhook payload.'), JSON.stringify(payload));
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Custom ID not found' })).setMimeType(ContentService.MimeType.JSON);
    }

    const spreadsheet = SpreadsheetApp.openById(PAYPAL_TRANSACTIONS_SHEET_ID);
    const sheet = spreadsheet.getSheetByName(PAYPAL_TRANSACTIONS_SHEET_NAME);
    if (!sheet) {
      logError('handlePayPalWebhook', new Error('Spreadsheet sheet not found: ' + PAYPAL_TRANSACTIONS_SHEET_NAME));
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Spreadsheet sheet not found' })).setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    // Assuming the first row is headers
    const headers = data[0];
    const customIdColumnIndex = headers.indexOf('custom_id'); // Assuming 'custom_id' is a header
    const paymentStatusColumnIndex = headers.indexOf('payment_status'); // Assuming 'payment_status' is a header
    const paymentDateColumnIndex = headers.indexOf('payment_date'); // Assuming 'payment_date' is a header - for follow-up trigger

    if (customIdColumnIndex === -1 || paymentStatusColumnIndex === -1 || paymentDateColumnIndex === -1) {
      logError('handlePayPalWebhook', new Error('Required columns (custom_id, payment_status, or payment_date) not found in sheet headers.'));
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Required columns not found' })).setMimeType(ContentService.MimeType.JSON);
    }

    let updated = false;
    for (let i = 1; i < data.length; i++) { // Start from second row to skip headers
      const row = data[i];
      if (row[customIdColumnIndex] == customId) {
        if (row[paymentStatusColumnIndex] !== '決済済み') {
          sheet.getRange(i + 1, paymentStatusColumnIndex + 1).setValue('決済済み');
          sheet.getRange(i + 1, paymentDateColumnIndex + 1).setValue(new Date()); // Set payment date upon successful payment
          Logger.log('Updated payment status for custom_id: ' + customId);
          updated = true;
        } else {
          Logger.log('Payment status for custom_id ' + customId + ' is already "決済済み". Idempotency guard applied.');
        }
        break; // Found the row, no need to continue
      }
    }

    if (!updated) {
      Logger.log('No matching custom_id found or status already "決済済み": ' + customId);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', updated: updated })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    logError('handlePayPalWebhook', error, 'Processing PayPal webhook.');
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.message })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    // Always release the lock, even if an error occurred.
    if (lock.hasLock()) {
      lock.releaseLock();
    }
  }
}

// Placeholder constants for Spreadsheet ID and sheet name
// IMPORTANT: Replace these with your actual Spreadsheet ID and sheet name.
const PAYPAL_TRANSACTIONS_SHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // e.g., '1Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
const PAYPAL_TRANSACTIONS_SHEET_NAME = 'PayPal Transactions'; // e.g., 'Transactions'

const ERROR_LOGS_SHEET_ID = 'YOUR_ERROR_LOGS_SHEET_ID_HERE'; // Placeholder for your error logs spreadsheet ID
const ERROR_LOGS_SHEET_NAME = 'Error Logs'; // Placeholder for your error logs sheet name

/**
 * Logs an error to a dedicated Google Sheet.
 * @param {string} functionName The name of the function where the error occurred.
 * @param {Error} error The error object.
 * @param {string} [details=\'\'] Optional additional details to log.
 */
function logError(functionName, error, details = \'\') {
  try {
    const spreadsheet = SpreadsheetApp.openById(ERROR_LOGS_SHEET_ID);
    const sheet = spreadsheet.getSheetByName(ERROR_LOGS_SHEET_NAME);
    if (!sheet) {
      Logger.log(\'Error: Error logs sheet not found: \' + ERROR_LOGS_SHEET_NAME);
      return;
    }

    const timestamp = new Date();
    sheet.appendRow([timestamp.toISOString(), functionName, error.message, error.stack, details]);
    Logger.log(\'Error logged: \' + functionName + \' - \' + error.message);
  } catch (logError) {
    Logger.log(\'FATAL ERROR: Could not log error to sheet: \' + logError.message + \' for original error: \' + error.message);
  }
}

