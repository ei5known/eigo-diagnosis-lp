const RECAPTCHA_THRESHOLD = 0.0; // 【一時的なテスト用】reCAPTCHAを一時的にバイパスするために0.0に設定
// 注意：RECAPTCHA_API_KEY はスクリプトプロパティに設定してください。
// 例: プロパティ名: RECAPTCHA_API_KEY, 値: reCAPTCHA Secret Key

// reCAPTCHA v3 検証関数
function verifyRecaptcha_(token, action) {
  const apiKey = PropertiesService.getScriptProperties().getProperty(
    "RECAPTCHA_API_KEY"
  );
  if (!apiKey) {
    Logger.log("RECAPTCHA_API_KEY is not set in Script Properties.");
    return { valid: false, message: "Server configuration error: reCAPTCHA API key missing." };
  }

  const recaptchaVerifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${apiKey}&response=${token}`;
  const options = {
    method: "post",
    muteHttpExceptions: true,
  };

  try {
    const response = UrlFetchApp.fetch(recaptchaVerifyUrl, options);
    const result = JSON.parse(response.getContentText());

    if (!result.success) {
      Logger.log("reCAPTCHA API error: " + JSON.stringify(result["error-codes"]));
      return { valid: false, message: "reCAPTCHA API error." };
    }

    // スコアとアクションの検証
    if (result.score < RECAPTCHA_THRESHOLD) {
      Logger.log(
        `reCAPTCHA score (${result.score}) below threshold (${RECAPTCHA_THRESHOLD}). Action: ${result.action}`
      );
      return { valid: false, message: `reCAPTCHA score (${result.score}) below threshold.` };
    }

    // オプション：アクションの検証
    // if (result.action !== action) {
    //   Logger.log(`reCAPTCHA action mismatch: Expected ${action}, got ${result.action}`);
    //   return { valid: false, message: 'reCAPTCHA action mismatch.' };
    // }

    return { valid: true, message: "reCAPTCHA verification successful." };
  } catch (e) {
    Logger.log("reCAPTCHA verification exception: " + e.toString());
    return { valid: false, message: "reCAPTCHA verification failed due to server error." };
  }
}