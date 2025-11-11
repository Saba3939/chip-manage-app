# Task 12: リアルタイム更新機能実装

## 目的
Supabase Realtimeを使用して、参加者リストと残高をリアルタイムで更新する。

## 実装内容

### 1. Realtime購読カスタムフック

**`hooks/useRealtimeParticipants.ts`**
- `session_participants`テーブルを購読
- 参加者の追加・削除をリアルタイム反映

**機能**
- INSERT: 新しい参加者が追加された時
- DELETE: 参加者が退出した時
- ローカルステートを自動更新

**使用方法**
```typescript
const participants = useRealtimeParticipants(sessionId)
```

**`hooks/useRealtimeBalances.ts`**
- `balances`テーブルを購読
- 残高の変更をリアルタイム反映

**機能**
- UPDATE: 残高が変更された時
- INSERT: 新しい残高レコードが追加された時
- ローカルステートを自動更新

**使用方法**
```typescript
const balances = useRealtimeBalances(sessionId)
```

### 2. セッション詳細画面の更新

**`app/(main)/session/[id]/page.tsx`**
- Realtimeフックを使用
- 参加者リストをリアルタイム更新
- 残高をリアルタイム更新
- アニメーション効果で変更を視覚化

### 3. Realtime Subscription管理

**接続管理**
- コンポーネントマウント時に購読開始
- アンマウント時に購読解除
- メモリリーク防止

**エラーハンドリング**
- 接続エラーの検知
- 再接続処理
- ユーザーへの通知

### 4. 最適化

**パフォーマンス**
- 不要な再レンダリングを防ぐ
- React.memo、useMemo、useCallbackの活用
- Subscriptionの適切なクリーンアップ

**フィルタリング**
- 特定のセッションのみ購読
- RLSによるアクセス制御

### 5. UIフィードバック

**変更の視覚化**
- 残高変更時のアニメーション
- 新規参加者の追加アニメーション
- 色の変化（増加=緑、減少=赤）

**接続状態表示**
- オンライン/オフライン インジケーター
- 接続中、切断、再接続中の状態表示

### 6. オフライン対応

**ネットワーク切断時**
- エラーメッセージ表示
- 再接続の試行
- キャッシュデータの表示

**復帰時**
- データの再取得
- 差分の反映

## 実装の流れ

### ステップ1: 基本的なSubscription
1. `session_participants`テーブルの購読
2. INSERT/DELETEイベントの処理
3. ローカルステートの更新

### ステップ2: 残高のRealtime
1. `balances`テーブルの購読
2. UPDATEイベントの処理
3. アニメーション効果の追加

### ステップ3: 最適化
1. 不要な再レンダリングの削減
2. Subscriptionのクリーンアップ
3. エラーハンドリングの改善

## 完了条件
- [ ] 参加者リストがリアルタイム更新される
- [ ] 残高がリアルタイム更新される
- [ ] 複数デバイスで同期が動作する
- [ ] アニメーション効果が機能する
- [ ] エラーハンドリングが適切に動作する
- [ ] Subscriptionが適切にクリーンアップされる
- [ ] オフライン/オンライン状態が表示される

## 動作確認

### 複数デバイステスト
1. デバイスA: セッション作成
2. デバイスB: セッション参加
3. デバイスA: 参加者リストにデバイスBが表示される（リアルタイム）
4. ホストがセッション開始
5. デバイスA: チップ送信
6. デバイスB: 残高が即座に更新される

### パフォーマンステスト
- 10人同時参加でのリアルタイム更新
- 複数の送信が同時に行われた場合
- ネットワーク切断・復帰

## トラブルシューティング
- **Realtimeが動作しない**: RLSポリシーを確認
- **更新が遅い**: Subscriptionのフィルタリングを確認
- **メモリリーク**: useEffectのクリーンアップを確認
- **重複更新**: useEffectの依存配列を確認

## 参考リンク
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Realtime Subscriptions](https://supabase.com/docs/guides/realtime/subscriptions)

## 次のタスク
Task 13: チップ送受信機能実装
