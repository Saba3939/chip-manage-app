'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { RealtimeChannel } from '@supabase/supabase-js'

type BalanceRow = Database['public']['Tables']['balances']['Row']

/**
 * 残高の変更タイプ（UIアニメーション用）
 */
export type BalanceChange = {
  userId: string
  oldAmount: number
  newAmount: number
  changeType: 'increase' | 'decrease' | 'none'
}

/**
 * 残高情報をリアルタイムで購読するカスタムフック
 * balancesテーブルのINSERT/UPDATEイベントを監視し、
 * 残高リストを自動的に更新する
 */
export function useRealtimeBalances(sessionId: string | null) {
  const [balances, setBalances] = useState<BalanceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recentChange, setRecentChange] = useState<BalanceChange | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      return
    }

    const supabase = createClient()
    let channel: RealtimeChannel | null = null
    let isSubscribed = false

    const setupRealtimeSubscription = async () => {
      try {
        // 初期データを取得
        const { data: initialData, error: fetchError } = await supabase
          .from('balances')
          .select('*')
          .eq('session_id', sessionId)
          .order('amount', { ascending: false })

        if (fetchError) {
          throw fetchError
        }

        setBalances(initialData || [])
        setError(null)

        // 既存のチャンネルがあれば削除
        const existingChannels = supabase.getChannels()
        for (const ch of existingChannels) {
          if (ch.topic.includes('balances')) {
            await supabase.removeChannel(ch)
            console.log('Removed existing balances channel:', ch.topic)
          }
        }

        // リアルタイム購読を設定（ユニークなチャンネル名）
        const channelName = `balances:${sessionId}:${Date.now()}`
        console.log('Creating balances channel:', channelName)

        channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'balances'
            },
            (payload) => {
              console.log('Balance inserted:', payload)
              const newBalance = payload.new as BalanceRow

              // クライアント側でsession_idをフィルタリング
              if (newBalance.session_id !== sessionId) {
                return
              }

              setBalances((current) => {
                // 重複を防ぐ
                if (current.some(b => b.id === newBalance.id)) {
                  return current
                }
                return [...current, newBalance].sort((a, b) => b.amount - a.amount)
              })

              // 新規残高の追加は変更アニメーションなし
              setRecentChange({
                userId: newBalance.user_id,
                oldAmount: 0,
                newAmount: newBalance.amount,
                changeType: 'none'
              })
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'balances'
            },
            (payload) => {
              console.log('Balance updated:', payload)
              const updatedBalance = payload.new as BalanceRow

              // クライアント側でsession_idをフィルタリング
              if (updatedBalance.session_id !== sessionId) {
                return
              }

              setBalances((current) => {
                // 古い残高を取得して変更タイプを判定
                const oldBalance = current.find(b => b.id === updatedBalance.id)

                if (oldBalance) {
                  // 変更タイプを判定
                  const changeType: 'increase' | 'decrease' | 'none' =
                    updatedBalance.amount > oldBalance.amount
                      ? 'increase'
                      : updatedBalance.amount < oldBalance.amount
                      ? 'decrease'
                      : 'none'

                  setRecentChange({
                    userId: updatedBalance.user_id,
                    oldAmount: oldBalance.amount,
                    newAmount: updatedBalance.amount,
                    changeType
                  })

                  // 一定時間後にアニメーションをリセット
                  setTimeout(() => {
                    setRecentChange(null)
                  }, 2000)
                }

                const updated = current.map(b =>
                  b.id === updatedBalance.id ? updatedBalance : b
                )
                return updated.sort((a, b) => b.amount - a.amount)
              })
            }
          )
          .subscribe((status) => {
            console.log('Balance subscription status:', status)
            if (status === 'SUBSCRIBED') {
              isSubscribed = true
              setLoading(false)
              console.log('✅ Balances channel subscribed successfully')
            }
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              setError('リアルタイム接続に問題が発生しました')
            }
          })
      } catch (err) {
        console.error('Realtime balances setup error:', err)
        setError(err instanceof Error ? err.message : 'エラーが発生しました')
        setLoading(false)
      }
    }

    setupRealtimeSubscription()

    // クリーンアップ: コンポーネントのアンマウント時に購読を解除
    return () => {
      if (channel) {
        console.log('Unsubscribing from balances channel')
        supabase.removeChannel(channel)
      }
    }
  }, [sessionId])

  return { balances, loading, error, recentChange }
}
