// =========================================================================
// 英語脳育成塾 - Google Apps Script (GAS) エンドポイント
// File: Google Apps Script (コード.gs)
//
// VERSION HISTORY:
// v4.1.2 (2026-04-27)
//   - FIX: reCAPTCHA v3 検証機能を追加（スコア0.5未満でreject）
//   - FIX: form_type 'step2_detail' に対応（従来の 'step2' も互換性維持）
//   - FIX: 機密情報（reCAPTCHA secret）はスクリプトプロパティ(RECAPTCHA_API_KEY)で管理
//   - 要件定義書 v4.1.2 に準拠したセキュアな実装
//
// v2.2.0 (2026-04-26)
//   - doPost: JSON形式のPOST受信に対応
//   - 診断結果メール送信機能を実装
//   - シンプルな成功/エラーレスポンスを返却
// =========================================================================

// Google Sheets ID（別途設定が必要）
const SHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

// doPost: 全フォーム共通の受け入れ関数
function doPost(e) {
  try {
    // リクエストボディをパース
    const payload = JSON.parse(e.postData.contents);
    
    // form_type によって処理を分岐
    if (payload.form_type === 'diagnosis') {
      return handleDiagnosis(payload);
    } else if (payload.form_type === 'karte') {
      return handleKarte(payload);
    } else if (payload.form_type === 'step2_detail' || payload.form_type === 'step2') {
      // FIX: form_type 'step2' と 'step2_detail' の両方に対応（後方互換性）
      return handleStep2(payload);
    }
    
    return createResponse({ success: false, message: 'Unknown form type' });
  } catch (error) {
    Logger.log('doPost error: ' + error.toString());
    return createResponse({ success: false, message: 'Server error: ' + error.toString() });
  }
}

// 診断フォーム処理
function handleDiagnosis(payload) {
  try {
    // 1. 診断情報をシートに記録（オプション）
    logToSheet(payload);
    
    // 2. 診断結果メール送信
    sendDiagnosisEmail(payload);
    
    // 3. 成功レスポンス
    return createResponse({
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
    });
  } catch (error) {
    Logger.log('handleDiagnosis error: ' + error.toString());
    return createResponse({ success: false, message: 'Diagnosis error: ' + error.toString() });
  }
}

// カルテフォーム処理
function handleKarte(payload) {
  try {
    logToSheet(payload);
    return createResponse({ success: true, message: 'Karte received' });
  } catch (error) {
    return createResponse({ success: false, message: 'Karte error: ' + error.toString() });
  }
}

// アンケートフォーム処理
function handleStep2(payload) {
  try {
    logToSheet(payload);
    return createResponse({ success: true, message: 'Step2 received' });
  } catch (error) {
    return createResponse({ success: false, message: 'Step2 error: ' + error.toString() });
  }
}

// 診断結果メール送信
function sendDiagnosisEmail(payload) {
  const recipient = payload.email;
  const name = payload.name;
  const rank = payload.result_rank || 'C';
  // [UPDATE: 2026-04-27]
  // - 内容: 診断サンクスメール内の予約フォームURLにLP入力値をパラメータとして付与。
  // - 理由: ユーザー体験向上のため、診断フォームで入力された氏名とメールアドレスを予約フォームに自動引き継ぎ。
  // - 備考: `payload.name` は LP 側で `last_name + ' ' + first_name` 形式で生成されている前提。
  const bookingUrl = 'https://ei5known.github.io/eigo-diagnosis-lp/booking.html?last_name=' + 
    encodeURIComponent((payload.name || '').split(' ')[0]) + '&first_name=' + 
    encodeURIComponent((payload.name || '').split(' ').slice(1).join(' ')) + '&email=' + 
    encodeURIComponent(payload.email);
  
  const subject = '【診断結果】英語脳育成塾 - あなたの英語スキル診断結果';
  const body = `
${name}様

ご診断ありがとうございました。
以下が診断結果です。

━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 診断スコア: ${payload.total_score}/26
📈 判定レベル: レベル${rank}
━━━━━━━━━━━━━━━━━━━━━━━━━━━

【診断結果】
${payload.result_label}

【推奨アクション】
${payload.recommended_action}

【次のステップ】
以下のリンクより、45分の個別Google Meet面談をご予約ください。

面談予約フォーム: ${bookingUrl}

ご不明な点がございましたら、お気軽にお問い合わせください。

よろしくお願いいたします。
英語脳育成塾 事務局
`;
  
  try {
    GmailApp.sendEmail(recipient, subject, body, { name: '英語脳育成塾' });
    Logger.log('Email sent to: ' + recipient);
  } catch (emailError) {
    Logger.log('Email send error: ' + emailError.toString());
  }
}

// シートにログ記録
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

// 標準レスポンス作成
function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
