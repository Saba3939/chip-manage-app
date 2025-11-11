'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { RealtimeChannel } from '@supabase/supabase-js'

type SessionRow = Database['public']['Tables']['sessions']['Row']

/**
 * セッション情報をリアルタイムで購読するカスタムフック
 * sessionsテーブルのUPDATEイベントを監視し、
 * セッション情報を自動的に更新する
 */
export function useRealtimeSession(sessionId: string | null, initialSession: SessionRow | null = null) {
  const [session, setSession] = useState<SessionRow | null>(initialSession)
  const [loading, setLoading] = useState(!initialSession)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      return
    }

    const supabase = createClient()
    let channel: RealtimeChannel | null = null

    const setupRealtimeSubscription = async () => {
      try {
        // 初期データを取得（initialSessionがない場合のみ）
        if (!initialSession) {
          const { data: initialData, error: fetchError } = await supabase
            .from('sessions')
            .select('*')
            .eq('id', sessionId)
            .single()

          if (fetchError) {
            throw fetchError
          }

          setSession(initialData)
        } else {
          setSession(initialSession)
        }
        setError(null)

        // 既存のチャンネルがあれば削除
        const existingChannels = supabase.getChannels()
        for (const ch of existingChannels) {
          if (ch.topic.includes(`session:${sessionId}`)) {
            await supabase.removeChannel(ch)
            console.log('Removed existing session channel:', ch.topic)
          }
        }

        // リアルタイム購読を設定（ユニークなチャンネル名）
        const channelName = `session:${sessionId}:${Date.now()}`
        console.log('Creating session channel:', channelName)

        channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'sessions',
              filter: `id=eq.${sessionId}`
            },
            (payload) => {
              console.log('Session updated:', payload)
              const updatedSession = payload.new as SessionRow
              setSession(updatedSession)
            }
          )
          .subscribe((status) => {
            console.log('Session subscription status:', status)
            if (status === 'SUBSCRIBED') {
              setLoading(false)
              console.log('✅ Session channel subscribed successfully')
            }
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              setError('リアルタイム接続に問題が発生しました')
            }
          })
      } catch (err) {
        console.error('Realtime session setup error:', err)
        setError(err instanceof Error ? err.message : 'エラーが発生しました')
        setLoading(false)
      }
    }

    setupRealtimeSubscription()

    // クリーンアップ: コンポーネントのアンマウント時に購読を解除
    return () => {
      if (channel) {
        console.log('Unsubscribing from session channel')
        supabase.removeChannel(channel)
      }
    }
  }, [sessionId, initialSession])

  return { session, loading, error }
}
