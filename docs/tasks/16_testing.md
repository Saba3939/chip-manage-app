# Task 16: テスト実装

## 目的
アプリケーションの品質を保証するため、単体テスト、統合テスト、E2Eテストを実装する。

## 実装内容

### 1. テスト環境のセットアップ

**必要なパッケージ**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event
npm install -D @playwright/test  # E2Eテスト用
```

**設定ファイル**
- `vitest.config.ts` - Vitestの設定
- `playwright.config.ts` - Playwrightの設定
- `__tests__/setup.ts` - テストのセットアップ

### 2. 単体テスト

#### ユーティリティ関数のテスト

**`lib/chip/calculations.test.ts`**
- 清算額の計算テスト
- 増減の計算テスト
- バリデーション関数のテスト

**`lib/utils.test.ts`**
- 共通ユーティリティのテスト
- フォーマット関数のテスト

#### コンポーネントのテスト

**認証コンポーネント**
- `components/auth/LoginForm.test.tsx`
  - フォーム入力のテスト
  - バリデーションのテスト
  - 送信処理のテスト（モック）

**チップ送信コンポーネント**
- `components/chip/ChipTransferDialog.test.tsx`
  - ダイアログ表示のテスト
  - 金額入力のテスト
  - バリデーションのテスト
  - 送信処理のテスト（モック）

**清算コンポーネント**
- `components/settlement/SettlementTable.test.tsx`
  - データ表示のテスト
  - ソート機能のテスト
  - 計算結果のテスト

### 3. 統合テスト

#### セッション作成フロー
**`__tests__/integration/session-creation.test.ts`**
1. セッション作成フォーム入力
2. セッション作成API呼び出し
3. セッション詳細画面へ遷移
4. QRコード生成確認

#### チップ送受信フロー
**`__tests__/integration/chip-transfer.test.ts`**
1. セッション作成・開始
2. チップ送信ダイアログ表示
3. 送信処理
4. 残高更新確認
5. トランザクション履歴確認

#### 清算フロー
**`__tests__/integration/settlement.test.ts`**
1. セッション終了
2. 清算画面表示
3. 清算データ確認
4. 整合性チェック

### 4. E2Eテスト（Playwright）

#### ユーザーフロー全体
**`e2e/user-flow.spec.ts`**
1. ユーザー登録
2. ログイン
3. セッション作成
4. QRコード表示
5. 別ブラウザでセッション参加
6. セッション開始
7. チップ送受信
8. セッション終了
9. 清算確認

#### マルチユーザーテスト
**`e2e/multi-user.spec.ts`**
- 複数ユーザーの同時操作
- リアルタイム更新の確認
- 競合状態のテスト

### 5. モック設定

**Supabaseのモック**
- `__tests__/mocks/supabase.ts`
- API呼び出しをモック
- テストデータの定義

**認証のモック**
- `__tests__/mocks/auth.ts`
- ログイン状態のモック
- ユーザー情報のモック

### 6. テストデータ

**`__tests__/fixtures/`**
- `sessions.ts` - セッションデータ
- `users.ts` - ユーザーデータ
- `transactions.ts` - トランザクションデータ

### 7. カバレッジ

**カバレッジ目標**
- ユーティリティ関数: 90%以上
- コンポーネント: 80%以上
- ページ: 70%以上

**カバレッジレポート**
```bash
npm run test:coverage
```

### 8. CI/CDでの自動テスト

**GitHub Actions設定**
- `.github/workflows/test.yml`
- プルリクエスト時に自動実行
- カバレッジレポート生成
- E2Eテストの実行

## テストコマンド

```bash
# 単体テスト
npm run test

# 単体テスト（watch mode）
npm run test:watch

# カバレッジ
npm run test:coverage

# E2Eテスト
npm run test:e2e

# E2Eテスト（UI mode）
npm run test:e2e:ui
```

## テスト方針

### 重点的にテストする項目
1. **ビジネスロジック**
   - チップ計算
   - 清算計算
   - バリデーション
2. **重要なユーザーフロー**
   - セッション作成〜参加〜開始
   - チップ送受信
   - 清算
3. **エッジケース**
   - 残高不足
   - ネットワークエラー
   - 同時操作

### テストしない項目
- UIの細かい見た目
- shadcn/uiコンポーネント自体
- Supabase内部の動作

## 完了条件
- [ ] テスト環境がセットアップされている
- [ ] 単体テストが実装されている
- [ ] 統合テストが実装されている
- [ ] E2Eテストが実装されている
- [ ] カバレッジが目標を達成している
- [ ] CI/CDでテストが自動実行される
- [ ] 全てのテストが通る

## 動作確認
```bash
npm run test
npm run test:e2e
```
- 全てのテストが成功する
- カバレッジレポートが生成される

## トラブルシューティング
- **テストが失敗する**: モックの設定を確認
- **E2Eが不安定**: waitやタイムアウトを調整
- **カバレッジが低い**: テストケースを追加

## 参考リンク
- [Vitest](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)

## 次のタスク
Task 17: デプロイ設定
