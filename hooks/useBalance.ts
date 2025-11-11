'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * 特定のユーザーの残高をリアルタイムで取得・監視するカスタムフック
 * useRealtimeBalancesが全参加者の残高を監視するのに対し、
 * このフックは特定のユーザーの残高のみを監視する
 */
export function useBalance(sessionId: string | null, userId: string | null) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !userId) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const fetchBalance = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('balances')
          .select('amount')
          .eq('session_id', sessionId)
          .eq('user_id', userId)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        setBalance(data?.amount ?? null);
        setError(null);
      } catch (err) {
        console.error('Balance fetch error:', err);
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    // 初回取得
    fetchBalance();

    // リアルタイム購読を設定
    const channel = supabase
      .channel(`balance:${sessionId}:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'balances'
        },
        (payload) => {
          const newBalance = payload.new as any;
          // session_idとuser_idの両方でフィルタリング
          if (newBalance.session_id === sessionId && newBalance.user_id === userId) {
            setBalance(newBalance.amount ?? null);
          }
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
          const newBalance = payload.new as any;
          // session_idとuser_idの両方でフィルタリング
          if (newBalance.session_id === sessionId && newBalance.user_id === userId) {
            setBalance(newBalance.amount ?? null);
          }
        }
      )
      .subscribe();

    // クリーンアップ
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, userId]);

  return { balance, loading, error };
}
