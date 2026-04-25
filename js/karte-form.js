/**
 * karte-form.js  v4.0
 * 事前カルテフォーム送信処理 + Googleカレンダー STEP 切り替え
 * 使用ページ: booking.html
 *
 * CHANGE LOG
 * v2.0  2026-04-24  初版リリース（カルテ送信 + カレンダー遷移）
 * v3.0  2026-04-25  GAS v4.0.0 対応
 *   - form_type: 'karte' を追加
 *   - name / firstChoiceDatetime / secondChoiceDatetime フィールドを追加
 *   - sessionType: 'google_meet' を明示
 * v4.0  2026-04-25  氏名・法人名・部署名・メール入力フィールド対応
 *   - 変更理由: booking.htmlに氏名/法人名/部署名/メールフィールドを新規追加
 *   - email フィールドを email_input（新フィールドID）から取得に変更
 *   - company_name / department_name フィールドを送信データに追加
 *   - バリデーションに法人名・部署名・メールのチェックを追加
 */
(function () {
  'use strict';

  const config = Object.assign({
    karteGasEndpoint: '',
  }, window.BOOKING_CONFIG || {});

  const form        = document.getElementById('karte-form');
  const submitBtn   = document.getElementById('karte-submit-btn');
  const statusEl    = document.getElementById('karte-status');
  const stepKarte   = document.getElementById('step-karte');
  const stepCal     = document.getElementById('step-calendar');
  const dot1        = document.getElementById('bsi-dot-1');
  const dot2        = document.getElementById('bsi-dot-2');

  if (!form) return;

  function showStatus(msg, type) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = 'diagnosis-status' + (type ? ' is-' + type : '');
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim());
  }

  function transitionToCalendar() {
    if (dot1) { dot1.classList.remove('active'); dot1.classList.add('done'); dot1.textContent = '✓'; }
    if (dot2) { dot2.classList.add('active'); }

    if (stepKarte) stepKarte.style.display = 'none';
    if (stepCal) {
      stepCal.style.display = 'block';
      setTimeout(function () {
        stepCal.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const fd = new FormData(form);

    // v4.0: 氏名・法人名・部署名・メールを取得
    const lastName      = String(fd.get('last_name')       || '').trim();
    const firstName     = String(fd.get('first_name')      || '').trim();
    const companyName   = String(fd.get('company_name')    || '').trim();
    const departmentName = String(fd.get('department_name') || '').trim();
    const email         = String(fd.get('email_input')     || '').trim(); // v4.0: email_input に変更

    // バリデーション
    if (!lastName)             { showStatus('姓を入力してください。',           'error'); return; }
    if (!firstName)            { showStatus('名を入力してください。',           'error'); return; }
    if (!companyName)          { showStatus('法人名（会社名）を入力してください。', 'error'); return; }
    if (!departmentName)       { showStatus('部署名を入力してください。',         'error'); return; }
    if (!isValidEmail(email))  { showStatus('メールアドレスの形式が正しくありません。', 'error'); return; }

    submitBtn.disabled    = true;
    submitBtn.textContent = '送信中...';
    showStatus('送信しています。しばらくお待ちください。', 'info');

    const karteData = {
      form_type:           'karte',
      karte_type:          'pre_consultation',
      name:                lastName + ' ' + firstName,   // フルネーム（GASメール用）
      last_name:           lastName,
      first_name:          firstName,
      company_name:        companyName,                  // v4.0 追加: 法人名
      department_name:     departmentName,               // v4.0 追加: 部署名
      email:               email,
      q1_role:             String(fd.get('q1_role')     || '').trim(),
      q2_team:             String(fd.get('q2_team')     || '').trim(),
      q3_experience:       String(fd.get('q3_experience') || '').trim(),
      q4_hours:            String(fd.get('q4_hours')    || '').trim(),
      q5_budget:           String(fd.get('q5_budget')   || '').trim(),
      sessionType:             'google_meet',
      firstChoiceDatetime:     String(fd.get('firstChoiceDatetime')  || '').trim(),
      secondChoiceDatetime:    String(fd.get('secondChoiceDatetime') || '').trim(),
      submitted_at:        new Date().toISOString(),
      lp_page:             window.location.href,
    };

    if (config.karteGasEndpoint) {
      try {
        const body = 'payload=' + encodeURIComponent(JSON.stringify(karteData));
        const res  = await fetch(config.karteGasEndpoint, {
          method:   'POST',
          headers:  { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body:     body,
          redirect: 'follow',
        });
        const json = JSON.parse(await res.text());
        if (!json.ok) console.warn('karte save warning:', json.message);
        else console.log('karte saved ok — booking confirm email sent');
      } catch (err) {
        console.warn('karte save failed (non-blocking):', err);
      }
    }

    showStatus('', '');
    transitionToCalendar();
  });

})();
