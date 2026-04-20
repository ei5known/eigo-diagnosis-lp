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
      opt
