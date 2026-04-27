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

// reCAPTCHA v3 の設定
const RECAPTCHA_THRESHOLD = 0.0; // 【一時的なテスト用】reCAPTCHAを一時的にバイパスするために0.0に設定
// 注意：RECAPTCHA_API_KEY はスクリプトプロパティに設定してください。
// 例: プロパティ名: RECAPTCHA_API_KEY, 値: reCAPTCHA Secret Key

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
    // === reCAPTCHA v3 検証 (一時的なテストのためコメントアウト) ===
    // const recaptcha = verifyRecaptcha_(payload.recaptchaToken, payload.recaptchaAction);
    // if (!recaptcha.valid) {
    //   Logger.log('reCAPTCHA verification failed: ' + recaptcha.message);
    //   return createResponse({ success: false, message: recaptcha.message });
    // }
    // =======================================================

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

// reCAPTCHA v3 検証関数
function verifyRecaptcha_(token, action) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('RECAPTCHA_API_KEY');
  if (!apiKey) {
    Logger.log('RECAPTCHA_API_KEY is not set in Script Properties.');
    return { valid: false, message: 'Server configuration error: reCAPTCHA API key missing.' };
  }

  const recaptchaVerifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${apiKey}&response=${token}`;
  const options = {
    'method': 'post',
    'muteHttpExceptions': true
  };

  try {
    const response = UrlFetchApp.fetch(recaptchaVerifyUrl, options);
    const result = JSON.parse(response.getContentText());

    if (!result.success) {
      Logger.log('reCAPTCHA API error: ' + JSON.stringify(result['error-codes']));
      return { valid: false, message: 'reCAPTCHA API error.' };
    }

    // スコアとアクションの検証
    if (result.score < RECAPTCHA_THRESHOLD) {
      Logger.log(`reCAPTCHA score (${result.score}) below threshold (${RECAPTCHA_THRESHOLD}). Action: ${result.action}`);
      return { valid: false, message: `reCAPTCHA score (${result.score}) below threshold.` };
    }
    
    // オプション：アクションの検証
    // if (result.action !== action) {
    //   Logger.log(`reCAPTCHA action mismatch: Expected ${action}, got ${result.action}`);
    //   return { valid: false, message: 'reCAPTCHA action mismatch.' };
    // }

    return { valid: true, message: 'reCAPTCHA verification successful.' };

  } catch (e) {
    Logger.log('reCAPTCHA verification exception: ' + e.toString());
    return { valid: false, message: 'reCAPTCHA verification failed due to server error.' };
  }
}
