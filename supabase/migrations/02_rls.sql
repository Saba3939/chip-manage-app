-- Row Level Security (RLS) の有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- =========================================
-- profiles テーブルのRLSポリシー
-- =========================================

-- 全ユーザーが全プロファイルを閲覧可能（表示名などの公開情報）
CREATE POLICY "プロファイルは全員が閲覧可能"
  ON profiles FOR SELECT
  USING (true);

-- 自分のプロファイルのみ作成・更新可能
CREATE POLICY "自分のプロファイルのみ作成可能"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "自分のプロファイルのみ更新可能"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =========================================
-- sessions テーブルのRLSポリシー
-- =========================================

-- 参加者のみセッションを閲覧可能
CREATE POLICY "参加者のみセッションを閲覧可能"
  ON sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = sessions.id
        AND session_participants.user_id = auth.uid()
    )
  );

-- 認証済みユーザーはセッションを作成可能
CREATE POLICY "認証済みユーザーはセッションを作成可能"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = host_user_id);

-- ホストのみセッションを更新可能
CREATE POLICY "ホストのみセッションを更新可能"
  ON sessions FOR UPDATE
  USING (auth.uid() = host_user_id)
  WITH CHECK (auth.uid() = host_user_id);

-- ホストのみセッションを削除可能
CREATE POLICY "ホストのみセッションを削除可能"
  ON sessions FOR DELETE
  USING (auth.uid() = host_user_id);

-- =========================================
-- session_participants テーブルのRLSポリシー
-- =========================================

-- 同じセッションの参加者を閲覧可能
CREATE POLICY "同じセッションの参加者を閲覧可能"
  ON session_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM session_participants sp
      WHERE sp.session_id = session_participants.session_id
        AND sp.user_id = auth.uid()
    )
  );

-- 認証済みユーザーは自分のレコードのみ作成可能
CREATE POLICY "認証済みユーザーは自分のレコードのみ作成可能"
  ON session_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 自分のレコードのみ削除可能（セッションから退出）
CREATE POLICY "自分のレコードのみ削除可能"
  ON session_participants FOR DELETE
  USING (auth.uid() = user_id);

-- =========================================
-- balances テーブルのRLSポリシー
-- =========================================

-- 同じセッションの参加者の残高を閲覧可能
CREATE POLICY "同じセッションの参加者の残高を閲覧可能"
  ON balances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = balances.session_id
        AND session_participants.user_id = auth.uid()
    )
  );

-- 残高の更新はRPC Functionのみが行う
-- （サービスロールで実行されるため、このポリシーは適用されない）
-- セキュリティのため、通常のユーザーからの直接更新は禁止

-- =========================================
-- transactions テーブルのRLSポリシー
-- =========================================

-- 同じセッションの参加者のトランザクションを閲覧可能
CREATE POLICY "同じセッションの参加者のトランザクションを閲覧可能"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = transactions.session_id
        AND session_participants.user_id = auth.uid()
    )
  );

-- トランザクションの作成はRPC Functionのみが行う
-- （サービスロールで実行されるため、このポリシーは適用されない）
-- セキュリティのため、通常のユーザーからの直接作成は禁止

-- =========================================
-- Realtime の有効化
-- =========================================
-- 注意: Realtimeの有効化はSupabaseダッシュボードから手動で設定してください
-- Database > Tables > [テーブル名] > "Enable Realtime"
-- 有効化が必要なテーブル:
--   - session_participants
--   - balances
