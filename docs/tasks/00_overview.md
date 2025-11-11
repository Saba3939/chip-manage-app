# タスク一覧

## 実装方針
UIから構築し、モックデータで動作を確認しながら段階的にバックエンド機能を追加します。

## タスクの進め方
1. 各タスクは独立して実装・確認可能
2. UIタスク（01-08）を先に完了させ、画面遷移を確認
3. バックエンドタスク（09-14）でSupabaseと連携
4. 各タスク完了後、ブラウザで動作確認を推奨

## Phase 1: UI構築（モックデータ）

### セットアップ
- [01_project_setup.md](01_project_setup.md) - プロジェクト初期設定

### 認証UI
- [02_auth_ui.md](02_auth_ui.md) - ログイン・登録画面

### メイン機能UI
- [03_dashboard_ui.md](03_dashboard_ui.md) - ダッシュボード
- [04_session_create_ui.md](04_session_create_ui.md) - セッション作成画面
- [05_session_join_ui.md](05_session_join_ui.md) - セッション参加画面（QRコード）
- [06_session_detail_ui.md](06_session_detail_ui.md) - セッション詳細画面
- [07_chip_transfer_ui.md](07_chip_transfer_ui.md) - チップ送受信UI
- [08_settlement_ui.md](08_settlement_ui.md) - 清算画面

## Phase 2: バックエンド実装

### Supabase設定
- [09_supabase_setup.md](09_supabase_setup.md) - Supabaseプロジェクト作成・設定

### 機能実装
- [10_auth_implementation.md](10_auth_implementation.md) - 認証機能実装
- [11_session_management.md](11_session_management.md) - セッション管理機能
- [12_realtime_feature.md](12_realtime_feature.md) - リアルタイム更新機能
- [13_chip_transfer.md](13_chip_transfer.md) - チップ送受信機能
- [14_settlement_feature.md](14_settlement_feature.md) - 清算機能

## Phase 3: 改善・最適化

### 追加機能
- [15_history_feature.md](15_history_feature.md) - 履歴閲覧機能
- [16_testing.md](16_testing.md) - テスト実装
- [17_deployment.md](17_deployment.md) - デプロイ設定

## 進捗管理
- [ ] Phase 1: UI構築
- [ ] Phase 2: バックエンド実装
- [ ] Phase 3: 改善・最適化

## 注意事項
- 各タスクには「完了条件」が記載されています
- 動作確認方法も記載しているので、必ず確認してください
- 問題が発生した場合は、該当タスクの「トラブルシューティング」を参照
