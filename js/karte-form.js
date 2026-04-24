/**
 * karte-form.js  v2.0
 * 事前カルテフォーム送信処理 + Googleカレンダー STEP 切り替え
 * 使用ページ: booking.html
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
    // ステップインジケーター更新
    if (dot1) { dot1.classList.remove('active'); dot1.classList.add('done'); dot1.textContent = '✓'; }
    if (dot2) { dot2.classList.add('active'); }

    // STEP1非表示 → STEP2表示
    if (stepKarte)  stepKarte.style.display  = 'none';
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
    const lastName  = String(fd.get('last_name')  || '').trim();
    const firstName = String(fd.get('first_name') || '').trim();
    const email     = String(fd.get('email')      || '').trim();

    if (!lastName)            { showStatus('姓を入力してください。', 'error'); return; }
    if (!firstName)           { showStatus('名を入力してください。', 'error'); return; }
    if (!isValidEmail(email)) { showStatus('メールアドレスの形式が正しくありません。', 'error'); return; }

    submitBtn.disabled    = true;
    submitBtn.textContent = '送信中...';
    showStatus('送信しています。しばらくお待ちください。', 'info');

    const karteData = {
      karte_type:       'pre_consultation',
      last_name:        lastName,
      first_name:       firstName,
      email:            email,
      q1_concern:       String(fd.get('q1_concern')       || '').trim(),
      q2_english_level: String(fd.get('q2_english_level') || '').trim(),
      q3_family:        String(fd.get('q3_family')        || '').trim(),
      q4_hours:         String(fd.get('q4_hours')         || '').trim(),
      q5_budget:        String(fd.get('q5_budget')        || '').trim(),
      submitted_at:     new Date().toISOString(),
      lp_page:          window.location.href,
    };

    // GAS にカルテデータを保存（失敗してもカレンダーへ進む）
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
      } catch (err) {
        console.warn('karte save failed (non-blocking):', err);
      }
    }

    showStatus('', '');
    transitionToCalendar();
  });

})();
