/**
 * @fileoverview Google Apps Script functions for handling form submissions
 * from the English School AI landing page. This script processes data from
 * diagnosis, booking, and STEP2 (pre-interview questionnaire) forms,
 * saves them to respective Google Sheets, and sends confirmation emails.
 */

// --- Configuration Constants (Replace with your actual Spreadsheet IDs and Sheet Names) ---
const DIAGNOSIS_SPREADSHEET_ID = 'YOUR_DIAGNOSIS_SPREADSHEET_ID';
const DIAGNOSIS_SHEET_NAME = '診断データ';

const KARTE_SPREADSHEET_ID = 'YOUR_KARTE_SPREADSHEET_ID';
const KARTE_SHEET_NAME = '予約データ';

const STEP2_SPREADSHEET_ID = 'YOUR_STEP2_SPREADSHEET_ID';
const STEP2_SHEET_NAME = '面談前アンケートデータ';
// --- End Configuration Constants ---

/**
 * Helper function to save form data to a specified Google Sheet.
 * @param {string} spreadsheetId The ID of the target Google Spreadsheet.
 * @param {string} sheetName The name of the target sheet within the spreadsheet.
 * @param {object} formData The form data object to be saved.
 * @returns {boolean} True if data was saved successfully, false otherwise.
 */
function saveDataToSheet(spreadsheetId, sheetName, formData) {
  try {
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      logError('saveDataToSheet', new Error('Sheet not found'), `Spreadsheet ID: ${spreadsheetId}, Sheet Name: ${sheetName}`);
      return false;
    }

    // Get headers from the first row of the sheet
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const rowData = [];

    // Map form data to sheet columns based on headers
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      // Special handling for timestamp/created_at, if it exists
      if (header === 'timestamp' || header === 'created_at') {
        rowData.push(new Date());
      } else if (formData.hasOwnProperty(header)) {
        rowData.push(formData[header]);
      } else {
        rowData.push(''); // Add empty string for missing fields to maintain column integrity
      }
    }

    sheet.appendRow(rowData);
    Logger.log(`Data successfully saved to ${sheetName} sheet.`);
    return true;
  } catch (e) {
    logError('saveDataToSheet', e, `Error saving data to sheet. Spreadsheet ID: ${spreadsheetId}, Sheet Name: ${sheetName}`);
    return false;
  }
}

/**
 * Receives data from the diagnosis form (STEP0), saves it, and sends a confirmation email.
 * @param {GoogleAppsScript.Events.DoPost} e The event object containing form submission parameters.
 */
function handleDiagnosis(e) {
  if (!e || !e.parameter) {
    logError('handleDiagnosis', new Error('Invalid event object'), 'Event object or parameters are missing.');
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid request' })).setMimeType(ContentService.MimeType.JSON);
  }

  const formData = e.parameter;
  Logger.log('Received Diagnosis Form Data: ' + JSON.stringify(formData));

  try {
    // Save data to Diagnosis Sheet
    const saveSuccess = saveDataToSheet(DIAGNOSIS_SPREADSHEET_ID, DIAGNOSIS_SHEET_NAME, formData);

    if (saveSuccess) {
      // Send Diagnosis Email (assuming sendDiagnosisEmail is defined in mail.gs)
      sendDiagnosisEmail(formData);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Diagnosis data received and email sent.' })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Failed to save diagnosis data.' })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    logError('handleDiagnosis', error, 'Error processing diagnosis form submission.');
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'An unexpected error occurred.' })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Receives data from the booking form (STEP1), saves it, confirms the reservation, and sends a confirmation email.
 * @param {GoogleAppsScript.Events.DoPost} e The event object containing form submission parameters.
 */
function handleKarte(e) {
  if (!e || !e.parameter) {
    logError('handleKarte', new Error('Invalid event object'), 'Event object or parameters are missing.');
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid request' })).setMimeType(ContentService.MimeType.JSON);
  }

  const formData = e.parameter;
  Logger.log('Received Booking Form Data: ' + JSON.stringify(formData));

  try {
    // Save data to Booking Sheet
    const saveSuccess = saveDataToSheet(KARTE_SPREADSHEET_ID, KARTE_SHEET_NAME, formData);

    if (saveSuccess) {
      // Send Booking Confirmation Email (assuming sendBookingConfirmEmail is defined in mail.gs)
      sendBookingConfirmEmail(formData);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Booking data received and confirmation email sent.' })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Failed to save booking data.' })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    logError('handleKarte', error, 'Error processing booking form submission.');
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'An unexpected error occurred.' })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Receives data from the pre-interview questionnaire (STEP2), saves it, and sends a confirmation email.
 * @param {GoogleAppsScript.Events.DoPost} e The event object containing form submission parameters.
 */
function handleStep2(e) {
  if (!e || !e.parameter) {
    logError('handleStep2', new Error('Invalid event object'), 'Event object or parameters are missing.');
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid request' })).setMimeType(ContentService.MimeType.JSON);
  }

  const formData = e.parameter;
  Logger.log('Received STEP2 Form Data: ' + JSON.stringify(formData));

  try {
    // Save data to STEP2 Sheet
    const saveSuccess = saveDataToSheet(STEP2_SPREADSHEET_ID, STEP2_SHEET_NAME, formData);

    if (saveSuccess) {
      // Send STEP2 Confirmation Email (assuming sendStep2ConfirmEmail is defined in mail.gs)
      sendStep2ConfirmEmail(formData);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'STEP2 data received and confirmation email sent.' })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Failed to save STEP2 data.' })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    logError('handleStep2', error, 'Error processing STEP2 form submission.');
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'An unexpected error occurred.' })).setMimeType(ContentService.MimeType.JSON);
  }
}
