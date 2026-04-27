// =========================================================================
// 英語脳育成塾 - GAS エンドポイント（シンプル版）
// v2.2.1 (2026-04-26)
// =========================================================================

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    
    if (payload.form_type === 'diagnosis') {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        status: 'success',
        result: {
          ok: true,
          result: {
            total_score: payload.total_score,
            result_rank: payload.result_rank,
            result_label: payload.result_label,
            recommended_action: payload.recommended_action
          }
        }
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Received'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error: ' + error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput('doPost only').setMimeType(ContentService.MimeType.TEXT);
}
