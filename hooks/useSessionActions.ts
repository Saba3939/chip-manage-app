'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  createSession as createSessionAction,
  joinSession as joinSessionAction,
  startSession as startSessionAction,
  endSession as endSessionAction,
  CreateSessionData,
} from '@/lib/session/actions'

/**
 * セッション操作関数をラップするカスタムフック
 */
export function useSessionActions() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  /**
   * セッション作成
   */
  const createSession = async (data: CreateSessionData) => {
    setLoading(true)
    try {
      const result = await createSessionAction(data)

      if (result.error) {
        toast.error(result.error)
        return { error: result.error, data: null }
      }

      toast.success('セッションを作成しました')

      return { error: null, data: result.data }
    } catch (error) {
      const message = 'セッションの作成に失敗しました'
      toast.error(message)
      return { error: message, data: null }
    } finally {
      setLoading(false)
    }
  }

  /**
   * セッション参加
   */
  const joinSession = async (sessionId: string) => {
    setLoading(true)
    try {
      const result = await joinSessionAction(sessionId)

      if (result.error) {
        toast.error(result.error)
        return { error: result.error }
      }

      toast.success('セッションに参加しました')

      return { error: null }
    } catch (error) {
      const message = 'セッションへの参加に失敗しました'
      toast.error(message)
      return { error: message }
    } finally {
      setLoading(false)
    }
  }

  /**
   * セッション開始
   */
  const startSession = async (sessionId: string) => {
    setLoading(true)
    try {
      const result = await startSessionAction(sessionId)

      if (result.error) {
        toast.error(result.error)
        return { error: result.error }
      }

      toast.success('セッションを開始しました')

      // リアルタイム購読により自動的に更新されるため、router.refresh()は不要

      return { error: null }
    } catch (error) {
      const message = 'セッションの開始に失敗しました'
      toast.error(message)
      return { error: message }
    } finally {
      setLoading(false)
    }
  }

  /**
   * セッション終了
   */
  const endSession = async (sessionId: string) => {
    setLoading(true)
    try {
      const result = await endSessionAction(sessionId)

      if (result.error) {
        toast.error(result.error)
        return { error: result.error }
      }

      toast.success('セッションを終了しました')

      // 清算画面へリダイレクト
      router.push(`/session/${sessionId}/settlement`)

      return { error: null }
    } catch (error) {
      const message = 'セッションの終了に失敗しました'
      toast.error(message)
      return { error: message }
    } finally {
      setLoading(false)
    }
  }

  return {
    createSession,
    joinSession,
    startSession,
    endSession,
    loading,
  }
}
