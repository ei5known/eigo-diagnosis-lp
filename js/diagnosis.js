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

  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param) || '';
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return str.replace(/[&<>"']/g, function (match) {
      return map[match];
    });
  }

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
    return regex.test(String(email || '').trim());
  }

  function showStatus(message, type) {
    const statusEl = document.getElementById('diagnosis-status');
    if (!statusEl) return;
    statusEl.textContent = message || '';
    statusEl.className = 'diagnosis-status';
    if (type) statusEl.classList.add(`is-${type}`);
  }

  function startDiagnosis() {
    if (!config.gasEndpoint) {
      container.innerHTML = `
        <div class="diagnosis-lead-card">
          <p class="diagnosis-status is-error">
            送信先設定が未完了です。gasEndpoint を設定してください。
          </p>
        </div>
      `;
      return;
    }

    if (!config.siteKey) {
      container.innerHTML = `
        <div class="diagnosis-lead-card">
          <p class="diagnosis-status is-error">
            reCAPTCHA の設定が未完了です。siteKey を設定してください。
          </p>
        </div>
      `;
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
        <div class="diagnosis-progress">${state.step + 1} / ${questions.length}</div>
        <h3 class="diagnosis-question-title">${escapeHtml(question.title)}</h3>
        <p class="diagnosis-note">
          ※ 診断結果の送付と、今後のご案内（任意）に利用させていただきます。不要な営業は行いません。
        </p>
        <div class="diagnosis-options">
          ${question.options
            .map((opt) => {
              const isActive =
                currentAnswer &&
                currentAnswer.value === opt.value &&
                currentAnswer.label === opt.label;

              return `
                <button
                  class="diagnosis-option ${isActive ? 'active' : ''}"
                  data-key="${escapeHtml(question.key)}"
                  data-value="${String(opt.value)}"
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
              ? '<button type="button" class="btn btn-secondary" id="diagnosis-prev-btn">戻る</button>'
              : '<span></span>'
          }
          <button type="button" class="btn btn-primary" id="diagnosis-next-btn" ${currentAnswer ? '' : 'disabled'}>
            次へ
          </button>
        </div>
      </div>
    `;

    const optionButtons = container.querySelectorAll('.diagnosis-option');
    const nextBtn = document.getElementById('diagnosis-next-btn');
    const prevBtn = document.getElementById('diagnosis-prev-btn');

    optionButtons.forEach((btn) => {
      btn.addEventListener('click', function () {
        const key = btn.getAttribute('data-key');
        const value = Number(btn.getAttribute('data-value'));
        const label = btn.getAttribute('data-label');

        state.answers[key] = { value, label };

        optionButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        if (nextBtn) nextBtn.disabled = false;
      });
    });

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        state.step += 1;
        renderCurrentStep();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        state.step -= 1;
        renderCurrentStep();
      });
    }
  }

  function renderLeadForm() {
    container.innerHTML = `
      <div class="diagnosis-lead-card">
        <h3 class="diagnosis-question-title">結果をメールで受け取る</h3>
        <p class="diagnosis-note">
          お名前とメールアドレスをご入力ください。結果をその場で表示し、あわせてメールでもお送りします。
        </p>

        <form id="diagnosis-lead-form" class="diagnosis-lead-form">
          <div class="form-group">
            <label for="lead-name">お名前 <span class="required">*</span></label>
            <input type="text" id="lead-name" name="name" required />
          </div>

          <div class="form-group">
            <label for="lead-email">メールアドレス <span class="required">*</span></label>
            <input type="email" id="lead-email" name="email" required />
            <p class="input-hint">Gmail など、受信確認できるアドレスを入力してください。</p>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="lead-form-sync" name="formsyncenabled" checked />
              今後、必要な場合のみ案内を受け取る
            </label>
          </div>

          <p id="diagnosis-status" class="diagnosis-status" aria-live="polite"></p>

          <div class="diagnosis-nav">
            <button type="button" class="btn btn-secondary" id="diagnosis-back-to-questions">戻る</button>
            <button type="submit" class="btn btn-primary" id="diagnosis-submit-btn">診断結果を受け取る</button>
          </div>

          <p class="diagnosis-privacy-note">
            送信内容は診断結果の案内および必要時のご連絡にのみ使用します。
          </p>
        </form>
      </div>
    `;

    const form = document.getElementById('diagnosis-lead-form');
    const backBtn = document.getElementById('diagnosis-back-to-questions');
    const submitBtn = document.getElementById('diagnosis-submit-btn');

    if (backBtn) {
      backBtn.addEventListener('click', function () {
        state.step = questions.length - 1;
        renderCurrentStep();
      });
    }

    if (form) {
      form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const formData = new FormData(form);
        const name = String(formData.get('name') || '').trim();
        const email = String(formData.get('email') || '').trim();
        const formSyncEnabled = formData.get('formsyncenabled') === 'on';

        if (!name) {
          showStatus('お名前を入力してください。', 'error');
          return;
        }

        if (!isValidEmail_(email)) {
          showStatus('メールアドレスの形式が正しくありません。', 'error');
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = '送信中です…';
        }
        showStatus('送信しています。しばらくお待ちください。', 'info');

        try {
          const result = await submitDiagnosis({
            name,
            email,
            form_sync_enabled: formSyncEnabled
          });

          if (!result || !result.ok) {
            const msg =
              (result && result.message) ||
              '現在アクセスが集中しています。恐れ入りますが、しばらく時間を置いて再度お試しください。';

            showStatus(msg, 'error');

            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = '診断結果を受け取る';
            }
            return;
          }

          renderResult(result.result);
        } catch (error) {
          console.error('submit failed:', error);
          showStatus(
            '現在アクセスが集中しています。恐れ入りますが、しばらく時間を置いて再度お試しください。',
            'error'
          );

          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '診断結果を受け取る';
          }
        }
      });
    }
  }

  function calculateResult() {
    const total = Object.values(state.answers).reduce(function (sum, answer) {
      return sum + Number(answer.value || 0);
    }, 0);

    if (total >= 22) {
      return {
        total_score: total,
        result_rank: 'A',
        result_label: '赴任前の重点準備が必要な状態',
        recommended_action:
          '英語・交渉・現場対応・家族支援を含め、優先順位を整理した個別計画の作成をおすすめします。'
      };
    }

    if (total >= 16) {
      return {
        total_score: total,
        result_rank: 'B',
        result_label: '早めの整理で負荷を下げやすい状態',
        recommended_action:
          'まずは負荷の高い場面を絞り込み、出国前6〜8か月の行動計画に落とし込むのがおすすめです。'
      };
    }

    return {
      total_score: total,
      result_rank: 'C',
      result_label: '基礎整理から始めれば十分間に合う状態',
      recommended_action:
        '現状把握と優先順位づけから始めることで、無理なく準備を進められます。'
    };
  }

  function generateLeadId() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const rand = Math.floor(Math.random() * 100000).toString().padStart(5, '0');

    return `lead-${y}${m}${d}${h}${min}${s}-${rand}`;
  }

  async function getRecaptchaToken() {
    if (!window.grecaptcha || !window.grecaptcha.enterprise) {
      throw new Error('reCAPTCHA is not available');
    }

    const action = config.recaptchaAction || 'submit_diagnosis';

    return await window.grecaptcha.enterprise.execute(config.siteKey, {
      action: action
    });
  }

  async function submitDiagnosis(formValues) {
    const result = calculateResult();
    const recaptchaToken = await getRecaptchaToken();

    const payload = {
      lead_id: generateLeadId(),
      name: formValues.name,
      email: formValues.email,
      assignment_status: state.answers.assignment_status?.label || '',
      english_level: state.answers.english_level?.label || '',
      negotiation_level: state.answers.negotiation_level?.label || '',
      field_issue_level: state.answers.field_issue_level?.label || '',
      family_support_level: state.answers.family_support_level?.label || '',
      priority_issue: state.answers.priority_issue?.label || '',
      total_score: result.total_score,
      result_rank: result.result_rank,
      result_label: result.result_label,
      recommended_action: result.recommended_action,
      diagnosis_type: 'overseas-assignment-prep',
      utm_source: state.meta.utm_source,
      utm_medium: state.meta.utm_medium,
      utm_campaign: state.meta.utm_campaign,
      lp_page: state.meta.lp_page,
      referrer: state.meta.referrer,
      user_agent: state.meta.user_agent,
      raw_answers: state.answers,
      form_sync_enabled: !!formValues.form_sync_enabled,
      recaptchaToken: recaptchaToken,
      recaptchaAction: config.recaptchaAction || 'submit_diagnosis'
    };

    const body = 'payload=' + encodeURIComponent(JSON.stringify(payload));

    const response = await fetch(config.gasEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body: body,
      redirect: 'follow'
    });

    const rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      throw new Error('invalid server response: ' + rawText);
    }

    return data;
  }

  function renderResult(result) {
    if (!result) {
      container.innerHTML = `
        <div class="diagnosis-result-card">
          <p class="diagnosis-status is-error">
            結果の表示に失敗しました。恐れ入りますが、時間を置いて再度お試しください。
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="diagnosis-result-card">
        <p class="diagnosis-result-rank">診断結果：${escapeHtml(result.result_rank || '')} ランク</p>
        <h3 class="diagnosis-question-title">${escapeHtml(result.result_label || '')}</h3>
        <p class="diagnosis-result-score">合計スコア：${escapeHtml(String(result.total_score || ''))}</p>
        <div class="diagnosis-result-body">
          <h4>おすすめの行動</h4>
          <p>${escapeHtml(result.recommended_action || '')}</p>
        </div>
        <div class="diagnosis-nav" style="justify-content:center; margin-top: 24px;">
          <button type="button" class="btn btn-secondary" id="restart-diagnosis-btn">もう一度診断する</button>
        </div>
      </div>
    `;

    const restartBtn = document.getElementById('restart-diagnosis-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', function () {
        state.step = -1;
        state.answers = {};
        startDiagnosis();
      });
    }
  }
})();
