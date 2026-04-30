/**
 * @file sheet_management.gs
 * @description Manages all interactions with the Google Sheet, which serves as the master database.
 *
 * Data Schema (derived from doc/DATA_SCHEMA.md and CONFIG.SHEET_HEADERS):
 * The Google Sheet will have the following columns in this order:
 * - timestamp (string, ISO 8601): Record creation/last update timestamp.
 * - diagnosisId (string): Unique ID for the diagnosis session.
 * - email (string): User\'s email address.
 * - name (string): User\'s full name.
 * - paymentStatus (string): Current payment status (e.g., \'pending\', \'paid\', \'refunded\', \'failed\').
 * - transactionId (string): Unique PayPal/Stripe transaction ID.
 * - followUpFlag (string): Status of follow-up (e.g., \'initial\', \'24h_sent\', \'course_sent\').
 * - aiCurriculumUrl (string): URL to the personalized AI curriculum.
 * - lastAccessed (string, ISO 8601): Timestamp of last access, used for PII masking.
 * - isPiiMasked (boolean): Flag indicating if PII data in this row has been masked.
 * - diagnosisDataJson (string): JSON string of the full diagnosis data, including answers, scoring, etc.
 */

/**
 * Gets the active Google Spreadsheet instance.
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet} The SpreadsheetApp instance.
 * @throws {Error} If the spreadsheet ID is not configured.
 */
function getSpreadsheet() {
  const spreadsheetId = getSheetId();
  if (!spreadsheetId || spreadsheetId === \'YOUR_SPREADSHEET_ID_HERE\') {
    throw new Error(\'Spreadsheet ID is not configured in Config.gs.\');
  }
  return SpreadsheetApp.openById(spreadsheetId);
}

/**
 * Gets the main data sheet from the spreadsheet.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} The main data sheet.
 * @throws {Error} If the sheet is not found.
 */
function getDataSheet() {
  const sheetName = getSheetName();
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Sheet \'${sheetName}\' not found in the spreadsheet.`);
  }
  return sheet;
}

/**
 * Gets the header row values of the data sheet.
 * @returns {string[]} An array of header names.
 */
function getHeaderRow() {
  const sheet = getDataSheet();
  // Assuming headers are in the first row and match CONFIG.SHEET_HEADERS
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return headers.map(header => header.trim()); // Trim headers to avoid whitespace issues
}

/**
 * Finds a record in the sheet by a specific column value.
 * @param {string} headerName The name of the column to search in.
 * @param {string} value The value to search for.
 * @returns {{rowIndex: number, record: object}|null} An object containing the 1-based row index and the record data as an object, or null if not found.
 */
function findRecordByColumn(headerName, value) {
  const sheet = getDataSheet();
  const headers = getHeaderRow();
  const columnIndex = headers.indexOf(headerName);

  if (columnIndex === -1) {
    Logger.log(`Column \'${headerName}\' not found in sheet headers.`);
    return null;
  }

  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const firstDataRowIndex = 1; // Assuming row 1 is headers, data starts from row 2

  for (let i = firstDataRowIndex; i < values.length; i++) {
    if (values[i][columnIndex] === value) {
      const record = {};
      headers.forEach((header, j) => {
        record[header] = values[i][j];
      });
      return { rowIndex: i + 1, record: record }; // +1 because sheet rows are 1-based
    }
  }
  return null;
}

/**
 * Appends a new record to the sheet.
 * @param {object} recordData An object where keys are header names and values are the data.
 * @returns {number} The 1-based row index of the newly appended record.
 * @throws {Error} If required headers are missing or if an issue occurs during append.
 */
function appendRecord(recordData) {
  return withLock(() => {
    const sheet = getDataSheet();
    const headers = getSheetHeaders();
    const row = [];

    headers.forEach(header => {
      // Ensure all configured headers are present in the recordData, or provide default/null
      const value = recordData[header] !== undefined ? recordData[header] : \'\';
      row.push(value);
    });

    sheet.appendRow(row);
    const newRowIndex = sheet.getLastRow();
    Logger.log("Appended new record at row: %s", newRowIndex);
    return newRowIndex;
  });
}

