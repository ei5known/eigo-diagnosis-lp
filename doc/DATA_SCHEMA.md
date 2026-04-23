{
  "metadata": {
    "diagnosisId": "lead-20260424080000-12345",
    "schemaVersion": "1.1",
    "timestamp": "2026-04-24T08:00:00Z",
    "diagnosisType": "overseas-assignment-prep"
  },
  "user": {
    "userId": null,  // ログイン実装時に使用
    "name": "海外 太郎",
    "email": "taro.kaigai@example.com",
    "preferences": {
      "formSyncEnabled": true
    }
  },
  "diagnosis": {
    "scoring": {
      "totalScore": 18,
      "finalRank": "B"
    },
    "segments":[
      "status_confirmed",     // 赴任確定済み
      "high_english_anxiety", // 英語への不安大
      "family_accompanied"    // 家族帯同の課題あり
    ],
    "answers":[
      {
        "questionId": "assignment_status",
        "choiceId": "q1_c4",
        "score": 4,
        "label": "赴任が正式に決まっている"
      },
      {
        "questionId": "english_level",
        "choiceId": "q2_c4",
        "score": 4,
        "label": "かなり不安がある"
      },
      // ... 他の設問も同様に配列で保持
      {
        "questionId": "priority_issue",
        "choiceId": "q6_c1",
        "score": 4,
        "label": "英語力"
      }
    ],
    "staticResult": {
      "label": "早めの整理で負荷を下げやすい状態",
      "recommendedAction": "まずは負荷の高い場面を絞り込み、出国前6〜8か月の行動計画に落とし込むのがおすすめです。"
    }
  },
  "context": {
    "tracking": {
      "utmSource": "google",
      "utmMedium": "cpc",
      "utmCampaign": "spring_sale"
    },
    "client": {
      "lpPage": "https://example.com/lp/",
      "userAgent": "Mozilla/5.0..."
    }
  },
  "security": {
    "recaptchaToken": "03AFcWeA5...",
    "recaptchaAction": "submit_diagnosis"
  }
}
