# Eigo Diagnosis LP Project

## Project Overview

This project is a Google Apps Script (GAS) powered landing page for English diagnosis.

## Operational Guide

### Code Management Policy

**IMPORTANT:** Due to recurring issues with `clasp` synchronization, the following code management policy has been established:

1.  **Source of Truth:** The primary sources of truth for the codebase are:
    *   GitHub Repository
    *   Google Apps Script (GAS) Editor (browser-based)

2.  **Synchronization:** Manual synchronization is required. After making changes locally, ensure they are copied and pasted into the GAS Editor. Similarly, if changes are made directly in the GAS Editor, they should be pulled and updated in the local GitHub repository.

### 運用ガイド (Operations Guide)

このセクションでは、本システムの円滑な運用をサポートするための情報を提供します。

#### デイリーチェックリスト

毎日以下の項目を確認してください。

*   **スプレッドシートの「決済済み」数:** 連携しているスプレッドシートの「決済済み」ステータスの数が、想定される件数と一致しているか確認してください。
*   **GAS実行ログのエラー:** Google Apps Script (GAS) の実行ログにエラーが発生していないか確認してください。
    *   GASプロジェクトを開き、「実行」タブからログを確認できます。
*   **error_logs シートの確認:** エラー発生時に記録されるスプレッドシートの `error_logs` シートに新しいエラーが記録されていないか確認してください。

#### トラブルシューティング

決済がシステムに反映されない場合、以下の手順でトラブルシューティングを行ってください。

1.  **PayPalダッシュボードの確認:** まず、PayPalダッシュボードで該当の決済が成功しているか確認してください。
    *   PayPal側で決済が失敗している場合、ユーザーに直接連絡して再決済を促してください。
2.  **GAS実行ログの確認:** PayPal側で決済が成功しているにも関わらずシステムに反映されない場合、GASの実行ログを確認してください。
    *   特定の決済IDで検索し、関連する実行履歴とエラーメッセージを確認します。
3.  **GASの `error_logs` シートの確認:** `error_logs` シートに決済処理に関するエラーが記録されていないか確認してください。

#### 運用ルール

*   **決済ステータスの「真のマスター」はPayPalです:** システム内の決済ステータスに疑義が生じた場合、常にPayPalダッシュボードの情報が正となります。PayPalの情報を元にシステム内のデータを修正してください。
*   **90日経過後のデータ自動削除 (PII管理):** 個人情報保護のため、90日経過した決済データは自動的に削除される仕組みが導入されています。この機能が正常に動作していることを定期的に確認してください。
    *   確認方法: 削除されるべき古いデータがスプレッドシートに残っていないか、またはGASの実行ログで削除処理が正常に完了しているかを確認します.

3.  **Deployment:** Deployments should be managed directly from the Google Apps Script Editor.

### Deployment Information

**Current Web App URL:** https://script.google.com/macros/s/AKfycbzfteLwuZlSm0nzVVlvL1V44Rb5gqAuHAhPAUJbE2mIXg9xzd59B_p1iV7vOIyb4H1s/exec

## Local Development Setup (Deprecated for Synchronization)

While `clasp` is used for initial project setup and local file structure, it is **no longer used for code synchronization (push/pull)**.

## Future Development

Future tasks will focus on logic improvements and content creation, with code synchronization handled manually as per the 