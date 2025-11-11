-- ユーザーのポイントを更新するRPC関数
CREATE OR REPLACE FUNCTION update_user_points(
  p_user_id UUID,
  p_points_change INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_points INTEGER;
  v_new_points INTEGER;
BEGIN
  -- 現在のポイントを取得
  SELECT points INTO v_current_points
  FROM profiles
  WHERE id = p_user_id;

  -- ユーザーが存在しない場合
  IF v_current_points IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'ユーザーが見つかりません'
    );
  END IF;

  -- 新しいポイント数を計算
  v_new_points := v_current_points + p_points_change;

  -- ポイントがマイナスになる場合はエラー
  IF v_new_points < 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'ポイントが不足しています'
    );
  END IF;

  -- ポイントを更新
  UPDATE profiles
  SET points = v_new_points
  WHERE id = p_user_id;

  -- 成功を返す
  RETURN json_build_object(
    'success', true,
    'previous_points', v_current_points,
    'points_change', p_points_change,
    'new_points', v_new_points
  );
END;
$$;

-- 関数にコメントを追加
COMMENT ON FUNCTION update_user_points IS 'ユーザーのポイント残高を更新する（清算時に使用）';
