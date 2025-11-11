'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * 参加者情報の型
 */
export type Participant = {
  id: string
  session_id: string
  user_id: string
  joined_at: string
  profiles?: {
    display_name: string | null
    avatar_url: string | null
  }
}

/**
 * 参加者一覧取得
 */
export async function getParticipants(sessionId: string): Promise<Participant[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('session_participants')
    .select('*')
    .eq('session_id', sessionId)
    .order('joined_at', { ascending: true })

  if (error) {
    console.error('Get participants error:', error)
    return []
  }

  // プロファイル情報を別途取得
  if (data && data.length > 0) {
    const userIds = data.map(p => p.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds)

    // プロファイル情報をマージ
    const participantsWithProfiles = data.map(participant => ({
      ...participant,
      profiles: profiles?.find(p => p.id === participant.user_id) || null
    }))

    return participantsWithProfiles as Participant[]
  }

  return data as Participant[]
}

/**
 * 参加者数取得
 */
export async function getParticipantCount(sessionId: string): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('session_participants')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)

  if (error) {
    console.error('Get participant count error:', error)
    return 0
  }

  return count || 0
}

/**
 * 参加確認
 */
export async function isParticipant(sessionId: string, userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('session_participants')
    .select('id')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Check participant error:', error)
    return false
  }

  return !!data
}

/**
 * ホスト確認
 */
export async function isHost(sessionId: string, userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sessions')
    .select('host_user_id')
    .eq('id', sessionId)
    .single()

  if (error) {
    console.error('Check host error:', error)
    return false
  }

  return data.host_user_id === userId
}

/**
 * セッション退出
 */
export async function leaveSession(sessionId: string, userId: string) {
  const supabase = await createClient()

  // セッション情報を取得
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('host_user_id, status')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    return { error: 'セッションが見つかりません' }
  }

  // ホストは退出できない
  if (session.host_user_id === userId) {
    return { error: 'ホストはセッションから退出できません' }
  }

  // アクティブなセッションからは退出できない
  if (session.status === 'active') {
    return { error: 'アクティブなセッションからは退出できません' }
  }

  // 参加者レコードを削除
  const { error: deleteParticipantError } = await supabase
    .from('session_participants')
    .delete()
    .eq('session_id', sessionId)
    .eq('user_id', userId)

  if (deleteParticipantError) {
    console.error('Leave session error:', deleteParticipantError)
    return { error: 'セッションからの退出に失敗しました' }
  }

  // balancesレコードも削除（存在する場合）
  const { error: deleteBalanceError } = await supabase
    .from('balances')
    .delete()
    .eq('session_id', sessionId)
    .eq('user_id', userId)

  if (deleteBalanceError) {
    console.error('Delete balance error:', deleteBalanceError)
    // balancesの削除が失敗してもエラーにしない（存在しない可能性がある）
  }

  revalidatePath(`/session/${sessionId}`)
  revalidatePath('/dashboard')
  return { error: null }
}

/**
 * 参加者の残高情報を含む詳細取得
 */
export async function getParticipantsWithBalance(sessionId: string) {
  const supabase = await createClient()

  // 参加者を取得
  const { data: participants, error: participantsError } = await supabase
    .from('session_participants')
    .select('*')
    .eq('session_id', sessionId)
    .order('joined_at', { ascending: true })

  if (participantsError) {
    console.error('Get participants with balance error:', participantsError)
    return []
  }

  if (!participants || participants.length === 0) {
    return []
  }

  const userIds = participants.map(p => p.user_id)

  // プロファイル情報を取得
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', userIds)

  // 残高情報を取得
  const { data: balances } = await supabase
    .from('balances')
    .select('user_id, amount, updated_at')
    .eq('session_id', sessionId)
    .in('user_id', userIds)

  // データをマージ
  const result = participants.map(participant => ({
    ...participant,
    profiles: profiles?.find(p => p.id === participant.user_id) || null,
    balances: balances?.filter(b => b.user_id === participant.user_id) || []
  }))

  return result
}
