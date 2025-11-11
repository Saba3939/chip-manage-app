# Task 10: 認証機能実装

## 目的
Supabase Authを使用した認証機能を実装し、モックから実際の認証処理に切り替える。

## 実装内容

### 1. 認証ヘルパー関数

**`lib/auth/actions.ts`**
- `signUp(email, password, displayName)` - 新規登録
- `signIn(email, password)` - ログイン
- `signOut()` - ログアウト
- `signInWithGoogle()` - Googleログイン（OAuth）
- `getCurrentUser()` - 現在のユーザー取得
- `getSession()` - セッション取得

### 2. 認証状態管理

**`hooks/useAuth.ts`**
- 認証状態を管理するカスタムフック
- ユーザー情報の取得
- ローディング状態
- エラーハンドリング

**使用方法**
```typescript
const { user, loading, signOut } = useAuth()
```

### 3. 認証ガード

**`components/auth/AuthGuard.tsx`**
- 認証が必要なページを保護
- 未認証の場合はログイン画面へリダイレクト
- ローディング中の表示

**`app/(main)/layout.tsx`に適用**
- メインアプリ全体を認証ガードで保護

### 4. ログイン・登録機能の実装

**`app/(auth)/login/page.tsx`の更新**
- モック処理を削除
- Supabase Authを使用した実際のログイン処理
- エラーハンドリング（メール未確認、パスワード誤りなど）

**`app/(auth)/register/page.tsx`の更新**
- モック処理を削除
- Supabase Authを使用した実際の登録処理
- プロフィール情報（display_name）の保存
- メール確認の案内

### 5. プロフィール情報の管理

**`lib/profile/actions.ts`**
- `createProfile(userId, displayName)` - プロフィール作成
- `getProfile(userId)` - プロフィール取得
- `updateProfile(userId, data)` - プロフィール更新

### 6. Google OAuth設定

**Supabaseダッシュボード**
- Google Providerを有効化
- OAuth Clientの設定
- リダイレクトURLの設定

**フロントエンド**
- Googleログインボタンの実装
- OAuthコールバック処理

### 7. メール確認機能

**確認メールのテンプレート設定**
- Supabaseダッシュボードで設定
- カスタムテンプレート（日本語対応）

**確認後のリダイレクト**
- `/auth/callback` ルートを作成
- トークン検証後にダッシュボードへ

### 8. セッション管理

**ミドルウェア（`middleware.ts`）**
- 認証状態のチェック
- セッションのリフレッシュ
- 保護されたルートの定義

### 9. エラーハンドリング

**エラーメッセージの定義**
- `lib/auth/errors.ts`
- Supabaseエラーを日本語メッセージに変換
- ユーザーフレンドリーなエラー表示

## セキュリティ考慮事項
- パスワードは最低8文字
- メール確認を必須にする（推奨）
- RLSポリシーで適切なアクセス制御
- XSS/CSRF対策

## 完了条件
- [ ] ログイン機能が動作する
- [ ] 新規登録機能が動作する
- [ ] ログアウト機能が動作する
- [ ] Googleログインが動作する（オプション）
- [ ] 認証ガードが機能する
- [ ] プロフィール情報が保存される
- [ ] エラーメッセージが適切に表示される
- [ ] セッションが適切に管理される

## 動作確認
1. 新規登録
   - メールアドレスとパスワードで登録
   - プロフィール情報が保存される
   - 確認メールが届く（設定による）
2. ログイン
   - 登録したアカウントでログイン
   - ダッシュボードへリダイレクト
3. ログアウト
   - ログアウトボタンでログアウト
   - ログイン画面へリダイレクト
4. 認証ガード
   - 未認証で`/dashboard`にアクセス
   - ログイン画面へリダイレクト

## トラブルシューティング
- **ログインできない**: Supabaseの認証設定を確認
- **リダイレクトループ**: ミドルウェアの条件を確認
- **セッションが保持されない**: Cookieの設定を確認

## 参考リンク
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Next.js Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

## 次のタスク
Task 11: セッション管理機能
