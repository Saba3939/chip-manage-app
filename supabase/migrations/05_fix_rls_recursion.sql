-- 既存のポリシーを削除
DROP POLICY IF EXISTS "同じセッションの参加者を閲覧可能" ON session_participants;
DROP POLICY IF EXISTS "同じセッションの参加者の残高を閲覧可能" ON balances;
DROP POLICY IF EXISTS "同じセッションの参加者のトランザクションを閲覧可能" ON transactions;
DROP POLICY IF EXISTS "参加者は残高レコードを作成可能" ON balances;
DROP POLICY IF EXISTS "参加者は残高を更新可能" ON balances;

-- =========================================
-- session_participants テーブルのRLSポリシー（修正版）
-- =========================================

-- 自分のレコードまたはセッションのホストの場合は閲覧可能
CREATE POLICY "参加者レコードを閲覧可能"
  ON session_participants FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_participants.session_id
        AND sessions.host_user_id = auth.uid()
    )
  );

-- =========================================
-- balances テーブルのRLSポリシー（修正版）
-- =========================================

-- セッションのホストまたは自分の残高は閲覧可能
CREATE POLICY "残高を閲覧可能"
  ON balances FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = balances.session_id
        AND sessions.host_user_id = auth.uid()
    )
  );

-- セッション参加者は残高レコードを作成可能（自分のレコードのみ）
CREATE POLICY "残高レコードを作成可能"
  ON balances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 残高を更新可能（RPC Functionで使用）
CREATE POLICY "残高を更新可能"
  ON balances FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- =========================================
-- transactions テーブルのRLSポリシー（修正版）
-- =========================================

-- セッションのホストまたは関係者はトランザクションを閲覧可能
CREATE POLICY "トランザクションを閲覧可能"
  ON transactions FOR SELECT
  USING (
    auth.uid() = from_user_id OR
    auth.uid() = to_user_id OR
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = transactions.session_id
        AND sessions.host_user_id = auth.uid()
    )
  );

-- トランザクションの作成（RPC Functionで使用）
CREATE POLICY "トランザクションを作成可能"
  ON transactions FOR INSERT
  WITH CHECK (true);
