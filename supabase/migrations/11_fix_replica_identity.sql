-- =========================================
-- REPLICA IDENTITYの修正
-- =========================================
-- Realtimeのバインディングエラーを解決するため
-- REPLICA IDENTITY DEFAULTに戻す

-- DEFAULTは主キーのみを送信するため、クライアント側で
-- oldとnewの不一致が起こらない

ALTER TABLE session_participants REPLICA IDENTITY DEFAULT;
ALTER TABLE balances REPLICA IDENTITY DEFAULT;
ALTER TABLE transactions REPLICA IDENTITY DEFAULT;
ALTER TABLE sessions REPLICA IDENTITY DEFAULT;
ALTER TABLE profiles REPLICA IDENTITY DEFAULT;
