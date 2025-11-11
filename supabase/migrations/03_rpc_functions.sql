-- =========================================
-- チップ送受信のRPC Function
-- =========================================

CREATE OR REPLACE FUNCTION transfer_chips(
  p_session_id UUID,
  p_from_user_id UUID,
  p_to_user_id UUID,
  p_amount INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- サービスロールで実行
AS $$
DECLARE
  v_from_balance INTEGER;
  v_to_balance INTEGER;
BEGIN
  -- パラメータの検証
  IF p_amount <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', '送信額は1以上である必要があります'
    );
  END IF;

  IF p_from_user_id = p_to_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', '自分自身には送信できません'
    );
  END IF;

  -- セッションの存在確認
  IF NOT EXISTS (SELECT 1 FROM sessions WHERE id = p_session_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'セッションが存在しません'
    );
  END IF;

  -- 送信者がセッションに参加しているか確認
  IF NOT EXISTS (
    SELECT 1 FROM session_participants
    WHERE session_id = p_session_id AND user_id = p_from_user_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', '送信者がセッションに参加していません'
    );
  END IF;

  -- 受取人がセッションに参加しているか確認
  IF NOT EXISTS (
    SELECT 1 FROM session_participants
    WHERE session_id = p_session_id AND user_id = p_to_user_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', '受取人がセッションに参加していません'
    );
  END IF;

  -- トランザクション開始（外部トランザクションに含まれる）
  -- 送信者の残高取得
  SELECT amount INTO v_from_balance
  FROM balances
  WHERE session_id = p_session_id AND user_id = p_from_user_id
  FOR UPDATE; -- 行ロック

  -- 送信者の残高が不足していないか確認
  IF v_from_balance IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', '送信者の残高情報が見つかりません'
    );
  END IF;

  IF v_from_balance < p_amount THEN
    RETURN json_build_object(
      'success', false,
      'error', '残高が不足しています'
    );
  END IF;

  -- 受取人の残高取得
  SELECT amount INTO v_to_balance
  FROM balances
  WHERE session_id = p_session_id AND user_id = p_to_user_id
  FOR UPDATE; -- 行ロック

  IF v_to_balance IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', '受取人の残高情報が見つかりません'
    );
  END IF;

  -- 送信者の残高を減算
  UPDATE balances
  SET amount = amount - p_amount
  WHERE session_id = p_session_id AND user_id = p_from_user_id;

  -- 受取人の残高を加算
  UPDATE balances
  SET amount = amount + p_amount
  WHERE session_id = p_session_id AND user_id = p_to_user_id;

  -- トランザクション履歴を記録
  INSERT INTO transactions (session_id, from_user_id, to_user_id, amount)
  VALUES (p_session_id, p_from_user_id, p_to_user_id, p_amount);

  -- 成功を返す
  RETURN json_build_object(
    'success', true,
    'from_balance', v_from_balance - p_amount,
    'to_balance', v_to_balance + p_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    -- エラーが発生した場合はロールバック
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- =========================================
-- セッション参加時の初期残高設定RPC Function
-- =========================================

CREATE OR REPLACE FUNCTION join_session(
  p_session_id UUID,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_initial_chips INTEGER;
  v_max_participants INTEGER;
  v_current_participants INTEGER;
BEGIN
  -- セッション情報を取得
  SELECT initial_chips, max_participants
  INTO v_initial_chips, v_max_participants
  FROM sessions
  WHERE id = p_session_id;

  IF v_initial_chips IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'セッションが存在しません'
    );
  END IF;

  -- 現在の参加者数を確認
  SELECT COUNT(*) INTO v_current_participants
  FROM session_participants
  WHERE session_id = p_session_id;

  IF v_current_participants >= v_max_participants THEN
    RETURN json_build_object(
      'success', false,
      'error', 'セッションは満員です'
    );
  END IF;

  -- 既に参加しているか確認
  IF EXISTS (
    SELECT 1 FROM session_participants
    WHERE session_id = p_session_id AND user_id = p_user_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', '既にこのセッションに参加しています'
    );
  END IF;

  -- 参加者テーブルに追加
  INSERT INTO session_participants (session_id, user_id)
  VALUES (p_session_id, p_user_id);

  -- 初期残高を設定
  INSERT INTO balances (session_id, user_id, amount)
  VALUES (p_session_id, p_user_id, v_initial_chips);

  RETURN json_build_object(
    'success', true,
    'initial_chips', v_initial_chips
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;
