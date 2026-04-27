/*
 * =========================================================================
 * 英語脳育成塾 LP - 診断ファンネル フロントエンド JS
 * File: js/diagnosis.js
 * 
 * [ VERSION HISTORY ]
 * v1.1.0 (2026-04-24)
 *   - [TASK2対応] 通信失敗時およびサーバーエラー時に、ユーザー向けの
 *     丁寧なエラーモーダルを表示するUX向上処理 (showErrorModal) を実装。
 *   - 通信エラーメッセージの定数化 (ERROR_MSG_DEFAULT)。
 *   - fetch処理での HTTP ステータス (response.ok) 判定の強化。
 * 
 * v1.0.1
 *   - [FIX] questions配列末尾の構文エラー (Unexpected token 'function') の解消。
 *   - Chrome拡張由来のコンソールエラーノイズ切り分け完了。
 * 
 * v1.0.0
 *   - プロトタイプ初期リリース。
 * =========================================================================
 */

(function () {
  const container = document.getElementById('diagnosis-quiz-container');
  const startBtn = document.getElementById('start-diagnosis-btn');
  const config = window.DIAGNOSIS_CONFIG || {};

  // UX用の汎用エラーメッセージ
  const ERROR_MSG_DEFAULT = '現在アクセスが集中しています。恐れ入りますが、しばらく時間を置いて再度お試しください。';

  if (!container || !startBtn) return;

  const questions =[
    {
      key: 'assignment_status',
      title: '現在の海外赴任状況を教えてください',
      options:[
        { label: '赴任が正式に決まっている', value: 4 },
        { label: '打診・候補段階', value: 3 },
        { label: '将来的に可能性がある', value: 2 }
      ]
    },
    {
      key: 'english_level',
      title: '英語での会議・説明にどの程度不安がありますか',
      options:[
        { label: 'かなり不安がある', value: 4 },
        { label: 'やや不安がある', value: 3 },
        { label: '少し不安がある', value: 2 },
        { label: 'ほぼ不安はない', value: 1 }
      ]
    },
    {
      key: 'negotiation_level',
      title: '現地メンバーや取引先との調整・交渉に不安がありますか',
      options:[
        { label: 'かなり不安がある', value: 4 },
        { label: 'やや不安がある', value: 3 },
        { label: '少し不安がある', value: 2 },
        { label: 'ほぼ不安はない', value: 1 }
      ]
    },
    {
      key: 'field_issue_level',
      title: '工場・店舗・現場対応の英語に不安がありますか',
      options:[
        { label: 'かなり不安がある', value: 4 },
        { label: 'やや不安がある', value: 3 },
        { label: '少し不安がある', value: 2 },
        { label: 'ほぼ不安はない', value: 1 }
      ]
    },
    {
      key: 'family_support_level',
      title: 'ご家族の生活立ち上げや生活英語にも不安がありますか',
      options:[
        { label: 'かなり不安がある', value: 4 },
        { label: 'やや不安がある', value: 3 },
        { label: '少し不安がある', value: 2 },
        { label: '該当しない / 不安は少ない', value: 1 }
      ]
    },
    {
      key: 'priority_issue',
      title: '今もっとも整理したいテーマは何ですか',
      options:[
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

  /**
   *[v1.1.0 追加] エラー用のモーダルを動的に生成・表示する
   */
  function showErrorModal(message) {
    // 既存のモーダルがあれば削除
    const existingModal = document.getElementById('diagnosis-error-modal');
    if (existingModal) existingModal.remove();

    const modalHtml = `
      <div id="diagnosis-error-modal" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(2, 6, 23, 0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; opacity: 0; transition: opacity 0.3s ease;">
        <div style="background: var(--bg-secondary, #0f172a); border: 1px solid var(--border-subtle, rgba(255,255,255,0.1)); padding: 40px; border-radius: 24px; max-width: 420px; width: 90%; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.6); transform: translateY(20px); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
          <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(239, 68, 68, 0.1); color: #ef4444; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; margin: 0 auto 24px;">!</div>
          <h4 style="color: #ffffff; font-size: 1.25rem; font-weight: 700; margin-bottom: 16px; font-family: sans-serif;">通信エラー</h4>
          <p style="color: #94a3b8; font-size: 0.95rem; line-height: 1.6; margin-bottom: 32px;">
            ${escapeHtml(message)}
          </p>
          <button id="diagnosis-error-modal-close" class="btn btn-outline" style="width: 100%; border: 1px solid #475569; padding: 12px; border-radius: 50px; background: transparent; color: #fff; cursor: pointer; transition: background 0.2s;">閉じる</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('diagnosis-error-modal');
    const closeBtn = document.getElementById('diagnosis-error-modal-close');
    const modalInner = modal.firstElementChild;

    // 表示アニメーション
    requestAnimationFrame(() => {
      modal.style.opacity = '1';
      modalInner.style.transform = 'translateY(0)';
    });

    // 閉じる処理とホバー効果
    closeBtn.addEventListener('mouseover', () => closeBtn.style.background = 'rgba(255,255,255,0.05)');
    closeBtn.addEventListener('mouseout', () => closeBtn.style.background = 'transparent');
    closeBtn.addEventListener('click', () => {
      modal.style.opacity = '0';
      modalInner.style.transform = 'translateY(20px)';
      setTimeout(() => modal.remove(), 300);
    });
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
          <div class="form-row">
            <div class="form-group">
              <label for="lead-last-name">姓 <span class="required">*</span></label>
              <input type="text" id="lead-last-name" name="last_name" required />
            </div>
            <div class="form-group">
              <label for="lead-first-name">名 <span class="required">*</span></label>
              <input type="text" id="lead-first-name" name="first_name" required />
            </div>
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
        const last_name = String(formData.get('last_name') || '').trim();
        const first_name = String(formData.get('first_name') || '').trim();
        const email = String(formData.get('email') || '').trim();
        const formSyncEnabled = formData.get('formsyncenabled') === 'on';

        if (!last_name || !first_name) {
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
            name: last_name + ' ' + first_name,
            email,
            form_sync_enabled: formSyncEnabled
          });

          // LP入力情報を保存して予約ページに引き継ぐ
          state.lead = { last_name, first_name, email };
          try {
            window.localStorage.setItem('eigo_diagnosis_last_name', last_name);
            window.localStorage.setItem('eigo_diagnosis_first_name', first_name);
            window.localStorage.setItem('eigo_diagnosis_email', email);
          } catch (storageError) {
            console.warn('localStorage is unavailable:', storageError);
          }

          // [v1.1.0 変更] バックエンドからエラーが返された場合のモーダル表示
          if (!result || !result.ok) {
            // v2.x.x: サーバーの生メッセージをユーザーに見せず常に日本語メッセージを使用
            showErrorModal(ERROR_MSG_DEFAULT);
            showStatus('', ''); // 元のテキストメッセージは消す（モーダルで案内するため）

            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = '診断結果を受け取る';
            }
            return;
          }

          renderResult(result.result);
        } catch (error) {
          console.error('submit failed:', error);
          
          //[v1.1.0 変更] ネットワークエラーなどの致命的例外時のモーダル表示
          showErrorModal(ERROR_MSG_DEFAULT);
          showStatus('', '');

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
        result_urgency: 'HIGH',
        result_label: '今すぐ動かないと、赴任後に後悔するリスクが高い状態です',
        result_message: 'スコアが示す通り、複数の場面で同時に高い負荷がかかる見込みです。語学・交渉・現場・家族サポートが重なるこの状況は、出国後に「もっと早く準備すれば良かった」という後悔を生みやすいパターンです。',
        recommended_action: '英語・交渉・現場対応・家族支援それぞれの優先度を整理した「個人別ロードマップ」の作成が、今あなたに最も必要なことです。'
      };
    }

    if (total >= 16) {
      return {
        total_score: total,
        result_rank: 'B',
        result_urgency: 'MEDIUM',
        result_label: '準備を始めるなら、今が最後のベストタイミングです',
        result_message: '現時点では「まだ余裕がある」と感じているかもしれません。しかし赴任まで残り数ヶ月で、語学・業務・生活準備が一気に重なります。今から動いた人と、動かなかった人の差は赴任後3ヶ月で明らかになります。',
        recommended_action: '負荷が高くなる場面を今のうちに絞り込み、出国前6〜8ヶ月の行動計画に落とし込むことで、準備の質が格段に上がります。'
      };
    }

    return {
      total_score: total,
      result_rank: 'C',
      result_urgency: 'LOW',
      result_label: '準備のスタートラインに立てています。あとは「何から始めるか」だけです',
      result_message: '基礎的な不安は少ない状態ですが、「英語は大丈夫だろう」と思っていた方ほど、赴任後に想定外の場面で詰まることがあります。現状を正確に把握してから動き出すことで、限られた時間を最大限に活かせます。',
      recommended_action: '現状把握と優先順位づけから始めることで、焦らず・無駄なく準備を進められます。あなたのペースに合わせた計画を一緒に作りましょう。'
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

    const body = JSON.stringify(payload); //[UPDATE: 2026-04-27] Changed to send raw JSON for text/plain content type

    const response = await fetch(config.gasEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8' //[UPDATE: 2026-04-27] Changed to text/plain to avoid CORS preflight request
      },
      body: body,
      redirect: 'follow'
    });

    // [v1.1.0 追加] ネットワークエラー・5xx系エラー時の明示的な例外スロー
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

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
      showErrorModal(ERROR_MSG_DEFAULT);
      return;
    }

    console.log('renderResult called with state.lead:', state.lead);
    console.log('Will generate booking link with last_name:', encodeURIComponent(state.lead?.last_name || ''));
    console.log('Will generate booking link with first_name:', encodeURIComponent(state.lead?.first_name || ''));
    console.log('Will generate booking link with email:', encodeURIComponent(state.lead?.email || ''));

    const rankColor   = { A: '#f87171', B: '#fbbf24', C: '#4ade80' };
    const urgencyText = { A: '⚠️ 緊急度：高', B: '⏰ 緊急度：中', C: '✅ 緊急度：低' };
    const rank  = result.result_rank || 'C';
    const color = rankColor[rank] || '#d4af5f';

    container.innerHTML = `
      <div class="diagnosis-result-card">

        <div class="result-rank-badge" style="border-color:${color}20; background:${color}12;">
          <span class="result-rank-letter" style="color:${color};">${escapeHtml(rank)}</span>
          <span class="result-rank-label">ランク</span>
        </div>

        <p class="result-urgency-label">${urgencyText[rank] || ''}</p>

        <h3 class="diagnosis-question-title result-main-title">${escapeHtml(result.result_label || '')}</h3>

        <div class="result-message-box">
          <p>${escapeHtml(result.result_message || '')}</p>
        </div>

        <div class="diagnosis-result-body">
          <h4>📌 今のあなたへのアドバイス</h4>
          <p>${escapeHtml(result.recommended_action || '')}</p>
        </div>

        <div class="result-email-cta">
          <p class="result-email-cta-icon">📧</p>
          <p class="result-email-cta-title">診断結果をメールでお送りしました</p>
          <p class="result-email-cta-body">
            ご登録のアドレスに<strong>診断結果と無料個別相談のご案内</strong>を送付しました。<br>
            メールをご確認のうえ、ご興味があればそのままご予約いただけます。
          </p>
          <p class="result-email-cta-note">※迷惑メールフォルダをご確認ください。</p>
        </div>

        <div class="result-booking-cta">
          <a href="booking.html?last_name=${encodeURIComponent(state.lead?.last_name || '')}&first_name=${encodeURIComponent(state.lead?.first_name || '')}&email=${encodeURIComponent(state.lead?.email || '')}" class="btn btn-primary result-booking-btn">
            無料個別相談を予約する（完全無料・Google Meet）
          </a>
          <p class="result-booking-note">所要時間45分 ／ 事前カルテ5問（約2分）</p>
        </div>

        <div style="text-align:center; margin-top:16px;">
          <button type="button" class="btn-text-subtle" id="restart-diagnosis-btn">もう一度診断する</button>
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