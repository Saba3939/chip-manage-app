-- =========================================
-- Realtimeの完全リセット
-- =========================================

-- 既存のpublicationからテーブルを削除（エラーを無視）
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE session_participants;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE balances;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE transactions;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE sessions;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE profiles;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- REPLICA IDENTITYをDEFAULTに設定
ALTER TABLE session_participants REPLICA IDENTITY DEFAULT;
ALTER TABLE balances REPLICA IDENTITY DEFAULT;
ALTER TABLE transactions REPLICA IDENTITY DEFAULT;
ALTER TABLE sessions REPLICA IDENTITY DEFAULT;
ALTER TABLE profiles REPLICA IDENTITY DEFAULT;

-- Publicationに再度追加
ALTER PUBLICATION supabase_realtime ADD TABLE session_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE balances;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;

-- =========================================
-- RLSポリシーの確認
-- =========================================
-- Realtimeが動作するためには、SELECTポリシーが必要

-- 既存のポリシーを確認（問題がある場合は修正）
DO $$
BEGIN
  -- session_participantsのSELECTポリシーが存在するか確認
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'session_participants'
    AND policyname LIKE '%閲覧%'
  ) THEN
    RAISE NOTICE 'session_participants SELECT policy not found';
  END IF;

  -- balancesのSELECTポリシーが存在するか確認
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'balances'
    AND policyname LIKE '%閲覧%'
  ) THEN
    RAISE NOTICE 'balances SELECT policy not found';
  END IF;

  -- transactionsのSELECTポリシーが存在するか確認
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'transactions'
    AND policyname LIKE '%閲覧%'
  ) THEN
    RAISE NOTICE 'transactions SELECT policy not found';
  END IF;
END $$;
