/**
 * @fileoverview Utility functions for the English School AI system.
 */

// Placeholder constants for PayPal API and error logging.
// IMPORTANT: Replace these with your actual PayPal API credentials and Spreadsheet IDs.
const PAYPAL_API_BASE_URL = \"https://api-m.sandbox.paypal.com\"; // Use sandbox for testing, api-m.paypal.com for live
const PAYPAL_CLIENT_ID = \"YOUR_PAYPAL_CLIENT_ID_HERE\";
const PAYPAL_SECRET = \"YOUR_PAYPAL_SECRET_HERE\";

const ERROR_LOGS_SHEET_ID = \"YOUR_ERROR_LOGS_SHEET_ID_HERE\"; // Placeholder for your error logs spreadsheet ID
const ERROR_LOGS_SHEET_NAME = \"Error Logs\"; // Placeholder for your error logs sheet name

/**
 * Logs an error to a dedicated Google Sheet.
 * @param {string} functionName The name of the function where the error occurred.
 * @param {Error} error The error object.
 * @param {string} [details=\"\"] Optional additional details to log.
 */
function logError(functionName, error, details = \"\") {
  try {
    const spreadsheet = SpreadsheetApp.openById(ERROR_LOGS_SHEET_ID);
    const sheet = spreadsheet.getSheetByName(ERROR_LOGS_SHEET_NAME);
    if (!sheet) {
      Logger.log(\"Error: Error logs sheet not found: \" + ERROR_LOGS_SHEET_NAME);
      return;
    }

    const timestamp = new Date();
    sheet.appendRow([timestamp.toISOString(), functionName, error.message, error.stack, details]);
    Logger.log(\"Error logged: \" + functionName + \" - \" + error.message);
  } catch (logError) {
    Logger.log(\"FATAL ERROR: Could not log error to sheet: \" + logError.message + \" for original error: \" + error.message);
  }
}

/**
 * Fetches an OAuth2 access token from PayPal.
 * @returns {string} The access token.
 * @throws {Error} If failed to get access token.
 */
function getPayPalAccessToken() {
  const url = PAYPAL_API_BASE_URL + \"/v1/oauth2/token\";
  const headers = {
    \"Authorization\": \"Basic \" + Utilities.base64Encode(PAYPAL_CLIENT_ID + \":\" + PAYPAL_SECRET),
    \"Content-Type\": \"application/x-www-form-urlencoded\"
  };
  const options = {
    \"method\": \"post\".toLowerCase(),
    \"headers\": headers,
    \"payload\": \"grant_type=client_credentials\",
    \"muteHttpExceptions\": true // Allow checking response for errors
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    if (responseCode === 200) {
      const tokenData = JSON.parse(responseBody);
      return tokenData.access_token;
    } else {
      const error = new Error(\"Failed to get PayPal access token. Status: \" + responseCode + \", Response: \" + responseBody);
      logError(\"getPayPalAccessToken\", error, \"PayPal API URL: \" + url);
      throw error;
    }
  } catch (e) {
    logError(\"getPayPalAccessToken\", e, \"Error fetching PayPal access token.\");
    throw e;
  }
}

/**
 * Verifies the latest payment status for a given custom ID directly from PayPal.
 * This acts as a double-check mechanism against webhook inconsistencies.
 * @param {string} customId The custom ID (e.g., invoice number) associated with the PayPal transaction.
 * @returns {string|null} The payment status string (e.g., \"COMPLETED\", \"PENDING\") or null if not found/error.
 */
function verifyPayPalPaymentStatus(customId) {
  let accessToken;
  try {
    accessToken = getPayPalAccessToken();
  } catch (e) {
    Logger.log(\"Could not get PayPal access token for verification: \" + e.message);
    return null; // Cannot verify without token
  }

  // PayPal API for retrieving transaction details usually requires transaction ID.
  // To use customId, we might need to search transactions or rely on webhook data having transaction ID.
  // For simplicity and assuming customId is unique and directly retrievable (e.g., as invoice ID),
  // we will simulate fetching an order or payment by customId if PayPal API supports it directly.
  // In a real-world scenario, you would likely store PayPal Transaction ID in your sheet
  // and use that to query PayPal API for exact transaction details.
  // For this exercise, we will assume a hypothetical endpoint or search functionality.

  // NOTE: This is a simplified example. PayPal API does not directly offer a \"get by custom_id\" endpoint.
  // A real implementation would involve: 
  // 1. Storing PayPal Transaction ID (e.g., from webhook payload) in your spreadsheet.
  // 2. Using that Transaction ID to call PayPal \"GET /v2/payments/captures/{id}\" or \"GET /v2/checkout/orders/{id}\".
  // For the purpose of this task, we will simulate a direct lookup using customId.

  const url = PAYPAL_API_BASE_URL + \"/v2/checkout/orders/\" + customId; // Hypothetical: Assuming customId maps to an order ID
  const headers = {
    \"Authorization\": \"Bearer \" + accessToken,
    \"Content-Type\": \"application/json\"
  };
  const options = {
    \"method\": \"get\".toLowerCase(),
    \"headers\": headers,
    \"muteHttpExceptions\": true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    if (responseCode === 200) {
      const orderData = JSON.parse(responseBody);
      // Assuming orderData.status contains the payment status
      return orderData.status; 
    } else if (responseCode === 404) {
      Logger.log(\"PayPal Order not found for custom ID: \" + customId);
      return null; // Payment not found
    } else {
      const error = new Error(\"Failed to verify PayPal payment status. Status: \" + responseCode + \", Response: \" + responseBody);
      logError(\"verifyPayPalPaymentStatus\", error, \"Custom ID: \" + customId + \", PayPal API URL: \" + url);
      return null; // Error during verification
    }
  } catch (e) {
    logError(\"verifyPayPalPaymentStatus\", e, \"Error verifying PayPal payment status for custom ID: \" + customId);
    return null;
  }
}

/**
 * Checks if 24 hours have passed since the payment date for a given record.
 * This function is intended to be used by the \"追客トリガー（24時間判定）\".
 * @param {Date} paymentDate The date and time when the payment was recorded.
 * @returns {boolean} True if 24 hours or more have passed since paymentDate, false otherwise.
 */
function has24HoursPassed(paymentDate) {
  if (!(paymentDate instanceof Date)) {
    logError(\"has24HoursPassed\", new Error(\"Invalid paymentDate type\"), \"Received: \" + paymentDate);
    return false;
  }
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
  return paymentDate <= twentyFourHoursAgo;
}

/**
 * Masks Personal Identifiable Information (PII) in a record after a specified retention period.
 * Intended to be run by a Time-driven trigger.
 * @param {Array<any>} record The spreadsheet row data representing a record.
 * @param {Array<string>} headers The spreadsheet headers to identify PII columns (e.g., \"name\", \"email\").
 * @param {number} retentionDays The number of days after which PII should be masked.
 * @param {string} lastAccessDateColumnName The name of the column containing the last access or course completion date.
 * @returns {Array<any>} The record with PII columns masked if the retention period has passed.
 */
function maskPiiData(record, headers, retentionDays, lastAccessDateColumnName) {
  try {
    const lastAccessDateColumnIndex = headers.indexOf(lastAccessDateColumnName);
    if (lastAccessDateColumnIndex === -1) {
      logError(\"maskPiiData\", new Error(\"Last access date column not found\"), \"Column: \" + lastAccessDateColumnName);
      return record; // Cannot process without the date column
    }

    const lastAccessDate = new Date(record[lastAccessDateColumnIndex]);
    if (isNaN(lastAccessDate.getTime())) {
      logError(\"maskPiiData\", new Error(\"Invalid last access date value\"), \"Value: \" + record[lastAccessDateColumnIndex]);
      return record; // Cannot process with invalid date
    }

    const now = new Date();
    const retentionThreshold = new Date(now.getTime() - (retentionDays * 24 * 60 * 60 * 1000));

    if (lastAccessDate <= retentionThreshold) {
      // Identify PII columns to mask. Assuming common PII fields.
      const piiColumns = [\"company_name\", \"dept_name\", \"email\", \"name\"]; // Example PII fields from schema
      for (const piiField of piiColumns) {
        const piiColumnIndex = headers.indexOf(piiField);
        if (piiColumnIndex !== -1 && record[piiColumnIndex] !== \"***\") {
          record[piiColumnIndex] = \"***\";
        }
      }
    }
    return record;
  } catch (e) {
    logError(\"maskPiiData\", e, \"Error masking PII data.\");
    return record; // Return original record on error
  }
}
