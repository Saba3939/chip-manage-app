-- =========================================
-- Realtimeの有効化
-- =========================================
-- リアルタイム更新が必要なテーブルでRealtimeを有効化

-- 既存のテーブルを削除してから追加（冪等性を確保）
DO $$
BEGIN
  -- session_participantsテーブルのRealtime有効化
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE session_participants;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- エラーを無視
  END;
  ALTER PUBLICATION supabase_realtime ADD TABLE session_participants;

  -- balancesテーブルのRealtime有効化
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE balances;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  ALTER PUBLICATION supabase_realtime ADD TABLE balances;

  -- transactionsテーブルのRealtime有効化
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE transactions;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  ALTER PUBLICATION supabase_realtime ADD TABLE transactions;

  -- sessionsテーブルのRealtime有効化（ステータス変更を監視）
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE sessions;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
END $$;

-- =========================================
-- REPLICA IDENTITYの設定
-- =========================================
-- Realtimeで古い値も取得できるようにする

ALTER TABLE session_participants REPLICA IDENTITY FULL;
ALTER TABLE balances REPLICA IDENTITY FULL;
ALTER TABLE transactions REPLICA IDENTITY FULL;
ALTER TABLE sessions REPLICA IDENTITY FULL;
