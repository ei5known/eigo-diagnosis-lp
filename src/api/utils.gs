const SHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

function logToSheet(payload) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    const timestamp = new Date().toISOString();
    const row = [timestamp, payload.form_type, payload.email, payload.name || '', JSON.stringify(payload)];
    sheet.appendRow(row);
  } catch (error) {
    Logger.log('Log to sheet error: ' + error.toString());
  }
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}