/**
 * Updates an existing record in the sheet.
 * @param {number} rowIndex The 1-based row index of the record to update.
 * @param {object} updatedData An object with header names as keys and new values.
 * @throws {Error} If the row index is invalid or if an issue occurs during update.
 */
function updateRecord(rowIndex, updatedData) {
  return withLock(() => {
    const sheet = getDataSheet();
    const headers = getSheetHeaders();
    const range = sheet.getRange(rowIndex, 1, 1, headers.length);
    const rowValues = range.getValues()[0];

    let updated = false;
    headers.forEach((header, index) => {
      if (updatedData.hasOwnProperty(header)) {
        if (rowValues[index] !== updatedData[header]) { // Only update if value has changed
          rowValues[index] = updatedData[header];
          updated = true;
        }
      }
    });

    if (updated) {
      range.setValues([rowValues]);
      Logger.log("Updated record at row: %s", rowIndex);
    } else {
      Logger.log("No changes detected for record at row: %s", rowIndex);
    }
  });
}

/**
 * Retrieves records that need a 24-hour follow-up check.
 * This typically means records with a \'paymentStatus\' of \'paid\' and \'followUpFlag\' not yet \'24h_sent\'.
 * @returns {Array<{rowIndex: number, record: object}>} An array of objects, each with rowIndex and record data.
 */
/**
 * Retrieves records that have a specific payment status and have not yet received a particular follow-up email.
 * @param {string} paymentStatus The payment status to filter by (e.g., 'pending', 'paid').
 * @param {string} followUpFlagValue The value of the 'FollowUpEmailSent' column to filter out (e.g., '', '24h_sent').
 * @returns {Array<{rowIndex: number, record: object}>} An array of objects, each with rowIndex and record data.
 */
function getRecordsForFollowUp(paymentStatus, followUpFlagValue) {
  const sheet = getDataSheet();
  const headers = getHeaderRow();
  const data = sheet.getDataRange().getValues();
  const recordsToProcess = [];

  const paymentStatusColIndex = headers.indexOf("PaymentStatus");
  const followUpEmailSentColIndex = headers.indexOf("FollowUpEmailSent");
  const orderIdColIndex = headers.indexOf("OrderID");

  if (paymentStatusColIndex === -1 || followUpEmailSentColIndex === -1 || orderIdColIndex === -1) {
    Logger.log("Missing required columns for follow-up processing.");
    return [];
  }

  // Start from the second row (index 1) to skip headers
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const currentPaymentStatus = row[paymentStatusColIndex];
    const currentFollowUpFlag = row[followUpEmailSentColIndex];

    // Check if the record matches the desired payment status and follow-up flag
    if (currentPaymentStatus === paymentStatus && currentFollowUpFlag === followUpFlagValue) {
      const record = {};
      headers.forEach((header, j) => {
        record[header] = row[j];
      });
      recordsToProcess.push({ rowIndex: i + 1, record: record });
    }
  }
  return recordsToProcess;
}

/**
 * Retrieves records that need a 24-hour check (e.g., initial payment status 'pending' or similar, without 24h follow-up sent).
 * @returns {Array<{rowIndex: number, record: object}>} An array of objects, each with rowIndex and record data.
 */
