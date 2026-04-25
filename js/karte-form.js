// karte-form.js - カルテ送信・カレンダー遷移ロジック
// v1.0.0

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('karte-form');
  const calendarEmbed = document.getElementById('calendar-embed');
  const config = window.KARTE_CONFIG;

  if (!form || !config) {
    console.error('Karte form or config not found');
    return;
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

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

    // 送信中表示
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '送信中...';
    submitBtn.disabled = true;

    try {
      const response = await fetch(config.gasEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        // 成功: カレンダー埋め込みを表示
        form.style.display = 'none';
        calendarEmbed.style.display = 'block';

        // ページ上部にスクロール
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // 成功メッセージ（オプション）
        alert('カルテが送信されました。以下のカレンダーから予約日時を選択してください。');
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