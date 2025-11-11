-- profilesテーブルにpointsカラムを追加
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;

-- ポイント残高にはマイナスを許可しない（チェック制約）
ALTER TABLE profiles
ADD CONSTRAINT points_non_negative CHECK (points >= 0);

-- コメントを追加
COMMENT ON COLUMN profiles.points IS 'ユーザーの累積ポイント残高（セッション間で引き継がれる）';
