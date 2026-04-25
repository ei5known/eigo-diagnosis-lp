// step2.js - 面談前アンケートロジック
// v1.0.0

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('step2-form');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.querySelector('.progress-text');
  const config = window.STEP2_CONFIG;

  if (!form || !config) {
    console.error('Step2 form or config not found');
    return;
  }

  let currentStep = 1;
  const totalSteps = 4;

  // URLパラメータからemailとnameを取得
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email');
  const name = urlParams.get('name');

  if (!email || !name) {
    alert('必要なパラメータが不足しています。予約フォームから再度アクセスしてください。');
    window.location.href = 'booking.html';
    return;
  }

  // 次へボタンイベント
  for (let i = 1; i < totalSteps; i++) {
    const nextBtn = document.getElementById(`next-btn-${i}`);
    if (nextBtn) {
      nextBtn.addEventListener('click', () => goToStep(i + 1));
    }
  }

  // 戻るボタンイベント
  for (let i = 2; i <= totalSteps; i++) {
    const prevBtn = document.getElementById(`prev-btn-${i}`);
    if (prevBtn) {
      prevBtn.addEventListener('click', () => goToStep(i - 1));
    }
  }

  // フォーム送信
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
      email: email,
      name: name,
      recaptcha_token: recaptchaToken,
      recaptcha_action: config.recaptchaAction
    };

    // FormDataをオブジェクトに変換
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }

    // 送信中表示
    const submitBtn = document.getElementById('submit-btn');
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
        // 成功: 完了メッセージ表示
        form.innerHTML = `
          <div class="success-message">
            <h3>アンケートが送信されました</h3>
            <p>面談当日まで、メールをご確認ください。</p>
            <a href="index.html" class="btn btn-primary">トップに戻る</a>
          </div>
        `;
      } else {
        throw new Error(result.message || '送信に失敗しました');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      alert('送信に失敗しました。再度お試しください。');
    } finally {
      if (submitBtn) {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    }
  });

  // ステップ移動関数
  function goToStep(step) {
    // 現在のステップを非表示
    document.getElementById(`step-${currentStep}`).style.display = 'none';

    // 新しいステップを表示
    document.getElementById(`step-${step}`).style.display = 'block';

    // プログレスバー更新
    const progress = (step / totalSteps) * 100;
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${step} / ${totalSteps}`;

    currentStep = step;
  }

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