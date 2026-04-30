const SPREADSHEET_ID = '1DmTpWGkrZnz798_C-7zw1T2SQNhVv5T4IrLCjyuRMMo';

const REQUIRED_HEADERS = [
  'company_name', 'dept_name', // Required attributes
  'assignment_timing', 'diagnosis_result_jp', 'diagnosis_result_en', 'curriculum_type', 'current_english_level', 'goal_english_level', 'study_abroad_experience', 'toeic_score', 'purpose_of_study', 'family_support_req', // Questionnaire data
  'paypal_status', // Payment status
  'payment_date', 'followup_status', // Follow-up management
  'assignment_rank', 'ai_curriculum_url' // System management
];

/**
 * Orchestrates the setup of the Google Spreadsheet, including schema validation,
 * data area separation, and creation of the GAS reference definition.
 */
function setupSpreadsheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  Logger.log('Starting data area separation (framework creation only)...');
  separateDataAreas(ss);
  Logger.log('Data area separation complete.');

  Logger.log('Starting schema consistency validation for Production_Data...');
  validateSchema(ss.getSheetByName('Production_Data'));
  Logger.log('Schema consistency validation complete for Production_Data.');

  Logger.log('Starting schema consistency validation for Test_Data...');
  validateSchema(ss.getSheetByName('Test_Data'));
  Logger.log('Schema consistency validation complete for Test_Data.');

  Logger.log('Starting GAS reference definition creation...');
  createGasReferenceDefinition(ss);
  Logger.log('GAS reference definition creation complete.');
}

/**
 * Validates and updates the column schema of a given sheet.
 * Adds missing headers to the end of the header row without affecting existing data.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The target sheet object.
 */
function validateSchema(sheet) {
  if (!sheet) {
    Logger.log('Sheet not found for schema validation.');
    return;
  }

  const existingHeaders = sheet.getDataRange().getValues()[0] || [];
  Logger.log(`Existing Headers for ${sheet.getName()}: ` + existingHeaders);

  let headersToAdd = [];
  REQUIRED_HEADERS.forEach(header => {
    if (!existingHeaders.includes(header)) {
      headersToAdd.push(header);
    }
  });

  if (headersToAdd.length > 0) {
    const lastColumn = sheet.getLastColumn();
    const newRange = sheet.getRange(1, lastColumn + 1, 1, headersToAdd.length);
    newRange.setValues([headersToAdd]);
    Logger.log(`Added missing headers to ${sheet.getName()}: ` + headersToAdd.join(', '));
  } else {
    Logger.log(`All required headers are already present in ${sheet.getName()}.`);
  }
}

/**
 * Ensures 'Production_Data' and 'Test_Data' sheets exist and sets their initial headers.
 * Does not move or delete any existing data from other sheets.
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss The spreadsheet object.
 */
function separateDataAreas(ss) {
  let productionSheet = ss.getSheetByName('Production_Data');
  if (!productionSheet) {
    productionSheet = ss.insertSheet('Production_Data');
    productionSheet.getRange(1, 1, 1, REQUIRED_HEADERS.length).setValues([REQUIRED_HEADERS]);
    Logger.log('Created Production_Data sheet and applied headers.');
  } else {
    Logger.log('Production_Data sheet already exists. Headers will be validated separately.');
  }

  let testSheet = ss.getSheetByName('Test_Data');
  if (!testSheet) {
    testSheet = ss.insertSheet('Test_Data');
    testSheet.getRange(1, 1, 1, REQUIRED_HEADERS.length).setValues([REQUIRED_HEADERS]);
    Logger.log('Created Test_Data sheet and applied headers.');
  } else {
    Logger.log('Test_Data sheet already exists. Headers will be validated separately.');
  }
}

/**
 * Creates or updates a sheet named 'GAS参照定義' to document GAS spreadsheet interactions.
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss The spreadsheet object.
 */
function createGasReferenceDefinition(ss) {
  let gasRefSheet = ss.getSheetByName('GAS参照定義');
  if (!gasRefSheet) {
    gasRefSheet = ss.insertSheet('GAS参照定義');
    Logger.log('Created GAS参照定義 sheet.');
  } else {
    gasRefSheet.clearContents(); // Clear existing content to ensure fresh data
    Logger.log('GAS参照定義 sheet already exists, cleared its contents.');
  }

  const headers = ['GASから見たシート名', '対象範囲', '操作内容（読み取り/書き込み）', '備考'];
  gasRefSheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const definitions = [
    ['Production_Data', 'A:B', '読み取り/書き込み', 'company_name, dept_name'],
    ['Production_Data', 'C:L', '読み取り/書き込み', 'assignment_timing 〜 family_support_req (設問データ)'],
    ['Production_Data', 'M:M', '読み取り/書き込み', 'paypal_status (決済ステータス)'],
    ['Production_Data', 'N:O', '読み取り/書き込み', 'payment_date, followup_status (追客管理)'],
    ['Production_Data', 'P:Q', '読み取り/書き込み', 'assignment_rank, ai_curriculum_url (システム管理)'],
    ['Test_Data', 'A:Q', '読み取り/書き込み', 'テストデータ用のシート、本番と同じスキーマ'],
  ];

  if (definitions.length > 0) {
    gasRefSheet.getRange(2, 1, definitions.length, definitions[0].length).setValues(definitions);
    Logger.log('Populated GAS参照定義 with interaction details.');
  }
}
