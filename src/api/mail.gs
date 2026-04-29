/**
 * @fileoverview Email utility functions for the English School AI system.
 * Handles sending various types of emails using GmailApp.
 */

/**
 * Sends a thank you email for diagnosis completion, including a URL to the booking form.
 * @param {object} payload The data object containing recipient information and diagnosis results.
 * @param {string} payload.email The recipient's email address.
 * @param {string} payload.name The recipient's name.
 * @param {string} payload.result_rank The diagnosis rank (e.g., 'A', 'B', 'C').
 * @param {number} payload.total_score The total score from the diagnosis.
 * @param {string} payload.result_label The label corresponding to the diagnosis result.
 * @param {string} payload.recommended_action The recommended action based on the diagnosis.
 */
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
    // Assuming `logError` is globally available from `utils.gs`
    GmailApp.sendEmail(recipient, subject, body, { name: '英語脳育成塾 事務局' });
    Logger.log('Diagnosis email sent to: ' + recipient);
  } catch (emailError) {
    // Assuming `logError` is globally available from `utils.gs`
    logError('sendDiagnosisEmail', emailError, 'Failed to send diagnosis email to ' + recipient);
  }
}

/**
 * Sends a booking confirmation email, including a URL with parameters for the STEP2 form.
 * @param {object} payload The data object containing recipient information and booking details.
 * @param {string} payload.email The recipient's email address.
 * @param {string} payload.name The recipient's name.
 * @param {string} payload.booking_date The confirmed booking date.
 * @param {string} payload.booking_time The confirmed booking time.
 * @param {string} payload.google_meet_url The Google Meet URL for the interview.
 */
function sendBookingConfirmEmail(payload) {
  const recipient = payload.email;
  const name = payload.name;
  const bookingDate = payload.booking_date;
  const bookingTime = payload.booking_time;
  const googleMeetUrl = payload.google_meet_url;

  // Generate STEP2 form URL with pre-filled parameters
  const step2Url = 'https://ei5known.github.io/eigo-diagnosis-lp/step2.html?last_name=' +
    encodeURIComponent((payload.name || '').split(' ')[0]) + '&first_name=' +
    encodeURIComponent((payload.name || '').split(' ').slice(1).join(' ')) + '&email=' +
    encodeURIComponent(payload.email) + '&booking_date=' +
    encodeURIComponent(bookingDate) + '&booking_time=' +
    encodeURIComponent(bookingTime);

  const subject = '【ご予約確定】英語脳育成塾 - 面談予約のお知らせ';
  const body = `
${name}様

英語脳育成塾の面談予約が確定いたしました。
詳細は以下の通りです。

━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 日時: ${bookingDate} ${bookingTime}
🔗 Google Meet URL: ${googleMeetUrl}
━━━━━━━━━━━━━━━━━━━━━━━━━━━

面談前に、以下のアンケートにご回答ください。

面談前アンケート (STEP2): ${step2Url}

ご不明な点がございましたら、お気軽にお問い合わせください。

よろしくお願いいたします。
英語脳育成塾 事務局
`;

  try {
    GmailApp.sendEmail(recipient, subject, body, { name: '英語脳育成塾 事務局' });
    Logger.log('Booking confirmation email sent to: ' + recipient);
  } catch (emailError) {
    logError('sendBookingConfirmEmail', emailError, 'Failed to send booking confirmation email to ' + recipient);
  }
}

/**
 * Sends a confirmation email for STEP2 questionnaire submission.
 * @param {object} payload The data object containing recipient information and STEP2 details.
 * @param {string} payload.email The recipient's email address.
 * @param {string} payload.name The recipient's name.
 */
function sendStep2ConfirmEmail(payload) {
  const recipient = payload.email;
  const name = payload.name;

  const subject = '【回答受付】英語脳育成塾 - 面談前アンケートのご回答ありがとうございます';
  const body = `
${name}様

面談前アンケート (STEP2) のご回答ありがとうございました。

ご回答いただいた内容は、今後の面談に活用させていただきます。

ご不明な点がございましたら、お気軽にお問い合わせください。

よろしくお願いいたします。
英語脳育成塾 事務局
`;

  try {
    GmailApp.sendEmail(recipient, subject, body, { name: '英語脳育成塾 事務局' });
    Logger.log('STEP2 confirmation email sent to: ' + recipient);
  } catch (emailError) {
    logError('sendStep2ConfirmEmail', emailError, 'Failed to send STEP2 confirmation email to ' + recipient);
  }
}
