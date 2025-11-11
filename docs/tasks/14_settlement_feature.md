# Task 14: 清算機能実装

## 目的
セッション終了時の清算画面を実装し、増減と清算額を計算・表示する。

## 実装内容

### 1. 清算データ取得関数

**`lib/settlement/actions.ts`**

**清算データ作成**
- `calculateSettlement(sessionId)` - 清算データ計算
  - 各参加者の初期チップ・最終チップを取得
  - 増減を計算: 最終 - 初期
  - 清算額を計算: 増減 × レート
  - 合計の検証

**返り値の型**
```typescript
type SettlementData = {
  sessionId: string
  sessionName: string
  participants: Array<{
    userId: string
    displayName: string
    initialChips: number
    finalChips: number
    difference: number
    settlementAmount: number
  }>
  totalInitial: number
  totalFinal: number
  totalDifference: number
  totalSettlement: number
  rate: number
  isValid: boolean // チップ総数が一致するか
}
```

**履歴保存**
- `saveSettlement(sessionId)` - 清算結果を保存
  - セッションの最終状態を記録
  - 将来的な統計に使用

### 2. 清算画面の更新

**`app/(main)/session/[id]/settlement/page.tsx`**
- モックデータを削除
- `calculateSettlement`で実際のデータ取得
- 清算テーブルに表示

**データの取得フロー**
1. セッションIDからセッション情報取得
2. 参加者リスト取得
3. 各参加者の残高取得（balancesテーブル）
4. 初期チップはセッション情報から取得
5. 清算データを計算

### 3. カスタムフック

**`hooks/useSettlement.ts`**
- 清算データを管理
- ローディング状態
- エラーハンドリング

```typescript
const { settlement, loading, error } = useSettlement(sessionId)
```

### 4. 整合性チェック

**チップ総数の検証**
```typescript
totalFinal === totalInitial
```

**清算額合計の検証**
```typescript
sum(settlementAmount) === 0
```

**検証失敗時**
- 警告メッセージ表示
- エラー詳細を表示
- 管理者への通知（将来的に）

### 5. レート設定

**レート未設定の場合**
- 清算画面で初めてレート入力
- デフォルト: 10円
- セッション情報を更新

**`components/settlement/RateInputDialog.tsx`**
- レート入力ダイアログ
- バリデーション（正の数値）
- 清算額の再計算

### 6. 清算結果の表示

**`components/settlement/SettlementTable.tsx`の更新**
- 実際のデータを表示
- ソート機能（増減額）
- エクスポート機能（CSV、将来的に）

**視覚化の改善**
- 増減額のグラフ表示（オプション）
- 勝者/敗者の強調表示
- アニメーション効果

### 7. 清算完了処理

**完了ボタン**
- 「清算を確定」ボタン
- 確認ダイアログ
- セッションステータスをcompletedに変更
- 清算データを保存

**完了後の遷移**
- ダッシュボードへ戻る
- または履歴画面へ

### 8. 共有機能（オプション）

**清算結果の共有**
- スクリーンショット生成
- SNSシェアボタン
- URLコピー

## データフロー

```
1. セッション終了ボタン
   ↓
2. endSession() → status = 'completed'
   ↓
3. 清算画面へリダイレクト
   ↓
4. calculateSettlement() → 清算データ計算
   ↓
5. 清算画面表示
   ↓
6. レート設定（未設定の場合）
   ↓
7. 清算確定
   ↓
8. saveSettlement() → 履歴保存
   ↓
9. ダッシュボードへ
```

## 完了条件
- [ ] 清算データが正しく計算される
- [ ] 清算画面に実際のデータが表示される
- [ ] レート設定が動作する
- [ ] 整合性チェックが機能する
- [ ] 清算確定処理が動作する
- [ ] 履歴が保存される
- [ ] エラーハンドリングが適切に動作する

## 動作確認

### 正常フロー
1. セッション進行中
2. 複数回チップ送受信
3. ホストがセッション終了
4. 清算画面へ自動遷移
5. 清算データが正しく表示される
   - 初期チップ
   - 最終チップ
   - 増減
   - 清算額
6. チップ総数が一致している
7. 清算額合計が0円
8. 清算確定でダッシュボードへ

### エラーケース
1. チップ総数が一致しない
   - 警告メッセージ表示
   - 詳細情報表示（どこで不一致か）
2. レート未設定
   - レート入力ダイアログ表示
   - 入力後に清算額再計算

## トラブルシューティング
- **チップ総数が合わない**: トランザクション履歴を確認
- **清算額が0にならない**: 計算ロジックを確認
- **データが表示されない**: RLSポリシーを確認

## 参考リンク
- [Supabase Queries](https://supabase.com/docs/guides/database/queries)

## 次のタスク
Task 15: 履歴閲覧機能
