function testPayPalWebhook() {
  // ダミーのPAYMENT.SALE.COMPLETEDペイロードを作成
  const dummyPayload = {
    event_type: "PAYMENT.SALE.COMPLETED",
    resource: {
      id: "dummy_transaction_id_123",
      amount: {
        total: "10.00",
        currency: "USD"
      },
      create_time: new Date().toISOString(),
      parent_payment: "dummy_parent_payment_id",
      // その他の必要なペイロードデータ
    }
  };

  // eオブジェクトを模倣
  const e = {
    postData: {
      contents: JSON.stringify(dummyPayload),
      type: "application/json"
    },
    parameter: {
      path: "paypal_webhook"
    }
  };

  Logger.log("Calling handlePayPalWebhook with dummy payload...");
  const result = handlePayPalWebhook(e);
  Logger.log("handlePayPalWebhook returned: " + result.getContent());
  // スプレッドシートが更新されたか確認するロジックを追加（例：Logger.logで確認メッセージを出力）
  Logger.log("Please check the spreadsheet manually to verify the update.");
}

function debugVerifyPayPalPaymentStatus(transactionId) {
  Logger.log("Attempting to verify PayPal payment status for transaction ID: " + transactionId);
  // 外部APIとの通信テストのロジックをここに実装
  // 例: PayPal APIを呼び出してトランザクションの状態を取得
  // この関数は主に開発中に特定のトランザクションの状態を確認するために使用されます。
  Logger.log("This function is for testing external API communication. Implementation details for PayPal API call go here.");
}
