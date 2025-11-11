'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/lib/supabase/database.types'

type SessionInsert = Database['public']['Tables']['sessions']['Insert']
type SessionRow = Database['public']['Tables']['sessions']['Row']

/**
 * セッションデータの型
 */
export type CreateSessionData = {
  name?: string
  initialChips?: number
  maxParticipants?: number
  rate?: number
}

/**
 * セッション作成
 * ホストを自動的にsession_participantsに追加し、balancesレコードを作成
 */
export async function createSession(data: CreateSessionData) {
  const supabase = await createClient()

  // 現在のユーザーを取得
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('User error:', userError)
    return { error: '認証エラー: ログインしてください', data: null }
  }

  console.log('Creating session for user:', user.id)

  // セッションを作成
  const sessionData: SessionInsert = {
    host_user_id: user.id,
    name: data.name || null,
    initial_chips: data.initialChips || 1000,
    max_participants: data.maxParticipants || 10,
    rate: data.rate || null,
    status: 'waiting',
  }

  console.log('Session data:', sessionData)

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert(sessionData)
    .select()
    .single()

  if (sessionError) {
    console.error('Session creation error:', sessionError)
    return { error: `セッションの作成に失敗しました: ${sessionError.message}`, data: null }
  }

  console.log('Session created:', session)

  // ホストを参加者として追加
  const { error: participantError } = await supabase
    .from('session_participants')
    .insert({
      session_id: session.id,
      user_id: user.id,
    })

  if (participantError) {
    console.error('Participant insertion error:', participantError)
    return { error: `参加者の追加に失敗しました: ${participantError.message}`, data: null }
  }

  console.log('Participant added')

  // ホストのbalanceレコードを作成
  const { error: balanceError } = await supabase.from('balances').insert({
    session_id: session.id,
    user_id: user.id,
    amount: session.initial_chips,
  })

  if (balanceError) {
    console.error('Balance creation error:', balanceError)
    return { error: `残高の作成に失敗しました: ${balanceError.message}`, data: null }
  }

  console.log('Balance created')

  revalidatePath('/dashboard')
  return { error: null, data: session }
}

/**
 * セッション参加
 * Supabase RPC関数を使用
 */
export async function joinSession(sessionId: string) {
  const supabase = await createClient()

  // 現在のユーザーを取得
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: '認証エラー: ログインしてください', data: null }
  }

  // Supabase RPC関数を呼び出し
  const { data, error } = await supabase.rpc('join_session', {
    p_session_id: sessionId,
    p_user_id: user.id,
  })

  if (error) {
    console.error('Join session error:', error)
    return { error: error.message || 'セッションへの参加に失敗しました', data: null }
  }

  const result = data as { success: boolean; message: string }

  if (!result.success) {
    return { error: result.message, data: null }
  }

  revalidatePath(`/session/${sessionId}`)
  return { error: null, data: result }
}

/**
 * セッション開始
 * ステータスをwaitingからactiveに変更し、全参加者のbalancesレコードを作成
 */
