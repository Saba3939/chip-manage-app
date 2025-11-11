# Supabase セットアップガイド

## 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com) にアクセスしてアカウントを作成
2. 「New Project」をクリック
3. プロジェクト情報を入力：
   - **Name**: `chip-management-app`（または任意の名前）
   - **Database Password**: 強力なパスワードを設定（保管してください）
   - **Region**: `Northeast Asia (Tokyo)` を推奨
   - **Pricing Plan**: Free または Pro（必要に応じて）
4. 「Create new project」をクリック（数分かかります）

## 2. 環境変数の設定

1. Supabaseダッシュボードで、左メニューの「Settings」→「API」を開く
2. 以下の情報をコピー：
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role**: `SUPABASE_SERVICE_ROLE_KEY`（⚠️ 絶対に公開しない）

3. プロジェクトルートに`.env.local`ファイルを作成：

```bash
cp .env.example .env.local
```

4. `.env.local`に実際の値を設定

## 3. データベーススキーマの適用

### 方法1: SQL Editorを使用（推奨）

1. Supabaseダッシュボードで、左メニューの「SQL Editor」を開く
2. 以下のファイルを順番に実行：

   **ステップ1**: `migrations/01_schema.sql`
   - 「New query」をクリック
   - ファイルの内容をコピー＆ペースト
   - 「Run」をクリック

   **ステップ2**: `migrations/02_rls.sql`
   - 同様に新しいクエリを作成して実行

   **ステップ3**: `migrations/03_rpc_functions.sql`
   - 同様に新しいクエリを作成して実行

3. エラーがなければ完了

### 方法2: Supabase CLIを使用

```bash
# Supabase CLIをインストール（未インストールの場合）
npm install -g supabase

# Supabaseにログイン
supabase login

# プロジェクトにリンク
supabase link --project-ref your-project-ref

# マイグレーションを実行
supabase db push
```

## 4. Realtimeの有効化（必須）

マイグレーション実行後、以下のテーブルでRealtimeを手動で有効化してください：

1. Supabaseダッシュボードで「Database」→「Tables」を開く
2. **session_participants**テーブルを選択
3. テーブル名の右にある「...」メニューをクリック
4. 「Edit table」を選択
5. 「Enable Realtime」トグルをONにして保存
6. **balances**テーブルでも同じ手順を実行

## 5. 動作確認

### テーブルの確認
1. Supabaseダッシュボードで「Table Editor」を開く
2. 以下のテーブルが作成されていることを確認：
   - profiles
   - sessions
   - session_participants
   - balances
   - transactions

### RLSポリシーの確認
1. 「Authentication」→「Policies」を開く
2. 各テーブルにポリシーが設定されていることを確認

### RPC Functionの確認
1. 「Database」→「Functions」を開く
2. `transfer_chips`と`join_session`関数が存在することを確認

### Realtimeの設定（重要！）
Realtimeは**手動で有効化**する必要があります：

1. Supabaseダッシュボードで「Database」→「Tables」を開く
2. **session_participants**テーブルを選択
3. 右上の「...」メニューから「Edit table」を選択
4. 「Enable Realtime」トグルをONにする
5. 同様に**balances**テーブルでもRealtimeを有効化

または、各テーブルの詳細ページで「Realtime」タブから有効化できます

## 6. 型定義の更新（オプション）

実際のデータベーススキーマから型定義を自動生成する場合：

```bash
# Supabase CLIで型定義を生成
npx supabase gen types typescript --project-id your-project-id > lib/supabase/database.types.ts
```

## トラブルシューティング

### エラー: "relation does not exist"
- マイグレーションファイルを順番通りに実行していない可能性があります
- `01_schema.sql` → `02_rls.sql` → `03_rpc_functions.sql` の順で実行してください

### エラー: "permission denied"
- RLSポリシーが正しく設定されていない可能性があります
- `02_rls.sql`を再実行してください

### エラー: "function does not exist"
- RPC Functionが作成されていない可能性があります
- `03_rpc_functions.sql`を実行してください

### Realtimeが動作しない
- 各テーブルで「Enable Realtime」が有効になっているか確認
  - Database > Tables > [テーブル名] > Edit table > Enable Realtime
- RLSポリシーが正しく設定されているか確認
- プロジェクトプランでRealtimeが利用可能か確認（Freeプランでも利用可能）

## 次のステップ

セットアップが完了したら、次のタスクに進みます：
- Task 10: 認証機能実装

## 参考リンク

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)
- [Realtime](https://supabase.com/docs/guides/realtime)
