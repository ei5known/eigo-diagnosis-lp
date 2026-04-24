/**
 * karte-form.js
 * 事前カルテフォームの送信処理 + Googleカレンダー予約ステップ表示
 *
 * 設定方法:
 *   1. Googleカレンダーで「予約スケジュール」を作成する
 *   2. 「共有」→「ウェブサイトに埋め込む」→ スケジュールURLを取得する
 *      URL形式: https://calendar.google.com/calendar/appointments/schedules/XXXXXXXX
 *   3. window.BOOKING_CONFIG の calendarScheduleUrl にそのURLを設定する
 *   4. GASのエンドポイント（事前カルテデータ保存用）を karteGasEndpoint に設定する
 */

(function () {
  'use strict';

  // ─────────────────────────────────────────────
  // 設定（index.html の <script> で上書き可能）
  // ─────────────────────────────────────────────
  const config = Object.assign({
    karteGasEndpoint: '',          // GAS エンドポイントURL（事前カルテ保存用）
    calendarScheduleUrl: '',       // Google Calendar 予約スケジュールURL
    calendarEmbedHeight: '700',    // iframe の高さ（px）
  }, window.BOOKING_CONFIG || {});

  const form         = document.getElementById('karte-form');
  const submitBtn    = document.getElementById('karte-submit-btn');
  const statusEl     = document.getElementById('karte-status');
  const karteStep    = document.getElementById('booking-karte-step');
  const calendarStep = document.getElementById('booking-calendar-step');
  const embedContainer = document.getElementById('calendar-embed-container');
  const directLink   = document.getElementById('calendar-direct-link');

  if (!form) return;

  // ─────────────────────────────────────────────
  // ユーティリティ
  // ─────────────────────────────────────────────
  function showStatus(msg, type) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = 'diagnosis-status' + (type ? ' is-' + type : '');
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim());
  }

  // ─────────────────────────────────────────────
  // カレンダー埋め込みを注入する
  // ─────────────────────────────────────────────
  function injectCalendar() {
    if (!embedContainer) return;

    if (config.calendarScheduleUrl) {
      // iframeで埋め込む
      const src = config.calendarScheduleUrl.includes('?')
        ? config.calendarScheduleUrl + '&gv=true'
        : config.calendarScheduleUrl + '?gv=true';

      embedContainer.innerHTML =
        '<iframe src="' + src + '"' +
        ' width="100%" height="' + config.calendarEmbedHeight + '"' +
        ' frameborder="0" style="border:0; border-radius:16px; overflow:hidden;"' +
        ' allowfullscreen loading="lazy"' +
        ' title="無料個別相談 予約カレンダー"></iframe>';

      // 直接リンクボタンも表示
      if (directLink) {
        directLink.href = config.calendarScheduleUrl;
        directLink.style.display = 'inline-flex';
      }
    } else {
      // URLが未設定の場合はプレースホルダーを残す
      if (directLink) directLink.style.display = 'none';
    }
  }

  // ─────────────────────────────────────────────
  // STEP1 → STEP2 への遷移
  // ─────────────────────────────────────────────
  function transitionToCalendar() {
    // 事前カルテを非表示
    if (karteStep) karteStep.style.display = 'none';

    // カレンダーSTEPを表示
    if (calendarStep) {
      calendarStep.style.display = 'block';
      // スクロールして見せる
      setTimeout(function () {
        calendarStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }

    injectCalendar();
  }

  // ─────────────────────────────────────────────
  // フォーム送信処理
  // ─────────────────────────────────────────────
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const fd = new FormData(form);
    const lastName  = String(fd.get('last_name') || '').trim();
    const firstName = String(fd.get('first_name') || '').trim();
    const email     = String(fd.get('email') || '').trim();

    // バリデーション
    if (!lastName)          { showStatus('姓を入力してください。', 'error'); return; }
    if (!firstName)         { showStatus('名を入力してください。', 'error'); return; }
    if (!isValidEmail(email)) { showStatus('メールアドレスの形式が正しくありません。', 'error'); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = '送信中...';
    showStatus('送信しています。しばらくお待ちください。', 'info');

    const karteData = {
      karte_type: 'pre_consultation',
      last_name:  lastName,
      first_name: firstName,
      email:      email,
      q1_concern:       String(fd.get('q1_concern') || '').trim(),
      q2_english_level: String(fd.get('q2_english_level') || '').trim(),
      q3_family:        String(fd.get('q3_family') || '').trim(),
      q4_hours:         String(fd.get('q4_hours') || '').trim(),
      q5_budget:        String(fd.get('q5_budget') || '').trim(),
      submitted_at: new Date().toISOString(),
      lp_page: window.location.href,
    };

    // GASエンドポイントが設定されていれば保存を試みる
    if (config.karteGasEndpoint) {
      try {
        const body = 'payload=' + encodeURIComponent(JSON.stringify(karteData));
        const res = await fetch(config.karteGasEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body: body,
          redirect: 'follow',
        });
        const text = await res.text();
        const json = JSON.parse(text);
        if (!json.ok) {
          console.warn('karte save warning:', json.message);
        }
      } catch (err) {
        // 保存失敗してもカレンダーステップには進む（UXを止めない）
        console.warn('karte save failed (non-blocking):', err);
      }
    }

    // カレンダーステップへ
    showStatus('', '');
    transitionToCalendar();
  });

})();
