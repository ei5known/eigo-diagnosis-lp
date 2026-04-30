/**
 * @file mail.gs
 * @description Provides functions for sending various types of emails using MailApp.
 */

/**
 * Sends a generic email.
 * @param {string} recipientEmail The email address of the recipient.
 * @param {string} subject The subject line of the email.
 * @param {string} body The plain text body of the email.
 * @param {string} [htmlBody] The HTML body of the email (optional, if provided, body is used as fallback).
 * @returns {boolean} True if the email was sent successfully, false otherwise.
 */
function sendEmail(recipientEmail, subject, body, htmlBody = null) {
  const senderName = getEmailSenderName();
  const senderEmail = getEmailSenderEmail();

  if (!recipientEmail || !subject || !body) {
    Logger.log("Cannot send email: Missing recipient, subject, or body.");
    return false;
  }

  const options = {
    name: senderName,
    from: senderEmail,
    htmlBody: htmlBody || body // Use htmlBody if provided, else use plain body
  };

  try {
    MailApp.sendEmail(recipientEmail, subject, body, options);
    Logger.log("Email sent to %s with subject: %s", recipientEmail, subject);
    return true;
  } catch (e) {
    Logger.log("Failed to send email to %s. Error: %s", recipientEmail, e.message);
    return false;
  }
}

/**
 * Sends a follow-up email to a user.
 * @param {string} recipientEmail The email address of the recipient.
 * @param {string} userName The name of the user for personalization.
 * @param {string} emailType A string indicating the type of follow-up (e.g., '24hour', 'AI_Curriculum').
 * @returns {boolean} True if the email was sent successfully, false otherwise.
 */
function sendFollowUpEmail(recipientEmail, userName, emailType) {
  let subject = "";
  let body = "";
  let htmlBody = "";

  switch (emailType) {
    case "24hour_followup":
      subject = `【英語脳育成塾】お申し込みありがとうございます - ご案内`;
      body = `
${userName}様

この度は英語脳育成塾にお申し込みいただき、誠にありがとうございます。

24時間以内にAIカリキュラム発行のご案内を差し上げます。
今しばらくお待ちください。

ご不明な点がございましたら、お気軽にお問い合わせください。

---
英語脳育成塾 事務局
`;
      htmlBody = `
      <p>${userName}様</p>
      <p>この度は英語脳育成塾にお申し込みいただき、誠にありがとうございます。</p>
      <p>24時間以内にAIカリキュラム発行のご案内を差し上げます。<br>今しばらくお待ちください。</p>
      <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
      <hr>
      <p>英語脳育成塾 事務局</p>
      `;
      break;
    case "ai_curriculum_ready":
      // This case should ideally not be called directly, as AI curriculum email uses a dedicated function
      Logger.log("sendFollowUpEmail called with 'ai_curriculum_ready' type. Use sendAiCurriculumEmail instead.");
      return false;
    default:
      Logger.log("Unknown email type for follow-up: %s", emailType);
      return false;
  }

  return sendEmail(recipientEmail, subject, body, htmlBody);
}

/**
 * Sends an email containing the AI curriculum URL.
 * @param {string} recipientEmail The email address of the recipient.
 * @param {string} userName The name of the user for personalization.
 * @param {string} aiCurriculumUrl The URL to the personalized AI curriculum.
 * @returns {boolean} True if the email was sent successfully, false otherwise.
 */
function sendAiCurriculumEmail(recipientEmail, userName, aiCurriculumUrl) {
  if (!aiCurriculumUrl) {
    Logger.log("Cannot send AI curriculum email: AI curriculum URL is missing.");
    return false;
  }

  const subject = `【英語脳育成塾】AIカリキュラムのご案内`;
  const body = `
${userName}様

お待たせいたしました！
あなたのためのAIカリキュラムが完成いたしました。
以下のURLからご確認ください。

AIカリキュラム: ${aiCurriculumUrl}

学習を始める準備はできていますか？
ご不明な点がございましたら、お気軽にお問い合わせください。

---
英語脳育成塾 事務局
`;
  const htmlBody = `
    <p>${userName}様</p>
    <p>お待たせいたしました！<br>あなたのためのAIカリキュラムが完成いたしました。</p>
    <p>以下のURLからご確認ください。</p>
    <p><a href="${aiCurriculumUrl}">AIカリキュラムはこちら</a></p>
    <p>学習を始める準備はできていますか？<br>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
    <hr>
    <p>英語脳育成塾 事務局</p>
    `;

  return sendEmail(recipientEmail, subject, body, htmlBody);
}
