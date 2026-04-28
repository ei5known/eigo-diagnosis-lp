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
