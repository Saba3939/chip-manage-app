# チップ管理アプリ 開発ガイド

## プロジェクト概要
リアルで行うポーカーゲームやトランプゲームのチップをデジタル管理するアプリです。
チップの送受信、残高管理、清算機能を提供し、スムーズなゲーム進行を実現します。

## 技術スタック

### フロントエンド
- **フレームワーク**: Next.js 14+ (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **UIコンポーネント**: shadcn/ui
- **QR機能**:
  - 生成: `qrcode.react`
  - 読み取り: `html5-qrcode`

### バックエンド
- **BaaS**: Supabase
  - Authentication（メール/パスワード、Google OAuth）
  - PostgreSQL Database
  - Realtime Subscriptions
  - RPC Functions（トランザクション処理）

### デプロイ
- **ホスティング**: Vercel

## ディレクトリ構造

```
new-point-app/
├── app/                      # Next.js App Router
│   ├── (auth)/              # 認証関連ページ
│   │   ├── login/
│   │   └── register/
│   ├── (main)/              # メインアプリ
│   │   ├── dashboard/       # ダッシュボード
│   │   ├── session/         # セッション管理
│   │   │   ├── create/      # セッション作成
│   │   │   ├── [id]/        # セッション詳細
│   │   │   └── join/[id]/   # セッション参加
│   │   └── history/         # 履歴閲覧
│   ├── api/                 # API Routes
│   └── layout.tsx
├── components/              # Reactコンポーネント
│   ├── ui/                  # shadcn/ui コンポーネント
│   ├── session/             # セッション関連
│   ├── chip/                # チップ送受信UI
│   └── qr/                  # QRコード関連
├── lib/                     # ユーティリティ
│   ├── supabase/            # Supabase クライアント
│   │   ├── client.ts        # クライアント側
│   │   ├── server.ts        # サーバー側
│   │   └── database.types.ts # DB型定義
│   └── utils.ts
├── hooks/                   # カスタムフック
│   ├── useSession.ts
│   ├── useBalance.ts
│   └── useRealtime.ts
├── types/                   # TypeScript型定義
└── docs/                    # ドキュメント
```

## データベース設計

### テーブル構成

#### users (Supabase Auth管理)
- `id` (UUID, PK)
- `email` (string)
- `display_name` (string)

#### sessions
- `id` (UUID, PK)
- `host_user_id` (UUID, FK → users.id)
- `name` (string, nullable)
- `initial_chips` (integer, default: 1000)
- `max_participants` (integer, default: 10)
- `rate` (integer, nullable) ※1チップあたりの円換算レート
- `status` (enum: 'waiting' | 'active' | 'completed')
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### session_participants
- `id` (UUID, PK)
- `session_id` (UUID, FK → sessions.id)
- `user_id` (UUID, FK → users.id)
- `joined_at` (timestamp)
- UNIQUE制約: (session_id, user_id)

#### balances
- `id` (UUID, PK)
- `session_id` (UUID, FK → sessions.id)
- `user_id` (UUID, FK → users.id)
- `amount` (integer)
- `updated_at` (timestamp)
- UNIQUE制約: (session_id, user_id)

#### transactions
- `id` (UUID, PK)
- `session_id` (UUID, FK → sessions.id)
- `from_user_id` (UUID, FK → users.id)
- `to_user_id` (UUID, FK → users.id)
- `amount` (integer)
- `created_at` (timestamp)

### RPC Functions
以下のトランザクション処理をSupabase RPC Functionで実装：

#### `transfer_chips(session_id, from_user_id, to_user_id, amount)`
- 送信者の残高確認
- 送信者の残高を減算
- 受取人の残高を加算
- transactionsテーブルに記録
- エラー時はロールバック

## コーディング規約

### 一般
- コードコメントは日本語を推奨
- 関数・変数名は英語（わかりやすい命名を心がける）
- ESLintとPrettierの設定に従う
- 極力絵文字を使わずlucide-reactを用いる

### TypeScript
- 型は明示的に定義する
- `any`の使用は避け、適切な型を指定
- Supabaseの型定義を活用

### React/Next.js
- Server Componentsを優先的に使用
- Client Componentsは必要な場合のみ（`'use client'`を明示）
- カスタムフックで状態管理とロジックを分離
- エラーハンドリングを適切に実装

### スタイリング
- Tailwind CSSのユーティリティクラスを使用
- shadcn/uiコンポーネントをベースに構築
- モバイルファースト設計

## 開発フロー

### Phase 1: MVP（基本機能）
1. Supabaseプロジェクトセットアップ
2. 認証機能（ログイン・登録）
3. セッション作成・参加（QR対応）
4. チップ送受信機能
5. 残高リアルタイム表示

### Phase 2: 清算機能
1. セッション終了処理
2. 清算額計算・表示
3. 履歴保存機能

### Phase 3: 改善
1. 履歴閲覧機能
2. 統計情報表示
3. UI/UX改善

## 重要な実装ポイント

### リアルタイム更新
- Supabase Realtime Subscriptionsを使用
- `balances`テーブルの変更を購読
- useEffectでサブスクリプション管理
- コンポーネントのクリーンアップを忘れずに

### セキュリティ
- Row Level Security (RLS)を必ず設定
- 送受信処理はRPC Functionでサーバーサイド検証
- 認証されたユーザーのみアクセス可能に
- セッション参加は招待制（QR/ID経由のみ）

### エラーハンドリング
- オフライン時の適切なエラー表示
- 残高不足時のバリデーション
- 誤操作防止の確認ダイアログ
- ネットワークエラーのリトライ処理

### パフォーマンス
- リアルタイム更新の遅延: 1秒以内を目指す
- QRコード読み取り: 2秒以内
- 不要な再レンダリングを避ける（React.memo、useMemo活用）



## 懸念事項

### 現在の課題
- ネットワーク不安定時の対応
- 誤送信の取り消し機能の必要性
- 参加者の途中退出時の残高扱い

### 将来的な拡張
- グループ機能（定期メンバー管理）
- ゲーム履歴の統計・分析
- トーナメント形式のサポート
- 他のカードゲームへの対応

## テスト

### 単体テスト
- RPC Functionのロジックテスト
- ユーティリティ関数のテスト

### 統合テスト
- 送受信フローのテスト
- セッション作成〜終了までのフロー

### E2Eテスト
- 主要なユーザーフローをカバー

## デバッグ

### よくある問題
1. **Realtimeが動作しない**
   - RLSポリシーを確認
   - サブスクリプションの設定を確認

2. **トランザクションエラー**
   - 残高確認のロジックを確認
   - RPC Functionのエラーログを確認

3. **QRコード読み取り失敗**
   - カメラ権限を確認
   - URLの形式を確認

## 参考リンク
- [Next.js ドキュメント](https://nextjs.org/docs)
- [Supabase ドキュメント](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
