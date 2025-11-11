'use client'

import { useEffect, useState } from 'react'
import { Database } from '@/lib/supabase/database.types'
import { Participant } from '@/lib/session/participants'

type SessionRow = Database['public']['Tables']['sessions']['Row']

/**
 * セッション情報を管理するカスタムフック
 */
export function useSession(sessionId: string | null) {
  const [session, setSession] = useState<SessionRow | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      return
    }

    const fetchSessionData = async () => {
      try {
        setLoading(true)
        setError(null)

        // セッション情報を取得
        const sessionResponse = await fetch(`/api/sessions/${sessionId}`)
        if (!sessionResponse.ok) {
          throw new Error('セッション情報の取得に失敗しました')
        }
        const sessionData = await sessionResponse.json()
        setSession(sessionData)

        // 参加者情報を取得
        const participantsResponse = await fetch(`/api/sessions/${sessionId}/participants`)
        if (!participantsResponse.ok) {
          throw new Error('参加者情報の取得に失敗しました')
        }
        const participantsData = await participantsResponse.json()
        setParticipants(participantsData)
      } catch (err) {
        console.error('Session fetch error:', err)
        setError(err instanceof Error ? err.message : 'エラーが発生しました')
      } finally {
        setLoading(false)
      }
    }

    fetchSessionData()
  }, [sessionId])

  return { session, participants, loading, error, refetch: () => {} }
}
