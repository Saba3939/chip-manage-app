# Task 09: Supabaseセットアップ

## 目的
Supabaseプロジェクトを作成し、データベーススキーマとRLS（Row Level Security）を設定する。

## 実装内容

### 1. Supabaseプロジェクト作成
- Supabaseダッシュボードで新規プロジェクト作成
- プロジェクト名: `chip-management-app`
- リージョン: 東京（ap-northeast-1）推奨

### 2. 環境変数の設定
`.env.local` ファイルに以下を追加：

```
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

### 3. データベーススキーマ作成

#### テーブル定義

**users（Supabase Auth連携）**
- Supabase Authが自動管理
- `auth.users`テーブルを使用
- 追加情報が必要な場合は`profiles`テーブルを作成

**profiles（オプション）**
- `id` (uuid, PK, FK → auth.users.id)
- `display_name` (text)
- `avatar_url` (text, nullable)
- `created_at` (timestamp)

**sessions**
- `id` (uuid, PK, default: gen_random_uuid())
- `host_user_id` (uuid, FK → auth.users.id)
- `name` (text, nullable)
- `initial_chips` (integer, default: 1000)
- `max_participants` (integer, default: 10)
- `rate` (integer, nullable)
- `status` (text, check: 'waiting', 'active', 'completed')
- `created_at` (timestamp, default: now())
- `updated_at` (timestamp, default: now())

**session_participants**
- `id` (uuid, PK, default: gen_random_uuid())
- `session_id` (uuid, FK → sessions.id, on delete cascade)
- `user_id` (uuid, FK → auth.users.id)
- `joined_at` (timestamp, default: now())
- UNIQUE制約: (session_id, user_id)

**balances**
- `id` (uuid, PK, default: gen_random_uuid())
- `session_id` (uuid, FK → sessions.id, on delete cascade)
- `user_id` (uuid, FK → auth.users.id)
- `amount` (integer)
- `updated_at` (timestamp, default: now())
- UNIQUE制約: (session_id, user_id)

**transactions**
- `id` (uuid, PK, default: gen_random_uuid())
- `session_id` (uuid, FK → sessions.id, on delete cascade)
- `from_user_id` (uuid, FK → auth.users.id)
- `to_user_id` (uuid, FK → auth.users.id)
- `amount` (integer)
- `created_at` (timestamp, default: now())

### 4. インデックス作成
- `session_participants(session_id)`
- `session_participants(user_id)`
- `balances(session_id)`
- `balances(user_id)`
- `transactions(session_id)`
- `transactions(created_at)`

### 5. Row Level Security (RLS) 設定

各テーブルにRLSポリシーを設定：

**sessions**
- SELECT: 参加者のみ閲覧可能
- INSERT: 認証済みユーザーのみ
- UPDATE: ホストのみ
- DELETE: ホストのみ

**session_participants**
- SELECT: 同じセッションの参加者
- INSERT: 認証済みユーザー（自分のレコードのみ）
- DELETE: 自分のレコードのみ

**balances**
- SELECT: 同じセッションの参加者
- UPDATE: RPC Functionのみ（service roleで実行）

**transactions**
- SELECT: 同じセッションの参加者
- INSERT: RPC Functionのみ

### 6. RPC Function作成

**transfer_chips**
```sql
-- チップ送受信のトランザクション処理
-- パラメータ: p_session_id, p_from_user_id, p_to_user_id, p_amount
-- 処理:
--   1. 送信者の残高確認
--   2. 送信者の残高を減算
--   3. 受取人の残高を加算
--   4. transactionsテーブルに記録
```

### 7. Realtime有効化
以下のテーブルでRealtime Subscriptionを有効化：
- `session_participants`
- `balances`

### 8. Supabaseクライアント設定

**`lib/supabase/client.ts`**
- クライアント側のSupabaseクライアント作成
- `createClientComponentClient`を使用

**`lib/supabase/server.ts`**
- サーバー側のSupabaseクライアント作成
- `createServerComponentClient`を使用

**`lib/supabase/database.types.ts`**
- Supabase CLIで型定義を生成
- `npx supabase gen types typescript --project-id [project-id]`

## 必要なパッケージ
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

## 完了条件
- [ ] Supabaseプロジェクトが作成されている
- [ ] 全テーブルが作成されている
- [ ] RLSポリシーが設定されている
- [ ] RPC Functionが作成されている
- [ ] Realtimeが有効化されている
- [ ] 環境変数が設定されている
- [ ] Supabaseクライアントが実装されている
- [ ] 型定義ファイルが生成されている

## 動作確認
- Supabaseダッシュボードでテーブルが表示される
- RLSポリシーが有効になっている
- RPC Functionがテストできる
- アプリからSupabaseに接続できる

## トラブルシューティング
- **RLSエラー**: ポリシーの条件を確認
- **Realtime動作しない**: Realtimeの有効化を確認
- **型定義エラー**: Supabase CLIのバージョンを確認

## 参考リンク
- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime](https://supabase.com/docs/guides/realtime)

## 次のタスク
Task 10: 認証機能実装
