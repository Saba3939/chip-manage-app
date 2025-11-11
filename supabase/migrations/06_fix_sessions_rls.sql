-- 既存のsessionsポリシーを削除
DROP POLICY IF EXISTS "参加者のみセッションを閲覧可能" ON sessions;

-- =========================================
-- sessions テーブルのRLSポリシー（修正版）
-- =========================================

-- セッションのホストまたは参加者は閲覧可能
-- 無限再帰を避けるため、シンプルなポリシーに変更
CREATE POLICY "セッションを閲覧可能"
  ON sessions FOR SELECT
  USING (
    auth.uid() = host_user_id
  );
