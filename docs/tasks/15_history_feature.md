# Task 15: 履歴閲覧機能

## 目的
過去のセッション履歴を閲覧し、統計情報を確認できる機能を実装する。

## 実装内容

### 1. 履歴一覧画面

**`app/(main)/history/page.tsx`**

**表示項目**
- セッション一覧（カード形式）
  - セッション名
  - 開催日時
  - 参加人数
  - 自分の増減（+/- チップ数、清算額）
  - ステータスバッジ
- フィルター機能
  - 期間指定（今週、今月、全期間）
  - ステータス（完了のみ、全て）
  - ソート（日時、増減額）
- ページネーション

### 2. 履歴詳細画面

**`app/(main)/history/[id]/page.tsx`**

**表示項目**
- セッション情報
  - セッション名
  - 開催日時
  - ホスト名
  - 参加者数
  - 初期チップ
  - レート
- 清算テーブル
  - 全参加者の結果
  - 自分の結果を強調表示
- トランザクション履歴
  - 時系列で全トランザクション表示
  - フィルター（全て/自分が関わった取引）
- 統計情報
  - 総取引回数
  - 最大送信額
  - 最大受信額

### 3. データ取得関数

**`lib/history/actions.ts`**

**一覧取得**
- `getSessionHistory(userId, filter)` - セッション履歴取得
  - フィルター: 期間、ステータス
  - ページネーション対応
  - ソート機能

**詳細取得**
- `getSessionDetail(sessionId)` - セッション詳細
- `getSessionTransactions(sessionId)` - トランザクション履歴
- `getSessionStatistics(sessionId)` - 統計情報

### 4. カスタムフック

**`hooks/useHistory.ts`**
- 履歴データを管理
- フィルター状態
- ページネーション
- ローディング状態

```typescript
const {
  sessions,
  loading,
  filter,
  setFilter,
  page,
  setPage,
  hasMore
} = useHistory(userId)
```

### 5. フィルター・検索機能

**`components/history/HistoryFilters.tsx`**
- 期間選択（日付ピッカー）
- ステータスフィルター
- ソート順選択
- 検索（セッション名）

### 6. 統計情報

**`components/history/UserStatistics.tsx`**

**全体統計**
- 総参加セッション数
- 総勝利数（プラス収支）
- 総敗北数（マイナス収支）
- 総収支（チップ数、金額）
- 勝率
- 平均収支

**期間別統計**
- 今週、今月、全期間での統計

### 7. データの効率的な取得

**キャッシング**
- React QueryまたはSWRを使用
- データのキャッシュと再検証
- 無限スクロール対応（オプション）

**最適化**
- 必要なデータのみ取得
- JOIN最適化
- インデックス活用

### 8. エクスポート機能（オプション）

**CSV出力**
- セッション一覧をCSVでダウンロード
- 清算データをCSVでダウンロード
- 統計データをCSVでダウンロード

## データベースクエリ設計

**履歴取得クエリ**
```sql
SELECT
  s.*,
  COUNT(sp.id) as participant_count,
  b.amount as final_chips,
  (b.amount - s.initial_chips) as difference
FROM sessions s
LEFT JOIN session_participants sp ON s.id = sp.session_id
LEFT JOIN balances b ON s.id = b.session_id AND b.user_id = :userId
WHERE sp.user_id = :userId
  AND s.status = 'completed'
ORDER BY s.created_at DESC
```

## 完了条件
- [ ] 履歴一覧画面が表示される
- [ ] 過去のセッションが一覧表示される
- [ ] フィルター機能が動作する
- [ ] 履歴詳細画面が表示される
- [ ] トランザクション履歴が表示される
- [ ] 統計情報が表示される
- [ ] ページネーションが動作する
- [ ] エクスポート機能が動作する（オプション）

## 動作確認

### 基本フロー
1. メニューから履歴画面へ遷移
2. 過去のセッション一覧が表示される
3. フィルターで期間を変更
4. 一覧が更新される
5. セッションカードをクリック
6. 詳細画面が表示される
7. トランザクション履歴を確認

### 統計確認
1. 統計情報が正しく計算されている
2. 期間別の統計が表示される
3. 勝率が正しく計算されている

## トラブルシューティング
- **履歴が表示されない**: RLSポリシーを確認
- **統計が合わない**: 計算ロジックを確認
- **パフォーマンス問題**: クエリとインデックスを確認

## 参考リンク
- [React Query](https://tanstack.com/query/latest)
- [SWR](https://swr.vercel.app/)

## 次のタスク
Task 16: テスト実装
