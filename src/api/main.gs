/**
 * Main entry point for HTTP POST requests to the Google Apps Script web app.
 * Routes incoming requests to appropriate handlers based on URL parameters.
 * @param {GoogleAppsScript.Events.DoPost} e The event object from the HTTP POST request.
 * @returns {GoogleAppsScript.Content.TextOutput} A JSON response indicating the status of the operation.
 */
function doPost(e) {
  const path = e.parameter.path;
  Logger.log('Received doPost request for path: ' + path);

  switch (path) {
    case 'paypal-webhook':
      return handlePayPalWebhook(e);
    // Add other webhook or API routes here
    default:
      Logger.log('Unhandled path: ' + path);
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Unhandled path' })).setMimeType(ContentService.MimeType.JSON);
  }
}