/**
 * @file paypal.gs
 * @description Handles interactions with the PayPal API for payment verification.
 */

/**
 * Fetches an access token from the PayPal API.
 * @returns {string} The PayPal access token.
 * @throws {Error} If unable to obtain an access token.
 */
function getPayPalAccessToken() {
  const credentials = getPayPalApiCredentials();
  const apiUrl = `${getPayPalApiBaseUrl()}/v1/oauth2/token`;
  const encodedAuth = Utilities.base64Encode(`${credentials.clientId}:${credentials.secret}`);

  const options = {
    method: 'post',
    headers: {
      'Authorization': `Basic ${encodedAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    payload: 'grant_type=client_credentials',
    muteHttpExceptions: true
  };

  try {
    Logger.log("Attempting to get PayPal access token from: %s", apiUrl);
    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode === 200) {
      const tokenData = JSON.parse(responseText);
      Logger.log("Successfully obtained PayPal access token.");
      return tokenData.access_token;
    } else {
      Logger.log("PayPal Access Token Error - Code: %s, Response: %s", responseCode, responseText);
      throw new Error(`Failed to get PayPal access token. Status: ${responseCode}, Response: ${responseText}`);
    }
  } catch (e) {
    Logger.log("Exception during PayPal access token request: %s", e.message);
    throw new Error(`PayPal Access Token Exception: ${e.message}`);
  }
}

/**
 * Retrieves details for a specific PayPal transaction.
 * @param {string} transactionId The PayPal transaction ID.
 * @param {string} accessToken The PayPal access token.
 * @returns {object|null} The transaction details object, or null if not found/error.
 * @throws {Error} If there's an API error other than not found.
 */
function getPayPalTransactionDetails(transactionId, accessToken) {
  const apiUrl = `${getPayPalApiBaseUrl()}/v2/payments/captures/${transactionId}`;

  const options = {
    method: 'get',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  try {
    Logger.log("Attempting to get PayPal transaction details for %s from: %s", transactionId, apiUrl);
    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode === 200) {
      Logger.log("Successfully retrieved PayPal transaction details for %s.", transactionId);
      return JSON.parse(responseText);
    } else if (responseCode === 404) {
      Logger.log("PayPal transaction %s not found. Code: %s", transactionId, responseCode);
      return null; // Transaction not found
    } else {
      Logger.log("PayPal Transaction Details Error - Code: %s, Response: %s", responseCode, responseText);
      throw new Error(`Failed to get PayPal transaction details for ${transactionId}. Status: ${responseCode}, Response: ${responseText}`);
    }
  } catch (e) {
    Logger.log("Exception during PayPal transaction details request for %s: %s", transactionId, e.message);
    throw new Error(`PayPal Transaction Details Exception for ${transactionId}: ${e.message}`);
  }
}

/**
 * Verifies the payment status of a PayPal transaction.
 * Implements the "double-check logic" by querying PayPal API directly.
 * @param {string} transactionId The PayPal transaction ID to verify.
 * @returns {string} The verified payment status (e.g., 'PAID', 'PENDING', 'REFUNDED', 'FAILED', 'UNKNOWN').
 */
function verifyPayPalPaymentStatus(transactionId) {
  if (!transactionId) {
    Logger.log("No transaction ID provided for PayPal payment status verification.");
    return 'UNKNOWN';
  }
  try {
    Logger.log("Starting PayPal payment status verification for transaction: %s", transactionId);
    const accessToken = getPayPalAccessToken();
    const transactionDetails = getPayPalTransactionDetails(transactionId, accessToken);

    if (transactionDetails) {
      Logger.log("PayPal transaction status: %s", transactionDetails.status);
      // PayPal capture status documentation: https://developer.paypal.com/docs/api/payments/v2/#captures_get
      switch (transactionDetails.status) {
        case 'COMPLETED':
          return 'paid';
        case 'PENDING':
          return 'pending';
        case 'REFUNDED': // Not directly a capture status, but possible for associated refunds
        case 'PARTIALLY_REFUNDED':
          return 'refunded';
        case 'DENIED':
        case 'FAILED': // Assuming FAILED or DENIED captures imply a failed payment
          return 'failed';
        default:
          Logger.log("Unknown PayPal transaction status: %s for transaction: %s", transactionDetails.status, transactionId);
          return 'unknown';
      }
    } else {
      Logger.log("PayPal transaction details not found for ID: %s", transactionId);
      return 'unknown'; // Transaction not found in PayPal
    }
  } catch (e) {
    Logger.log("Error verifying PayPal payment status for transaction %s: %s", transactionId, e.message);
    // It's safer to return 'unknown' or 'failed' if we can't verify, depending on policy.
    // For this case, 'unknown' means we couldn't get a definitive answer.
    return 'unknown';
  }
}
