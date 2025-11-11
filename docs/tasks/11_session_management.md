# Task 11: セッション管理機能実装

## 目的
セッションの作成、参加、開始、終了などの機能を実装し、Supabaseと連携する。

## 実装内容

### 1. セッション操作関数

**`lib/session/actions.ts`**

**作成機能**
- `createSession(data)` - セッション作成
  - sessionsテーブルにレコード挿入
  - ホストを自動的にsession_participantsに追加
  - ホストのbalancesレコード作成（初期チップ）

**参加機能**
- `joinSession(sessionId, userId)` - セッション参加
  - session_participantsにレコード追加
  - 重複チェック（既に参加済みか）
  - 最大人数チェック
  - ステータスチェック（waitingのみ参加可能）

**開始機能**
- `startSession(sessionId)` - セッション開始
  - ステータスをwaitingからactiveに変更
  - ホスト権限チェック
  - 参加人数チェック（2人以上）
  - 全参加者にbalancesレコード作成

**終了機能**
- `endSession(sessionId)` - セッション終了
  - ステータスをactiveからcompletedに変更
  - ホスト権限チェック

**取得機能**
- `getSession(sessionId)` - セッション詳細取得
- `getSessionsByUser(userId)` - ユーザーのセッション一覧
- `getActiveSession(userId)` - アクティブなセッション取得

### 2. 参加者管理

**`lib/session/participants.ts`**
- `getParticipants(sessionId)` - 参加者一覧取得
- `getParticipantCount(sessionId)` - 参加者数取得
- `isParticipant(sessionId, userId)` - 参加確認
- `isHost(sessionId, userId)` - ホスト確認
- `leaveSession(sessionId, userId)` - セッション退出

### 3. フロントエンドの更新

**セッション作成画面の更新**
- `app/(main)/session/create/page.tsx`
- モック処理を削除
- `createSession`を呼び出し
- 作成後、セッション詳細画面へリダイレクト

**セッション参加画面の更新**
- `app/(main)/session/join/[id]/page.tsx`
- QRコード読み取り後、`joinSession`を呼び出し
- 参加後、セッション詳細画面へリダイレクト

**セッション詳細画面の更新**
- `app/(main)/session/[id]/page.tsx`
- Supabaseからセッション情報を取得
- 参加者リストを取得
- ホスト権限に応じたボタン表示

**ダッシュボードの更新**
- `app/(main)/dashboard/page.tsx`
- モックデータを削除
- `getSessionsByUser`で実際のセッション一覧を取得

### 4. カスタムフック

**`hooks/useSession.ts`**
- セッション情報を管理
- ローディング状態
- エラーハンドリング

```typescript
const { session, participants, loading, error } = useSession(sessionId)
```

**`hooks/useSessionActions.ts`**
- セッション操作関数をラップ
- ローディング状態とエラーを管理

```typescript
const { createSession, joinSession, startSession, endSession, loading } = useSessionActions()
```

### 5. エラーハンドリング

**エラーケース**
- セッションが存在しない
- 既に参加済み
- 最大人数に達している
- ホスト権限がない
- 不正なステータス遷移

**エラーメッセージ**
- ユーザーフレンドリーな日本語メッセージ
- トースト通知で表示

### 6. バリデーション

**サーバーサイド**
- 権限チェック
- ステータスチェック
- 人数制限チェック

**クライアントサイド**
- フォーム入力チェック
- 事前バリデーション

## 完了条件
- [ ] セッション作成が動作する
- [ ] セッション参加が動作する
- [ ] セッション開始が動作する
- [ ] セッション終了が動作する
- [ ] 参加者リストが取得できる
- [ ] ホスト権限チェックが機能する
- [ ] エラーハンドリングが適切に動作する
- [ ] ダッシュボードに実際のセッションが表示される

## 動作確認
1. セッション作成
   - フォーム入力してセッション作成
   - セッション詳細画面へリダイレクト
   - Supabaseにレコードが作成される
2. セッション参加
   - QRコードで参加
   - 参加者リストに追加される
3. セッション開始
   - ホストが開始ボタンをクリック
   - ステータスがactiveに変更される
   - 全参加者にbalancesが作成される
4. セッション終了
   - ホストが終了ボタンをクリック
   - ステータスがcompletedに変更される
   - 清算画面へリダイレクト

## トラブルシューティング
- **参加できない**: RLSポリシーを確認
- **セッションが表示されない**: クエリ条件を確認
- **ホストボタンが表示されない**: 権限チェックを確認

## 次のタスク
Task 12: リアルタイム更新機能
