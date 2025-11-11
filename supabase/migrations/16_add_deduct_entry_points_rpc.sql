-- セッション開始時に参加者からエントリーポイントを引くRPC関数
CREATE OR REPLACE FUNCTION deduct_entry_points(
  p_session_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_record RECORD;
  v_participant RECORD;
  v_entry_points INTEGER;
  v_current_points INTEGER;
  v_deducted_count INTEGER := 0;
  v_failed_users TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- セッション情報を取得
  SELECT initial_chips, rate, status
  INTO v_session_record
  FROM sessions
  WHERE id = p_session_id;

  -- セッションが存在しない場合
  IF v_session_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'セッションが見つかりません'
    );
  END IF;

  -- レートが設定されていない場合
  IF v_session_record.rate IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'ポイントレートが設定されていません'
    );
  END IF;

  -- エントリーポイントを計算
  v_entry_points := v_session_record.initial_chips * v_session_record.rate;

  -- 各参加者からポイントを引く
  FOR v_participant IN
    SELECT user_id
    FROM session_participants
    WHERE session_id = p_session_id
  LOOP
    -- 現在のポイントを取得
    SELECT points INTO v_current_points
    FROM profiles
    WHERE id = v_participant.user_id;

    -- ポイントが不足している場合
    IF v_current_points < v_entry_points THEN
      v_failed_users := array_append(v_failed_users, v_participant.user_id::TEXT);
      CONTINUE;
    END IF;

    -- ポイントを引く
    UPDATE profiles
    SET points = points - v_entry_points
    WHERE id = v_participant.user_id;

    v_deducted_count := v_deducted_count + 1;
  END LOOP;

  -- 一部のユーザーでエラーが発生した場合
  IF array_length(v_failed_users, 1) > 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'ポイントが不足しているユーザーがいます',
      'failed_users', v_failed_users,
      'deducted_count', v_deducted_count
    );
  END IF;

  -- 成功
  RETURN json_build_object(
    'success', true,
    'entry_points', v_entry_points,
    'deducted_count', v_deducted_count
  );
END;
$$;

-- 関数にコメントを追加
COMMENT ON FUNCTION deduct_entry_points IS 'セッション開始時に参加者全員からエントリーポイントを引く';
