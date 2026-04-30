/**
 * @file Config.gs
 * @description Google Apps Script project configurations.
 */

const CONFIG = {
  SPREADSHEET_ID: '1M4rROj0IrjkjKJw7jI_qvtVumaEPgbv6qH2SpxjJljg', // Google Sheet ID for V4.0
  SHEET_NAME: 'DiagnosisData',
  // PayPal API credentials will be retrieved from Script Properties for security
  // PropertiesService.getScriptProperties().getProperty('PAYPAL_CLIENT_ID')
  // PropertiesService.getScriptProperties().getProperty('PAYPAL_SECRET')
  PAYPAL_API_BASE_URL: 'https://api-m.paypal.com', // Use 'https://api-m.sandbox.paypal.com' for sandbox
  AI_CURRICULUM_BASE_URL: 'YOUR_AI_CURRICULUM_GENERATION_SERVICE_URL_HERE',
  EMAIL_SENDER_NAME: '英語脳育成塾',
  EMAIL_SENDER_EMAIL: 'noreply@example.com', // Replace with your sender email
  // Column headers for the Google Sheet. Ensure these match the actual sheet headers.
  SHEET_HEADERS: [
    'Timestamp', 'OrderID', 'PayerID', 'PayerEmail', 'PaymentStatus', 'Amount', 'Currency', 'ItemName', 'SystemeioContactID', 'FollowUpEmailSent', 'LastActivityDate', 'PersonalInfoMasked', 'company_name', 'dept_name', 'assignment_timing', 'assignment_type', 'assignment_subject', 'assignment_difficulty', 'ai_interaction_style', 'learning_goal', 'previous_experience', 'motivation_level', 'family_support_req', 'assignment_rank', 'ai_curriculum_url'
  ],
  // PII masking/deletion settings
  PII_MASKING_DAYS: 90, // Days after last access to mask PII
};

/**
 * Gets the Google Spreadsheet ID.
 * @returns {string} The ID of the Google Spreadsheet.
 */
function getSheetId() {
  return CONFIG.SPREADSHEET_ID;
}

/**
 * Gets the name of the main data sheet.
 * @returns {string} The name of the main data sheet.
 */
function getSheetName() {
  return CONFIG.SHEET_NAME;
}

/**
 * Gets PayPal API credentials.
 * @returns {{clientId: string, secret: string}} An object containing PayPal client ID and secret.
 */
function getPayPalApiCredentials() {
  const scriptProperties = PropertiesService.getScriptProperties();
  return {
    clientId: scriptProperties.getProperty("PAYPAL_CLIENT_ID"),
    secret: scriptProperties.getProperty("PAYPAL_SECRET")
  };
}

/**
 * Gets the PayPal API base URL.
 * @returns {string} The base URL for the PayPal API.
 */
function getPayPalApiBaseUrl() {
  return CONFIG.PAYPAL_API_BASE_URL;
}

/**
 * Gets the base URL for the AI curriculum generation service.
 * @returns {string} The base URL for AI curriculum generation.
 */
function getAiCurriculumBaseUrl() {
  return CONFIG.AI_CURRICULUM_BASE_URL;
}

/**
 * Gets the sender name for emails.
 * @returns {string} The email sender name.
 */
function getEmailSenderName() {
  return CONFIG.EMAIL_SENDER_NAME;
}

/**
 * Gets the sender email address.
 * @returns {string} The email sender address.
 */
function getEmailSenderEmail() {
  return CONFIG.EMAIL_SENDER_EMAIL;
}

/**
 * Gets the expected headers for the Google Sheet.
 * @returns {string[]} An array of sheet header strings.
 */
function getSheetHeaders() {
  return CONFIG.SHEET_HEADERS;
}

/**
 * Gets the number of days after which PII should be masked.
 * @returns {number} Number of days.
 */
function getPiiMaskingDays() {
  return CONFIG.PII_MASKING_DAYS;
}
