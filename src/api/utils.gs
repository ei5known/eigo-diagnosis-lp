
const PAYPAL_TRANSACTIONS_SHEET_ID = "YOUR_PAYPAL_TRANSACTIONS_SHEET_ID";
const PAYPAL_TRANSACTIONS_SHEET_NAME = "PayPal Transactions";
const ERROR_LOGS_SHEET_ID = "YOUR_ERROR_LOGS_SHEET_ID";
const ERROR_LOGS_SHEET_NAME = "Error Logs";

/**
 * error_logs シートへ、発生時刻・関数名・エラー内容・スタックトレース・詳細を自動記録する関数。
 * @param {string} functionName - エラーが発生した関数名
 * @param {Error} error - エラーオブジェクト
 * @param {string} details - エラーに関する追加の詳細情報
 */
function logError(functionName, error, details) {
  try {
    const ss = SpreadsheetApp.openById(ERROR_LOGS_SHEET_ID);
    const sheet = ss.getSheetByName(ERROR_LOGS_SHEET_NAME);
    if (!sheet) {
      Logger.log(`Error log sheet "${ERROR_LOGS_SHEET_NAME}" not found in spreadsheet ID "${ERROR_LOGS_SHEET_ID}".`);
      return;
    }
    const timestamp = new Date();
    const errorMessage = error.message || error.toString();
    const stackTrace = error.stack || "No stack trace available";
    sheet.appendRow([timestamp, functionName, errorMessage, stackTrace, details]);
  } catch (e) {
    Logger.log(`Failed to log error: ${e.message}. Original error in ${functionName}: ${error.message}`);
  }
}

/**
 * PayPal API を呼び出し、最新の決済ステータスを取得する関数（通信エラー時も考慮）。
 * @param {string} transactionId - PayPalトランザクションID
 * @returns {string|null} 決済ステータス、またはエラー発生時はnull
 */
function verifyPayPalPaymentStatus(transactionId) {
  try {
    // Placeholder for PayPal API endpoint and authentication
    // In a real application, you would manage access tokens securely (e.g., using PropertiesService and OAuth2)
    const paypalApiUrl = `https://api.paypal.com/v2/payments/captures/${transactionId}`;
    const accessToken = getPayPalAccessToken(); // Assume this function exists elsewhere or is implemented here

    if (!accessToken) {
      logError("verifyPayPalPaymentStatus", new Error("PayPal Access Token Missing"), "Could not retrieve PayPal access token.");
      return null;
    }

    const options = {
      "method": "GET",
      "headers": {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      "muteHttpExceptions": true // To get full error response instead of throwing exception
    };

    const response = UrlFetchApp.fetch(paypalApiUrl, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    if (responseCode >= 200 && responseCode < 300) {
      const data = JSON.parse(responseBody);
      // Assuming the PayPal API response has a 'status' field
      return data.status;
    } else {
      logError("verifyPayPalPaymentStatus", new Error("PayPal API Error"), `Status: ${responseCode}, Response: ${responseBody}, Transaction ID: ${transactionId}`);
      return null;
    }
  } catch (e) {
    logError("verifyPayPalPaymentStatus", e, `Transaction ID: ${transactionId}`);
    return null;
  }
}

/**
 * Placeholder for getting PayPal Access Token.
 * In a real Google Apps Script project, this would involve a secure OAuth2 flow.
 * @returns {string} PayPal Access Token (placeholder)
 */
function getPayPalAccessToken() {
  // Implement secure retrieval and refresh of PayPal access token here.
  // For example, using `PropertiesService` to store client ID/secret and making an OAuth API call.
  Logger.log("getPayPalAccessToken: Placeholder for PayPal access token retrieval.");
  return "YOUR_PAYPAL_ACCESS_TOKEN"; // Replace with actual token retrieval logic
}

/**
 * 引数の日時から現在まで24時間以上経過しているか判定し、真偽値を返す関数。
 * @param {Date|string} date - 判定する日時 (Dateオブジェクトまたは日付文字列)
 * @returns {boolean} 24時間以上経過していればtrue、そうでなければfalse
 */
function has24HoursPassed(date) {
  const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
  const now = new Date();
  const inputDate = new Date(date);
  return (now.getTime() - inputDate.getTime()) >= twentyFourHoursInMs;
}

/**
 * 指定した日数経過後に、顧客の氏名・メールを *** に置き換えるマスキング関数。
 * PAYPAL_TRANSACTIONS_SHEET_IDとPAYPAL_TRANSACTIONS_SHEET_NAMEに存在するシートを操作します。
 * @param {number} days - 指定した日数。この日数経過後のデータがマスキングされます。
 */
function maskPiiData(days) {
  try {
    const ss = SpreadsheetApp.openById(PAYPAL_TRANSACTIONS_SHEET_ID);
    const sheet = ss.getSheetByName(PAYPAL_TRANSACTIONS_SHEET_NAME);
    if (!sheet) {
      logError("maskPiiData", new Error("Sheet Not Found"), `PayPal transactions sheet "${PAYPAL_TRANSACTIONS_SHEET_NAME}" not found in spreadsheet ID "${PAYPAL_TRANSACTIONS_SHEET_ID}".`);
      return;
    }

    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();

    if (values.length <= 1) { // Only header or no data
      Logger.log("No data or only header row in PayPal Transactions sheet. No PII to mask.");
      return;
    }

    // Assume these column indices based on common practice or initial requirements.
    // In a real scenario, these might be dynamically determined or explicitly defined in a schema.
    const NAME_COLUMN_INDEX = 0;  // Column A for Name
    const EMAIL_COLUMN_INDEX = 1; // Column B for Email
    const DATE_COLUMN_INDEX = 2;  // Column C for Transaction Date or similar timestamp

    const now = new Date();
    const thresholdDate = new Date(now.getTime() - (days * twentyFourHoursInMs));

    let dataModified = false;

    for (let i = 1; i < values.length; i++) { // Start from 1 to skip header row
      const row = values[i];
      const transactionDate = new Date(row[DATE_COLUMN_INDEX]);

      if (transactionDate < thresholdDate) {
        // Mask Name if it exists and is not already masked
        if (row[NAME_COLUMN_INDEX] && row[NAME_COLUMN_INDEX] !== "***") {
          row[NAME_COLUMN_INDEX] = "***";
          dataModified = true;
        }
        // Mask Email if it exists and is not already masked
        if (row[EMAIL_COLUMN_INDEX] && row[EMAIL_COLUMN_INDEX] !== "***") {
          row[EMAIL_COLUMN_INDEX] = "***";
          dataModified = true;
        }
      }
    }

    if (dataModified) {
      dataRange.setValues(values);
      Logger.log(`PII masking completed for data older than ${days} days.`);
    } else {
      Logger.log("No PII data needed masking based on the specified days.");
    }

  } catch (e) {
    logError("maskPiiData", e, `Days for masking: ${days}`);
  }
}
