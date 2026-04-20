(function () {
  const container = document.getElementById('diagnosis-quiz-container');
  const startBtn = document.getElementById('start-diagnosis-btn');
  const config = window.DIAGNOSIS_CONFIG || {};

  if (!container || !startBtn) return;

  const questions = [
    {
      key: 'assignment_status',
      title: '現在の海外赴任状況を教えてください',
      options: [
        { label: '赴任が正式に決まっている', value: 4 },
        { label: '打診・候補段階', value: 3 },
        { label: '将来的に可能性がある', value: 2 }
      ]
    },
    {
      key: 'english_level',
      title: '英語での会議・説明にどの程度不安がありますか',
      options: [
        { label: 'かなり不安がある', value: 4 },
        { label: 'やや不安がある', value: 3 },
        { label: '少し不安がある', value: 2 },
        { label: 'ほぼ不安はない', value: 1 }
      ]
    },
    {
      key: 'negotiation_level',
      title: '現地メンバーや取引先との調整・交渉に不安がありますか',
      options: [
        { label: 'かなり不安がある', value: 4 },
        { label: 'やや不安がある', value: 3 },
        { label: '少し不安がある', value: 2 },
        { label: 'ほぼ不安はない', value: 1 }
      ]
    },
    {
      key: 'field_issue_level',
      title: '工場・店舗・現場対応の英語に不安がありますか',
      options: [
        { label: 'かなり不安がある', value: 4 },
        { label: 'やや不安がある', value: 3 },
        { label: '少し不安がある', value: 2 },
        { label: 'ほぼ不安はない', value: 1 }
      ]
    },
    {
      key: 'family_support_level',
      title: 'ご家族の生活立ち上げや生活英語にも不安がありますか',
      options: [
        { label: 'かなり不安がある', value: 4 },
        { label: 'やや不安がある', value: 3 },
        { label: '少し不安がある', value: 2 },
        { label: '該当しない / 不安は少ない', value: 1 }
      ]
    },
    {
      key: 'priority_issue',
      title: '今もっとも整理したいテーマは何ですか',
      options: [
        { label: '英語力', value: 4 },
        { label: '交渉・調整', value: 4 },
        { label: '現場対応', value: 4 },
        { label: '家族の生活準備', value: 4 }
      ]
    }
  ];

  const state = {
    step: -1,
    answers: {},
    meta: {
      utm_source: getQueryParam('utm_source'),
      utm_medium: getQueryParam('utm_medium'),
      utm_campaign: getQueryParam('utm_campaign'),
      lp_page: window.location.href,
      referrer: document.referrer,
      user_agent: navigator.userAgent
    }
  };

  startBtn.addEventListener('click', startDiagnosis);

  function isValidEmail_(email) {
    const regex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    return regex.test(email.trim());
  }

  function startDiagnosis() {
    if (!config.gasEndpoint) {
      container.innerHTML =
        '<p>送信先設定が未完了です。gasEndpoint を設定してください。</p>';
      return;
    }
    if (!config.siteKey) {
      container.innerHTML =
        '<p>reCAPTCHA の設定が未完了です。siteKey を設定してください。</p>';
      return;
    }
    state.step = 0;
    renderCurrentStep();
  }

  function renderCurrentStep() {
    if (state.step < questions.length) {
      renderQuestion(questions[state.step]);
      return;
    }
    renderLeadForm();
  }

  function renderQuestion(question) {
    const currentAnswer = state.answers[question.key];

    container.innerHTML = `
      <div class="diagnosis-question-card">
        <div class="diagnosis-progress">
          質問 ${state.step + 1} / ${questions.length}
        </div>
        <h3 class="diagnosis-question-title">${escapeHtml(question.title)}</h3>
        <div class="diagnosis-options">
          ${question.options
            .map((opt) => {
              const isActive = currentAnswer && currentAnswer.value === opt.value;
              return `
                <button 
                  class="diagnosis-option ${isActive ? 'active' : ''}" 
                  data-key="${question.key}" 
                  data-value="${opt.value}" 
                  data-label="${escapeHtml(opt.label)}"
                  type="button"
                >
                  <span class="diagnosis-option-label">${escapeHtml(opt.label)}</span>
                </button>
              `;
            })
            .join('')}
        </div>
        <div class="diagnosis-nav">
          ${
            state.step > 0
              ? '<button type="button" class="btn btn-secondary" id="diagnosis-prev-btn">前の質問に戻る</button>'
              : '<span></span>'
          }
          <button type="button" class="btn btn-primary" id="diagnosis-next-btn" disabled>次へ進む</button>
        </div>
      </div>
    `;

    const optionButtons = container.querySelectorAll('.diagnosis-option');
    const nextBtn = document.getElementById('diagnosis-next-btn');
    const prevBtn = document.getElementById('diagnosis-prev-btn');

    optionButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-key');
        const value = Number(btn.getAttribute('data-value'));
        const label = btn.getAttribute('data-label');

        state.answers[key] = { value, label };

        optionButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        if (nextBtn) {
          nextBtn.disabled = false;
        }
      });
    });

    if (currentAnswer && nextBtn) {
      nextBtn.disabled = false;
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        state.step += 1;
        renderCurrentStep();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        state.step -= 1;
        renderCurrentStep();
      });
    }
  }

  function renderLeadForm() {
    container.innerHTML = `
      <div class="diagnosis-lead-card">
        <h3 class="diagnosis-question-title">結果をお送りするために、お名前とメールアドレスを入力してください</h3>
        <p class="diagnosis-note">
          ※ 診断結果の送付と、今後のご案内（任意）に利用させていただきます。不要な営業は行いません。
        </p>
        <form id="diagnosis-lead-form" class="diagnosis-lead-form">
          <div class="form-group">
            abel for="lead-name">お名前 <span class="required">*</span></label>
            <input type="text" id="lead-name" name="name" required>
          </div>
          <div class="form-group">
            abel for="lead-email">メールアドレス <span class="required">*</span></label>
            <input type="email" id="lead-email" name="email" required>
            <p class="input-hint">Gmail / 会社メールなど、日常的に確認されているアドレスをご入力ください。</p>
          </div>
          <div class="form-group">
            abel class="checkbox-label">
              <input type="checkbox" id="lead-form-sync" name="form_sync_enabled" checked>
              診断結果をもとに、今後の準備に役立つ情報（メールマガジン）を受け取る
            </label>
          </div>
          <div class="diagnosis-nav">
            <button type="button" class="btn btn-secondary" id="diagnosis-back-to-questions">質問に戻る</button>
            <button type="submit" class="btn btn-primary" id="diagnosis-submit-btn">診断結果を受け取る</button>
          </div>
          <p class="diagnosis-privacy-note">
            ※ プライバシーポリシーに基づき、個人情報は適切に管理いたします。
          </p>
        </form>
      </div>
    `;

    const form = document.getElementById('diagnosis-lead-form');
    const backBtn = document.getElementById('diagnosis-back-to-questions');
    const submitBtn = document.getElementById('diagnosis-submit-btn');

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        state.step = questions.length - 1;
        renderCurrentStep();
      });
    }

    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const name = (formData.get('name') || '').toString();
        const email = (formData.get('email') || '').toString();
        const formSyncEnabled = formData.get('form_sync_enabled') === 'on';

        if (!name.trim()) {
          alert('お名前を入力してください。');
          return;
        }

        if (!isValidEmail_(email)) {
          alert('メールアドレスの形式が正しくありません。');
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = '送信中...';
        }

        try {
          const result = await submitDiagnosis({
            name,
            email,
            form_sync_enabled: formSyncEnabled
          });

          if (!result || !result.ok) {
            const msg =
              (result && result.message) ||
              '送信中にエラーが発生しました。時間をおいて再度お試しください。';
            alert(msg);
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = '診断結果を受け取る';
            }
            return;
          }

          renderResult(result.result);
        } catch (error) {
          