function getRecordsFor24HourCheck() {
  const sheet = getDataSheet();
  const headers = getHeaderRow();
  const data = sheet.getDataRange().getValues();
  const recordsToCheck = [];

  const emailColIndex = headers.indexOf(\'email\');
  const paymentStatusColIndex = headers.indexOf(\'paymentStatus\');
  const followUpFlagColIndex = headers.indexOf(\'followUpFlag\');
  const timestampColIndex = headers.indexOf(\'timestamp\');

  if (emailColIndex === -1 || paymentStatusColIndex === -1 || followUpFlagColIndex === -1 || timestampColIndex === -1) {
    Logger.log("Missing required columns for 24-hour check.");
    return [];
  }

  // Start from the second row (index 1) to skip headers
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const paymentStatus = row[paymentStatusColIndex];
    const followUpFlag = row[followUpFlagColIndex];
    const timestampStr = row[timestampColIndex];

    // Only consider \'paid\' status and \'initial\' or empty follow-up flag
    if (paymentStatus === \'paid\' && (followUpFlag === \'initial\' || followUpFlag === \'\')) {
      const recordTimestamp = new Date(timestampStr);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      if (recordTimestamp < twentyFourHoursAgo) {
        const record = {};
        headers.forEach((header, j) => {
          record[header] = row[j];
        });
        recordsToCheck.push({ rowIndex: i + 1, record: record });
      }
    }
  }
  return recordsToCheck;
}

/**
 * Retrieves records that are eligible for PII masking/deletion.
 * This includes records where \'isPiiMasked\' is false and \'lastAccessed\' is older than PII_MASKING_DAYS.
 * @returns {Array<{rowIndex: number, record: object}>} An array of objects, each with rowIndex and record data.
 */
function getRecordsForPiiMasking() {
  const sheet = getDataSheet();
  const headers = getHeaderRow();
  const data = sheet.getDataRange().getValues();
  const recordsToMask = [];

  const lastAccessedColIndex = headers.indexOf(\'lastAccessed\');
  const isPiiMaskedColIndex = headers.indexOf(\'isPiiMasked\');

  if (lastAccessedColIndex === -1 || isPiiMaskedColIndex === -1) {
    Logger.log("Missing \'lastAccessed\' or \'isPiiMasked\' columns for PII masking.");
    return [];
  }

  const piiMaskingDays = getPiiMaskingDays();
  const piiCutoffDate = new Date(Date.now() - piiMaskingDays * 24 * 60 * 60 * 1000);

  // Start from the second row (index 1) to skip headers
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const lastAccessedStr = row[lastAccessedColIndex];
    const isPiiMasked = row[isPiiMaskedColIndex];

    if (isPiiMasked !== true) { // Only process if not already masked
      const lastAccessedDate = new Date(lastAccessedStr);
      if (lastAccessedDate < piiCutoffDate) {
        const record = {};
        headers.forEach((header, j) => {
          record[header] = row[j];
        });
        recordsToMask.push({ rowIndex: i + 1, record: record });
      }
    }
  }
  return recordsToMask;
}

/**
 * Masks PII data (email, name) in a specific row.
 * This operation is critical and must be done under lock.
 * @param {number} rowIndex The 1-based row index to mask.
 */
function maskPiiInRow(rowIndex) {
  return withLock(() => {
    const sheet = getDataSheet();
    const headers = getSheetHeaders();
    const emailColIndex = headers.indexOf(\'email\');
    const nameColIndex = headers.indexOf(\'name\');
    const diagnosisDataJsonColIndex = headers.indexOf(\'diagnosisDataJson\');
    const isPiiMaskedColIndex = headers.indexOf(\'isPiiMasked\');

    if (emailColIndex === -1 || nameColIndex === -1 || diagnosisDataJsonColIndex === -1 || isPiiMaskedColIndex === -1) {
      Logger.log("Cannot mask PII: Missing one or more PII columns.");
      return;
    }

    const range = sheet.getRange(rowIndex, 1, 1, headers.length);
    const rowValues = range.getValues()[0];

    rowValues[emailColIndex] = \'masked_\' + rowIndex + \'@example.com\';
    rowValues[nameColIndex] = \'Masked User \' + rowIndex;

    // Optionally, if diagnosisDataJson contains PII, it should also be masked or removed
    try {
      const diagnosisData = JSON.parse(rowValues[diagnosisDataJsonColIndex]);
      if (diagnosisData && diagnosisData.user && diagnosisData.user.email) {
        diagnosisData.user.email = \'masked_\' + rowIndex + \'@example.com\';
      }
      if (diagnosisData && diagnosisData.user && diagnosisData.user.name) {
        diagnosisData.user.name = \'Masked User \' + rowIndex;
      }
      rowValues[diagnosisDataJsonColIndex] = JSON.stringify(diagnosisData);
    } catch (e) {
      Logger.log("Failed to parse or mask diagnosisDataJson at row %s: %s", rowIndex, e.message);
    }

    rowValues[isPiiMaskedColIndex] = true;

    range.setValues([rowValues]);
    Logger.log("PII masked for record at row: %s", rowIndex);
  });
}
