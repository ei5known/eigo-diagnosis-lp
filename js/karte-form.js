// karte-form.js - カルテ送信・カレンダー遷移ロジック
// v1.0.0

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('karte-form');
  console.log('Form element:', form); //[DEBUG: 2026-04-27] - フォーム要素の取得確認
  const calendarEmbed = document.getElementById('calendar-embed');
  const config = window.KARTE_CONFIG;

  if (!form || !config) {
    console.error('Karte form or config not found');
    return;
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    // [UPDATE: 2026-04-27] - フォームのデフォルト送信挙動が停止していることを確認するためのログ
    console.log('Form submission prevented.');

    // reCAPTCHAトークン取得
    const recaptchaToken = await getRecaptchaToken();
    if (!recaptchaToken) {
      alert('reCAPTCHA認証に失敗しました。再度お試しください。');
      return;
    }

    // フォームデータ収集
    const formData = new FormData(form);
    const data = {
      form_type: config.formType,
      timestamp: new Date().toISOString(),
      recaptcha_token: recaptchaToken,
      recaptcha_action: config.recaptchaAction
    };

    // FormDataをオブジェクトに変換
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }

    // 予約ページに渡された名前・メールがある場合はこちらを優先
    if (data.preserved_last_name && data.preserved_first_name && data.preserved_last_name.trim() !== '' && data.preserved_first_name.trim() !== '') {
      data.last_name = data.preserved_last_name.trim();
      data.first_name = data.preserved_first_name.trim();
      data.name = (data.last_name + ' ' + data.first_name).trim();
    } else if (!data.name || data.name.trim() === '') {
      data.name = ((data.last_name || '') + ' ' + (data.first_name || '')).trim();
    }
    if (data.preserved_email && data.preserved_email.trim() !== '') {
      data.email = data.preserved_email.trim();
    }
    delete data.preserved_last_name;
    delete data.preserved_first_name;
    delete data.preserved_email;

    // 日時フィールドを統一
    data.datetime1 = data.datetime1 || '';
    data.datetime2 = data.datetime2 || '';

    // 送信中表示
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '送信中...';
    submitBtn.disabled = true;

    try {
      const response = await fetch(config.gasEndpoint, {
        method: 'POST',
        redirect: 'follow', // [UPDATE: 2026-04-27] - CORSプリフライト回避のためリダイレクトを許可
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // [UPDATE: 2026-04-27] - CORSプリフライト回避のためContent-Typeをtext/plainに変更
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        // 成功: カレンダー埋め込みを表示
        // [UPDATE: 2026-04-27] - 予約フォーム送信成功後、Googleカレンダー予約画面へリダイレクト
        // 以前はiframe表示を試みていたが、ユーザー報告の不具合修正のため、確実なリダイレクトに変更。
        const googleCalendarBookingUrl = 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ14Wx5g1oVmiT3gXJPafI2ywCmChpiQDFMHtX3mRcYAiY_3K8fNhBq9PJlzGV3pI15CmjrA-ZbL?gv=true';
        window.location.href = googleCalendarBookingUrl;

        // リダイレクトされるため、以下のコードは不要になるが、念のためコメントアウト
        // form.style.display = 'none';
        // calendarEmbed.style.display = 'block';

        // window.scrollTo({ top: 0, behavior: 'smooth' });

        // alert('カルテが送信されました。以下のカレンダーから予約日時を選択してください。');
      } else {
        throw new Error(result.message || '送信に失敗しました');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      alert('送信に失敗しました。再度お試しください。');
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });

  // reCAPTCHAトークン取得関数
  async function getRecaptchaToken() {
    return new Promise((resolve) => {
      grecaptcha.enterprise.ready(async () => {
        try {
          const token = await grecaptcha.enterprise.execute(config.siteKey, {
            action: config.recaptchaAction
          });
          resolve(token);
        } catch (error) {
          console.error('reCAPTCHA error:', error);
          resolve(null);
        }
      });
    });
  }
});