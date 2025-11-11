# Task 13: チップ送受信機能実装

## 目的
Supabase RPC Functionを使用してチップの送受信を実装し、トランザクションの整合性を保証する。

## 実装内容

### 1. RPC Function実装（Supabase側）

**`transfer_chips` 関数**

**パラメータ**
- `p_session_id` (uuid) - セッションID
- `p_from_user_id` (uuid) - 送信者ID
- `p_to_user_id` (uuid) - 受取人ID
- `p_amount` (integer) - 送信額

**処理フロー**
1. 入力バリデーション
   - 金額 > 0
   - 送信者 ≠ 受取人
   - セッションがactiveステータス
2. 送信者の残高確認
   - 残高 >= 送信額
3. トランザクション開始
   - 送信者の残高を減算
   - 受取人の残高を加算
   - transactionsテーブルに記録
4. エラー時はロールバック

**戻り値**
- 成功: 更新後の残高情報
- 失敗: エラーメッセージ

**SQL例（概要）**
```sql
CREATE OR REPLACE FUNCTION transfer_chips(...)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- バリデーション
  -- 残高確認
  -- トランザクション処理
  -- 履歴記録
  RETURN json_build_object('success', true, ...);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
```

### 2. フロントエンド実装

**`lib/chip/actions.ts`**

**送信機能**
- `transferChips(sessionId, fromUserId, toUserId, amount)`
  - RPC Functionを呼び出し
  - エラーハンドリング
  - 成功/失敗の判定

**残高取得**
- `getBalance(sessionId, userId)` - 自分の残高取得
- `getAllBalances(sessionId)` - 全員の残高取得

**履歴取得**
- `getTransactions(sessionId)` - トランザクション履歴
- `getRecentTransactions(sessionId, limit)` - 最近の履歴

### 3. カスタムフック

**`hooks/useChipTransfer.ts`**
- 送信処理を管理
- ローディング状態
- エラー状態
- 成功時のコールバック

**使用方法**
```typescript
const { transfer, loading, error } = useChipTransfer()

await transfer({
  sessionId,
  toUserId,
  amount,
  onSuccess: () => {
    toast.success('チップを送信しました')
  }
})
```

**`hooks/useBalance.ts`**
- 残高情報を管理
- リアルタイム更新と連携

```typescript
const { balance, loading } = useBalance(sessionId, userId)
```

### 4. チップ送信ダイアログの更新

**`components/chip/ChipTransferDialog.tsx`**
- モック処理を削除
- `useChipTransfer`フックを使用
- 送信処理の実装
- エラー表示
- ローディング状態

**バリデーション**
- クライアント側で事前チェック
- 残高不足の警告
- サーバー側で最終確認

### 5. トランザクション履歴表示

**`components/chip/TransactionHistory.tsx`**
- 実際のトランザクション履歴を表示
- リアルタイム更新
- ページネーション（必要に応じて）
- フィルタリング（送信/受信）

### 6. エラーハンドリング

**エラーケース**
- 残高不足
- セッションが終了している
- 受取人が存在しない
- ネットワークエラー
- タイムアウト

**エラー表示**
- トースト通知
- ダイアログ内のエラーメッセージ
- リトライボタン

### 7. 楽観的更新（オプション）

**UI反応速度の向上**
- 送信ボタンクリック → 即座にUIを更新
- RPC実行中は仮の状態
- 成功時: そのまま
- 失敗時: ロールバック

## セキュリティ考慮事項
- RPC FunctionはSECURITY DEFINERで実行
- RLSで直接のbalances更新を防ぐ
- 送信者の認証確認
- レート制限（必要に応じて）

## 完了条件
- [ ] RPC Functionが実装されている
- [ ] チップ送信が動作する
- [ ] 残高が正しく更新される
- [ ] トランザクション履歴が記録される
- [ ] エラーハンドリングが適切に動作する
- [ ] リアルタイム更新と連携している
- [ ] 複数ユーザー間で送受信が正常に動作する

## 動作確認

### 基本フロー
1. セッション開始
2. ユーザーA → ユーザーBにチップ送信
3. 両者の残高が更新される
4. 履歴に記録される
5. 他の参加者の画面もリアルタイム更新される

### エラーケース
1. 残高不足で送信
   - エラーメッセージ表示
   - 残高が変更されない
2. ネットワーク切断中に送信
   - エラーメッセージ表示
   - リトライ可能

### 整合性チェック
- チップ総数が変わらない
- 送信者の減算 = 受取人の加算
- トランザクション履歴と残高の整合性

## トラブルシューティング
- **送信できない**: RPC Functionのエラーログを確認
- **残高が合わない**: トランザクションログを確認
- **Realtimeが反映されない**: Subscriptionを確認

## 参考リンク
- [Supabase RPC Functions](https://supabase.com/docs/guides/database/functions)
- [PostgreSQL Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)

## 次のタスク
Task 14: 清算機能実装