export async function startSession(sessionId: string) {
  const supabase = await createClient()

  // 現在のユーザーを取得
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: '認証エラー: ログインしてください' }
  }

  // セッション情報を取得
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    return { error: 'セッションが見つかりません' }
  }

  // ホスト権限チェック
  if (session.host_user_id !== user.id) {
    return { error: 'セッション開始の権限がありません' }
  }

  // ステータスチェック
  if (session.status !== 'waiting') {
    return { error: 'このセッションは既に開始されているか終了しています' }
  }

  // 参加者数をチェック
  const { count } = await supabase
    .from('session_participants')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)

  if (!count || count < 2) {
    return { error: '参加者が2人以上必要です' }
  }

  // 全参加者を取得
  const { data: participants, error: participantsError } = await supabase
    .from('session_participants')
    .select('user_id')
    .eq('session_id', sessionId)

  if (participantsError || !participants) {
    return { error: '参加者の取得に失敗しました' }
  }

  // 既存のbalancesを確認
  const { data: existingBalances } = await supabase
    .from('balances')
    .select('user_id')
    .eq('session_id', sessionId)

  const existingUserIds = new Set(existingBalances?.map((b) => b.user_id) || [])

  // まだbalancesがない参加者のために作成
  const newBalances = participants
    .filter((p) => !existingUserIds.has(p.user_id))
    .map((p) => ({
      session_id: sessionId,
      user_id: p.user_id,
      amount: session.initial_chips,
    }))

  if (newBalances.length > 0) {
    const { error: balancesError } = await supabase
      .from('balances')
      .insert(newBalances)

    if (balancesError) {
      console.error('Balances creation error:', balancesError)
      return { error: '残高の初期化に失敗しました' }
    }
  }

  // レートが設定されている場合、参加者からエントリーポイントを引く
  if (session.rate) {
    const { data: deductResult, error: deductError } = await supabase.rpc(
      'deduct_entry_points',
      {
        p_session_id: sessionId,
      }
    )

    if (deductError) {
      console.error('Deduct entry points error:', deductError)
      return { error: 'エントリーポイントの引き落としに失敗しました' }
    }

    const result = deductResult as { success: boolean; error?: string }

    if (!result.success) {
      return { error: result.error || 'エントリーポイントの引き落としに失敗しました' }
    }
  }

  // セッションをactiveに更新
  const { error: updateError } = await supabase
    .from('sessions')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (updateError) {
    return { error: 'セッションの開始に失敗しました' }
  }

  revalidatePath(`/session/${sessionId}`)
  return { error: null }
}

/**
 * セッション終了
 * ステータスをactiveからcompletedに変更
 */
export async function endSession(sessionId: string) {
  const supabase = await createClient()

  // 現在のユーザーを取得
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: '認証エラー: ログインしてください' }
  }

  // セッション情報を取得
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    return { error: 'セッションが見つかりません' }
  }

  // ホスト権限チェック
  if (session.host_user_id !== user.id) {
    return { error: 'セッション終了の権限がありません' }
  }

  // ステータスチェック
  if (session.status !== 'active') {
    return { error: 'このセッションはまだ開始されていないか、既に終了しています' }
  }

  // セッションをcompletedに更新
  const { error: updateError } = await supabase
    .from('sessions')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (updateError) {
    return { error: 'セッションの終了に失敗しました' }
  }

  revalidatePath(`/session/${sessionId}`)
  revalidatePath('/dashboard')
  return { error: null }
}

/**
 * セッション詳細取得
 */
export async function getSession(sessionId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error) {
    console.error('Get session error:', error)
    return null
  }

  return data
}

/**
 * ユーザーのセッション一覧取得
 */
export async function getSessionsByUser(userId: string) {
  const supabase = await createClient()

  // ユーザーが参加しているセッションIDを取得
  const { data: participantData, error: participantError } = await supabase
    .from('session_participants')
    .select('session_id')
    .eq('user_id', userId)

  if (participantError) {
    console.error('Get participants error:', participantError)
    return []
  }

  const sessionIds = participantData.map((p) => p.session_id)

  if (sessionIds.length === 0) {
    return []
  }

  // セッション情報を取得
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('*')
    .in('id', sessionIds)
    .order('created_at', { ascending: false })

  if (sessionsError) {
    console.error('Get sessions error:', sessionsError)
    return []
  }

  return sessions
}

/**
 * アクティブなセッション取得
 */
export async function getActiveSession(userId: string) {
  const supabase = await createClient()

  // ユーザーが参加しているアクティブなセッションを取得
  const { data: participantData, error: participantError } = await supabase
    .from('session_participants')
    .select('session_id')
    .eq('user_id', userId)

  if (participantError) {
    console.error('Get participants error:', participantError)
    return null
  }

  const sessionIds = participantData.map((p) => p.session_id)

  if (sessionIds.length === 0) {
    return null
  }

  // アクティブなセッションを取得
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .in('id', sessionIds)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Get active session error:', error)
    return null
  }

  return data
}
