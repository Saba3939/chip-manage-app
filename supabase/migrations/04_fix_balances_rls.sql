-- balances テーブルのINSERTポリシーを追加
-- 同じセッションの参加者は残高レコードを作成可能
CREATE POLICY "参加者は残高レコードを作成可能"
  ON balances FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = balances.session_id
        AND session_participants.user_id = auth.uid()
    )
    AND auth.uid() = user_id
  );

-- balances テーブルのUPDATEポリシーを追加
-- RPC Functionまたはセッション参加者が自分の残高を更新可能
CREATE POLICY "参加者は残高を更新可能"
  ON balances FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = balances.session_id
        AND session_participants.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = balances.session_id
        AND session_participants.user_id = auth.uid()
    )
  );
