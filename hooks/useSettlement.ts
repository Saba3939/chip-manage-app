'use client'

import { useEffect, useState } from 'react'
import { calculateSettlement } from '@/lib/settlement/actions'
import { SettlementData } from '@/lib/settlement/types'

/**
 * 清算データを管理するカスタムフック
 */
export function useSettlement(sessionId: string | null) {
  const [settlement, setSettlement] = useState<SettlementData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      return
    }

    const fetchSettlement = async () => {
      setLoading(true)
      setError(null)

      const result = await calculateSettlement(sessionId)

      if (result.error) {
        setError(result.error)
        setSettlement(null)
      } else {
        setSettlement(result.data)
        setError(null)
      }

      setLoading(false)
    }

    fetchSettlement()
  }, [sessionId])

  /**
   * 清算データを再取得する
   */
  const refresh = async () => {
    if (!sessionId) return

    setLoading(true)
    const result = await calculateSettlement(sessionId)

    if (result.error) {
      setError(result.error)
      setSettlement(null)
    } else {
      setSettlement(result.data)
      setError(null)
    }

    setLoading(false)
  }

  return {
    settlement,
    loading,
    error,
    refresh,
  }
}
