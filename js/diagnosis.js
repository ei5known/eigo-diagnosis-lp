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

  // ============================================================
  // メールアドレス形式チェック
  // ============================================================
  function isValidEmail_(email) {
    const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    return regex.test(email.trim());
  }

  // ============================================================
  // 診断開始
  // ============================================================
  function startDiagnosis() {
    if (!config.gasEndpoint) {
      container.innerHTML = '<p style="color:red;">送信先設定が未完了です。gasEndpoint を設定してください。</p>';
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

  // ============================================================
  // 質問レンダリング
  // ============================================================
  function renderQuestion(question) {
    container.innerHTML = `
      <div class="diagnosis-card">
        <p class="diagnosis-step">質問 ${state.step + 1} / ${questions.length}</p>
        <h3 class="diagnosis-title">${escapeHtml(question.title)}</h3>
        <div class="diagnosis-options">
          ${question.options.map(opt => `
            <button type="button" class="diagnosis-option" data-key="${question.key}" data-label="${escapeHtml(opt.label)}" data-value="${opt.value}">
              ${escapeHtml(opt.label)}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    container.querySelectorAll('.diagnosis-option').forEach(btn => {
      btn.addEventListener('click', () => {
        state.answers[question.key] = {
          label: btn.dataset.label,
          score: Number(btn.dataset.value)
        };
        state.step += 1;
        renderCurrentStep();
      });
    });
  }

  // ============================================================
  // リードフォームレンダリング
  // ============================================================
  function renderLeadForm() {
    const result = calculateResult();

    container.innerHTML = `
      <div class="diagnosis-card">
        <p class="diagnosis-step">入力はこれで完了です</p>
        <h3 class="diagnosis-title">診断結果を受け取るための情報をご入力ください</h3>
        <p class="diagnosis-result-preview">想定結果：${escapeHtml(result.result_label)}</p>

        <form id="diagnosis-lead-form" class="diagnosis-form">
          <label style="display:block; margin-bottom:16px;">
            お名前
            <input type="text" name="name" required placeholder="例：山田 太郎" style="display:block; width:100%; margin-top:8px;">
          </label>

          <label style="display:block; margin-bottom:16px;">
            メールアドレス
            <input type="email" name="email" required placeholder="example@example.com" style="display:block; width:100%; margin-top:8px;">
            <p id="email-error" style="display:none; color:#e53e3e; font-size:0.875rem; margin-top:4px;">
              有効なメールアドレスを入力してください（例：example@gmail.com）
            </p>
          </label>

          <button type="submit" class="btn btn-primary btn-lg">診断結果を受け取る</button>
        </form>

        <p id="diagnosis-status" style="margin-top:16px;"></p>
      </div>
    `;

    document.getElementById('diagnosis-lead-form').addEventListener('submit', submitDiagnosis);
  }

  // ============================================================
  // 送信処理
  // ============================================================
  async function submitDiagnosis(event) {
    event.preventDefault();

    // ---- ① メール形式チェック ----
    const emailInput  = event.currentTarget.querySelector('input[name="email"]');
    const emailErrorEl = document.getElementById('email-error');
    const emailVal    = emailInput ? emailInput.value.trim() : '';

    if (!isValidEmail_(emailVal)) {
      if (emailErrorEl) emailErrorEl.style.display = 'block';
      return;
    }
    if (emailErrorEl) emailErrorEl.style.display = 'none';

    // ---- ② 送信ボタンを即座に disabled（二重送信防止）----
    const submitBtn = event.currentTarget.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '送信中...';
    }

    const form     = event.currentTarget;
    const statusEl = document.getElementById('diagnosis-status');
    const formData = new FormData(form);
    const result   = calculateResult();

    const payload = {
      lead_id:              generateLeadId(),
      name:                 formData.get('name'),
      email:                emailVal,
      assignment_status:    state.answers.assignment_status?.label  || '',
      english_level:        state.answers.english_level?.label      || '',
      negotiation_level:    state.answers.negotiation_level?.label  || '',
      field_issue_level:    state.answers.field_issue_level?.label  || '',
      family_support_level: state.answers.family_support_level?.label || '',
      priority_issue:       state.answers.priority_issue?.label     || '',
      total_score:          result.total_score,
      result_rank:          result.result_rank,
      result_label:         result.result_label,
      recommended_action:   result.recommended_action,
      diagnosis_type:       'overseas-assignment-prep',
      utm_source:           state.meta.utm_source,
      utm_medium:           state.meta.utm_medium,
      utm_campaign:         state.meta.utm_campaign,
      lp_page:              state.meta.lp_page,
      referrer:             state.meta.referrer,
      user_agent:           state.meta.user_agent,
      raw_answers:          state.answers,
      form_sync_enabled:    !!config.formSyncEnabled
    };

    statusEl.textContent = '送信中です…';

    try {
      const encodedPayload = 'payload=' + encodeURIComponent(JSON.stringify(payload));

      const response = await fetch(config.gasEndpoint, {
        method:   'POST',
        headers:  { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body:     encodedPayload,
        redirect: 'follow'
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('レスポンスのJSONパース失敗:', responseText);
        throw new Error('サーバーからの応答を解析できませんでした');
      }

      if (!data.ok) {
        throw new Error(data.message || '送信に失敗しました');
      }

      renderComplete(data.result || result);

    } catch (error) {
      console.error(error);
      statusEl.textContent = '送信に失敗しました。時間をおいて再度お試しください。';

      // ---- ③ エラー時はボタンを再有効化（リトライ可能にする）----
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '診断結果を受け取る';
      }
    }
  }

  // ============================================================
  // 完了画面レンダリング
  // ============================================================
  function renderComplete(result) {
    container.innerHTML = `
      <div class="diagnosis-card diagnosis-complete">
        <p class="diagnosis-step">送信完了</p>
        <h3 class="diagnosis-title">診断結果の受け付けが完了しました</h3>
        <p class="diagnosis-result-preview">診断結果：${escapeHtml(result.result_label)}</p>
        <p>${escapeHtml(result.recommended_action)}</p>
        <div style="margin-top:20px;">
          <a href="#contact" class="btn btn-primary">個別相談について見る</a>
        </div>
      </div>
    `;
  }

  // ============================================================
  // スコア計算
  // ============================================================
  function calculateResult() {
    const total = Object.values(state.answers).reduce((sum, item) => sum + Number(item.score || 0), 0);

    if (total >= 22) {
      return {
        total_score:        total,
        result_rank:        'A',
        result_label:       '赴任前の重点準備が必要な状態',
        recommended_action: '英語・交渉・現場対応・家族支援を含め、優先順位を整理した個別計画の作成をおすすめします。'
      };
    }

    if (total >= 16) {
      return {
        total_score:        total,
        result_rank:        'B',
        result_label:       '早めの整理で負荷を下げやすい状態',
        recommended_action: 'まずは負荷の高い場面を絞り込み、出国前6〜8か月の行動計画に落とし込むのがおすすめです。'
      };
    }

    return {
      total_score:        total,
      result_rank:        'C',
      result_label:       '基礎整理から始めれば十分間に合う状態',
      recommended_action: '現状把握と優先順位づけから始めることで、無理なく準備を進められます。'
    };
  }

  // ============================================================
  // ユーティリティ
  // ============================================================
  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name) || '';
  }

  function generateLeadId() {
    return 'lead_' + Date.now() + Math.random().toString(36).slice(2, 8);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#039;');
  }

})();
