-- 無限再帰を完全に回避するため、RLSポリシーをシンプルに変更
-- 開発フェーズでは緩めのポリシーを使用し、本番環境では厳格化します

-- =========================================
-- 既存のポリシーを全て削除
-- =========================================
DROP POLICY IF EXISTS "セッションを閲覧可能" ON sessions;
DROP POLICY IF EXISTS "参加者のみセッションを閲覧可能" ON sessions;
DROP POLICY IF EXISTS "認証済みユーザーはセッションを作成可能" ON sessions;
DROP POLICY IF EXISTS "ホストのみセッションを更新可能" ON sessions;
DROP POLICY IF EXISTS "ホストのみセッションを削除可能" ON sessions;

DROP POLICY IF EXISTS "参加者レコードを閲覧可能" ON session_participants;
DROP POLICY IF EXISTS "認証済みユーザーは自分のレコードのみ作成可能" ON session_participants;
DROP POLICY IF EXISTS "自分のレコードのみ削除可能" ON session_participants;

DROP POLICY IF EXISTS "残高を閲覧可能" ON balances;
DROP POLICY IF EXISTS "残高レコードを作成可能" ON balances;
DROP POLICY IF EXISTS "残高を更新可能" ON balances;

DROP POLICY IF EXISTS "トランザクションを閲覧可能" ON transactions;
DROP POLICY IF EXISTS "トランザクションを作成可能" ON transactions;

-- =========================================
-- sessions テーブル - シンプルなポリシー
-- =========================================

-- 認証済みユーザーは全てのセッションを閲覧可能（開発中）
CREATE POLICY "認証済みユーザーはセッションを閲覧可能"
  ON sessions FOR SELECT
  USING (auth.role() = 'authenticated');

-- ホストとして作成
CREATE POLICY "セッションを作成可能"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = host_user_id);

-- ホストのみ更新可能
CREATE POLICY "ホストのみ更新可能"
  ON sessions FOR UPDATE
  USING (auth.uid() = host_user_id)
  WITH CHECK (auth.uid() = host_user_id);

-- ホストのみ削除可能
CREATE POLICY "ホストのみ削除可能"
  ON sessions FOR DELETE
  USING (auth.uid() = host_user_id);

-- =========================================
-- session_participants テーブル
-- =========================================

-- 認証済みユーザーは全ての参加者を閲覧可能
CREATE POLICY "参加者を閲覧可能"
  ON session_participants FOR SELECT
  USING (auth.role() = 'authenticated');

-- 自分のレコードのみ作成可能
CREATE POLICY "参加者レコードを作成可能"
  ON session_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 自分のレコードのみ削除可能
CREATE POLICY "参加者レコードを削除可能"
  ON session_participants FOR DELETE
  USING (auth.uid() = user_id);

-- =========================================
-- balances テーブル
-- =========================================

-- 認証済みユーザーは全ての残高を閲覧可能
CREATE POLICY "残高を閲覧可能"
  ON balances FOR SELECT
  USING (auth.role() = 'authenticated');

-- 自分の残高レコードのみ作成可能
CREATE POLICY "残高を作成可能"
  ON balances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 残高を更新可能（RPC Function用）
CREATE POLICY "残高を更新可能"
  ON balances FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- =========================================
-- transactions テーブル
-- =========================================

-- 認証済みユーザーは全てのトランザクションを閲覧可能
CREATE POLICY "トランザクションを閲覧可能"
  ON transactions FOR SELECT
  USING (auth.role() = 'authenticated');

-- トランザクションを作成可能（RPC Function用）
CREATE POLICY "トランザクションを作成可能"
  ON transactions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
