# Task 17: デプロイ設定

## 目的
Vercelへのデプロイを設定し、本番環境を構築する。

## 実装内容

### 1. Vercelプロジェクトのセットアップ

**Vercelアカウント作成**
- Vercelにサインアップ
- GitHubアカウントと連携

**プロジェクトのインポート**
- GitHubリポジトリをVercelにインポート
- プロジェクト名の設定
- フレームワークの自動検出（Next.js）

### 2. 環境変数の設定

**Vercelダッシュボード**
- Settings → Environment Variables

**必要な環境変数**
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# アプリケーション
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**環境ごとの設定**
- Production
- Preview
- Development

### 3. ビルド設定

**`vercel.json`（必要に応じて）**
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["hnd1"]  // 東京リージョン
}
```

**`next.config.js`の最適化**
- 画像最適化の設定
- リダイレクト設定
- セキュリティヘッダー

### 4. ドメイン設定

**カスタムドメイン（オプション）**
- ドメインの追加
- DNS設定
- SSL証明書の自動設定

**Vercel提供ドメイン**
- `your-app.vercel.app`
- 自動的にHTTPS対応

### 5. Supabase本番環境の設定

**プロダクション設定**
- Supabaseプロジェクトの本番設定確認
- RLSポリシーの最終確認
- Realtimeの設定確認
- OAuth設定（リダイレクトURL追加）

**リダイレクトURL**
- `https://your-app.vercel.app/auth/callback`
- Vercelのプレビュー用: `https://*.vercel.app/auth/callback`

### 6. パフォーマンス最適化

**Next.js最適化**
- 静的生成の活用
- 画像最適化（next/image）
- フォント最適化
- バンドルサイズの削減

**キャッシング戦略**
- ISR（Incremental Static Regeneration）の設定
- CDNキャッシュの活用
- Supabaseキャッシュの設定

### 7. モニタリング・分析

**Vercel Analytics**
- Vercel Analyticsの有効化
- パフォーマンス監視
- エラー追跡

**Supabase監視**
- ダッシュボードでの監視
- クエリパフォーマンス確認
- API使用状況確認

**外部ツール（オプション）**
- Sentry（エラートラッキング）
- Google Analytics

### 8. CI/CDパイプライン

**GitHub Actions設定**
`.github/workflows/deploy.yml`

**自動デプロイフロー**
1. プルリクエスト作成
2. テスト自動実行
3. プレビューデプロイ
4. レビュー・承認
5. mainブランチにマージ
6. 本番デプロイ

**ブランチ戦略**
- `main` → 本番環境
- `develop` → プレビュー環境
- feature branches → プレビュー環境

### 9. セキュリティ設定

**セキュリティヘッダー**
- CSP (Content Security Policy)
- HSTS
- X-Frame-Options
- X-Content-Type-Options

**環境変数の保護**
- `.env.local`をgitignoreに追加
- シークレットの適切な管理
- クライアント公開変数の最小化

### 10. バックアップ・復旧計画

**データベースバックアップ**
- Supabaseの自動バックアップ設定確認
- 手動バックアップの取得方法

**ロールバック計画**
- Vercelのデプロイメント履歴
- 過去のバージョンへの即座のロールバック

### 11. ドキュメント作成

**デプロイ手順書**
- 初回デプロイの手順
- 環境変数の設定方法
- トラブルシューティング

**運用マニュアル**
- モニタリング方法
- エラー対応
- スケーリング対応

## デプロイチェックリスト

### デプロイ前
- [ ] 全テストが通る
- [ ] ビルドエラーがない
- [ ] 環境変数が設定されている
- [ ] Supabase本番環境が設定されている
- [ ] RLSポリシーが有効
- [ ] OAuth設定が完了している

### デプロイ後
- [ ] サイトにアクセスできる
- [ ] 認証が動作する
- [ ] セッション作成が動作する
- [ ] チップ送受信が動作する
- [ ] Realtimeが動作する
- [ ] QRコード機能が動作する（HTTPS必須）
- [ ] モバイルで正常に動作する

## 完了条件
- [ ] Vercelプロジェクトが作成されている
- [ ] 環境変数が設定されている
- [ ] 本番デプロイが成功している
- [ ] ドメインが設定されている
- [ ] 全機能が本番環境で動作する
- [ ] モニタリングが設定されている
- [ ] CI/CDパイプラインが動作している
- [ ] セキュリティ設定が完了している

## 動作確認

### 本番環境テスト
1. 本番URLにアクセス
2. 新規登録
3. セッション作成
4. QRコード表示（HTTPSで動作確認）
5. 別デバイスで参加
6. チップ送受信
7. リアルタイム更新確認
8. セッション終了・清算

### パフォーマンス確認
- Lighthouse スコア確認
- モバイル表示確認
- ネットワーク速度テスト

## トラブルシューティング

### よくある問題

**ビルドエラー**
- 依存パッケージの確認
- TypeScriptエラーの修正
- 環境変数の設定確認

**認証エラー**
- リダイレクトURLの確認
- Supabase設定の確認
- Cookie設定の確認

**Realtimeが動作しない**
- HTTPSで動作しているか確認
- Supabaseの設定確認
- RLSポリシーの確認

**QRコードが読めない**
- HTTPSで動作しているか確認
- カメラ権限の確認

## コマンド

```bash
# ローカルビルド確認
npm run build
npm run start

# Vercel CLI でデプロイ（オプション）
npx vercel
npx vercel --prod
```

## 参考リンク
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)

## プロジェクト完了
全てのタスクが完了し、本番環境にデプロイされました！
