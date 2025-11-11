'use server'

import { createClient } from '@/lib/supabase/server'
import { SettlementData, SettlementResult } from './types'

/**
 * セッションの清算データを計算する
 */
export async function calculateSettlement(
  sessionId: string
): Promise<SettlementResult> {
  try {
    const supabase = await createClient()

    // セッション情報を取得
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError) {
      throw sessionError
    }

    if (!session) {
      return {
        data: null,
        error: 'セッションが見つかりませんでした',
      }
    }

    // 参加者リストを取得
    const { data: participants, error: participantsError } = await supabase
      .from('session_participants')
      .select('id, user_id, joined_at')
      .eq('session_id', sessionId)
      .order('joined_at', { ascending: true })

    if (participantsError) {
      throw participantsError
    }

    if (!participants || participants.length === 0) {
      return {
        data: null,
        error: '参加者が見つかりませんでした',
      }
    }

    // 参加者のユーザーIDリストを取得
    const userIds = participants.map((p) => p.user_id)

    // プロファイル情報を取得
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name, points')
      .in('id', userIds)

    if (profilesError) {
      throw profilesError
    }

    // プロファイルをマップに変換
    const profilesMap = (profiles || []).reduce(
      (acc, profile) => {
        acc[profile.id] = {
          displayName: profile.display_name,
          points: profile.points,
        }
        return acc
      },
      {} as Record<string, { displayName: string | null; points: number }>
    )

    // 残高情報を取得
    const { data: balances, error: balancesError } = await supabase
      .from('balances')
      .select('user_id, amount')
      .eq('session_id', sessionId)

    if (balancesError) {
      throw balancesError
    }

    // 残高をマップに変換
    const balancesMap = (balances || []).reduce(
      (acc, balance) => {
        acc[balance.user_id] = balance.amount
        return acc
      },
      {} as Record<string, number>
    )

    // 清算データを計算
    const settlementParticipants = participants.map((participant) => {
      const initialChips = session.initial_chips
      const finalChips = balancesMap[participant.user_id] ?? initialChips
      const difference = finalChips - initialChips
      const settlementAmount = session.rate
        ? difference * session.rate
        : 0
      const profile = profilesMap[participant.user_id]
      const currentPoints = profile?.points || 0
      // 清算後のポイント = 現在のポイント + (最終チップ数 × レート)
      const pointsAfterSettlement = session.rate
        ? currentPoints + (finalChips * session.rate)
        : currentPoints

      return {
        userId: participant.user_id,
        displayName:
          profile?.displayName ||
          `ユーザー ${participant.user_id.slice(0, 8)}`,
        initialChips,
        finalChips,
        difference,
        settlementAmount,
        currentPoints,
        pointsAfterSettlement,
      }
    })

    // 合計を計算
    const totalInitial = settlementParticipants.reduce(
      (sum, p) => sum + p.initialChips,
      0
    )
    const totalFinal = settlementParticipants.reduce(
      (sum, p) => sum + p.finalChips,
      0
    )
    const totalDifference = totalFinal - totalInitial
    const totalSettlement = settlementParticipants.reduce(
      (sum, p) => sum + p.settlementAmount,
      0
    )

    // チップ総数が一致するかチェック
    const isValid = totalInitial === totalFinal

    const settlementData: SettlementData = {
      sessionId: session.id,
      sessionName: session.name,
      participants: settlementParticipants,
      totalInitial,
      totalFinal,
      totalDifference,
      totalSettlement,
      rate: session.rate,
      isValid,
      createdAt: session.created_at,
    }

    return {
      data: settlementData,
      error: null,
    }
  } catch (error) {
    console.error('Failed to calculate settlement:', error)
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : '清算データの計算に失敗しました',
    }
  }
}

/**
 * セッションのレートを設定する
 */
export async function updateSessionRate(
  sessionId: string,
  rate: number
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('sessions')
      .update({ rate, updated_at: new Date().toISOString() })
      .eq('id', sessionId)

    if (error) {
      throw error
    }

    return { error: null }
  } catch (error) {
    console.error('Failed to update session rate:', error)
    return {
      error:
        error instanceof Error
          ? error.message
          : 'レートの更新に失敗しました',
    }
  }
}

/**
 * 清算を確定してセッションを完全に終了する
 * ポイントを各参加者のアカウントに反映する
 */
export async function confirmSettlement(
  sessionId: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()

    // セッション情報を取得
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('status')
      .eq('id', sessionId)
      .single()

    if (sessionError) {
      throw sessionError
    }

    if (session?.status !== 'completed') {
      return {
        error: 'セッションがまだ終了していません',
      }
    }

    // 清算データを計算
    const settlementResult = await calculateSettlement(sessionId)

    if (settlementResult.error || !settlementResult.data) {
      return {
        error: settlementResult.error || '清算データの取得に失敗しました',
      }
    }

    // レートが設定されている場合、各参加者のポイントを更新
    if (settlementResult.data.rate) {
      for (const participant of settlementResult.data.participants) {
        // 最終チップ数 × レート をポイントとして加算
        const pointsToAdd = participant.finalChips * settlementResult.data.rate

        const { error: updateError } = await supabase.rpc(
          'update_user_points',
          {
            p_user_id: participant.userId,
            p_points_change: pointsToAdd,
          }
        )

        if (updateError) {
          console.error('Failed to update points for user:', participant.userId, updateError)
          // エラーが発生しても続行（他のユーザーの処理を優先）
        }
      }
    }

    // 清算確定のフラグを更新
    const { error } = await supabase
      .from('sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId)

    if (error) {
      throw error
    }

    return { error: null }
  } catch (error) {
    console.error('Failed to confirm settlement:', error)
    return {
      error:
        error instanceof Error
          ? error.message
          : '清算の確定に失敗しました',
    }
  }
}
