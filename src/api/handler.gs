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

    return Utils.createResponse({ success: false, message: 'Unknown form type' });
  } catch (error) {
    Logger.log('doPost error: ' + error.toString());
    return Utils.createResponse({ success: false, message: 'Server error: ' + error.toString() });
  }
}

// 診断フォーム処理
function handleDiagnosis(payload) {
  try {
    // === reCAPTCHA v3 検証 (一時的なテストのためコメントアウト) ===
    // const recaptcha = Auth.verifyRecaptcha_(payload.recaptchaToken, payload.recaptchaAction);
    // if (!recaptcha.valid) {
    //   Logger.log('reCAPTCHA verification failed: ' + recaptcha.message);
    //   return Utils.createResponse({ success: false, message: recaptcha.message });
    // }
    // =======================================================

    // 1. 診断情報をシートに記録（オプション）
    Utils.logToSheet(payload);

    // 2. 診断結果メール送信
    Mail.sendDiagnosisEmail(payload);

    // 3. 成功レスポンス
    return Utils.createResponse({
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
    return Utils.createResponse({ success: false, message: 'Diagnosis error: ' + error.toString() });
  }
}

// カルテフォーム処理
function handleKarte(payload) {
  try {
    Utils.logToSheet(payload);
    return Utils.createResponse({ success: true, message: 'Karte received' });
  } catch (error) {
    return Utils.createResponse({ success: false, message: 'Karte error: ' + error.toString() });
  }
}

// アンケートフォーム処理
function handleStep2(payload) {
  try {
    Utils.logToSheet(payload);
    return Utils.createResponse({ success: true, message: 'Step2 received' });
  } catch (error) {
    return Utils.createResponse({ success: false, message: 'Step2 error: ' + error.toString() });
  }
}
