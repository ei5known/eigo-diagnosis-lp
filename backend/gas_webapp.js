/**
 * 英語脳育成塾 - AI海外赴任サバイバル力診断 GAS Backend (スプレッドシート連携版)
 * 
 * デプロイ手順:
 * 1. 診断結果を蓄積したい「スプレッドシート」を作成、または開く
 * 2. メニューの「拡張機能」>「Apps Script」をクリック
 * 3. このコードをエディタに全て貼り付け（既存のコードは削除）
 * 4. 左側の歯車（プロジェクトの設定）を開き、スクリプト プロパティを追加
 *    - プロパティ: GEMINI_API_KEY / 値: (お持ちのGemini APIキー)
 * 5. 右上の「デプロイ」>「新しいデプロイ」をクリック
 *    - 種類の選択: 「ウェブアプリ」
 *    - アクセスできるユーザー: 「全員」
 * 6. 発行された「ウェブアプリのURL」をコピーし、LPの diagnosis.js に貼り付ける
 */

function doPost(e) {
  try {
    // 1. JSONデータの受け取り
    const data = JSON.parse(e.postData.contents);
    
    const country = data.country || "未入力";
    const role = data.role || "未入力";
    const timing = data.timing || "未定";
    const q1 = data.q1 || "記載なし";
    const q2 = data.q2 || "記載なし";
    const q3 = data.q3 || "記載なし";
    const email = data.email;

    if (!email) {
      return createResponse({ success: false, message: "Email is required" });
    }

    // 2. Gemini APIの設定を取得
    const GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set.");
    }
    
    // 3. プロンプト生成
    const prompt = `あなたは海外赴任・異文化マネジメントのエキスパートです。以下の診断回答に基づき、4つの視点でフィードバックを作成してください。
相手は「${country}」へ「${timing}」に赴任予定の「${role}」です。
端的にプロフェッショナルなトーンで記述してください。

Q1: ${q1} / Q2: ${q2} / Q3: ${q3}

【出力のトーン】鋭く本質を突きつつ、個別相談への必要性を感じさせる内容にしてください。`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
    const payload = {
      "contents": [{"parts": [{"text": prompt}]}],
      "generationConfig": { "temperature": 0.3, "maxOutputTokens": 1000 }
    };
    
    const options = {
      "method": "post",
      "contentType": "application/json",
      "payload": JSON.stringify(payload),
      "muteHttpExceptions": true
    };
    
    // 4. Geminiへのリクエスト実行
    const res = UrlFetchApp.fetch(apiUrl, options);
    const code = res.getResponseCode();
    let aiFeedback = "AIの診断結果を生成できませんでした。";
    
    if (code === 200) {
      const json = JSON.parse(res.getContentText());
      aiFeedback = json.candidates[0].content.parts[0].text;
    } else {
      console.error("Gemini API Error:", res.getContentText());
      aiFeedback = "診断セッションは正常に完了しましたが、現在詳細な分析レポートの自動生成に制限がかかっています。個別面談にて詳細をお伝え可能です。";
    }
    
    // 5. 【追加】スプレッドシートへの記録
    // バインドされているスプレッドシートの最初のシートにデータを追記
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      sheet.appendRow([
        new Date(), // タイムスタンプ
        country,
        role,
        timing,
        q1,
        q2,
        q3,
        email,
        aiFeedback.substring(0, 1000) // 文字数制限対策
      ]);
    } catch (err) {
      console.error("Spreadsheet Logging Error:", err);
    }
    
    // 6. メール送信
    const subject = `【英語脳育成塾】AI海外赴任サバイバル力 診断結果レポート`;
    const body = `海外赴任サバイバル力診断へのご回答ありがとうございます。\n\n■ AI分析フィードバック\n${aiFeedback}\n\n■ 次のステップ：個別ロードマップ作成（無料）\nhttps://calendar.app.google/pWNRChbYKAPBmbCk6\n\n英語脳育成塾`;
    
    GmailApp.sendEmail(email, subject, body, { name: '英語脳育成塾 - 診断チーム' });
    
    // 7. レスポンス返却
    return createResponse({ success: true, message: "Success" });

  } catch (err) {
    console.error(err);
    return createResponse({ success: false, message: err.toString() });
  }
}

// OPTIONSリクエスト用（CORS対応）
function doOptions(e) {
  return createResponse("OK");
}

// 共通レスポンス生成関数（CORSヘッダー付与）
function createResponse(data) {
  const output = ContentService.createTextOutput(typeof data === 'string' ? data : JSON.stringify(data));
  output.setMimeType(typeof data === 'string' ? ContentService.MimeType.TEXT : ContentService.MimeType.JSON);
  return output;
}
