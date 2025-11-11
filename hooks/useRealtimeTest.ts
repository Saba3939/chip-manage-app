'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Realtimeのテスト用フック
 * エラーの詳細をログに出力する
 */
export function useRealtimeTest(sessionId: string | null) {
  const [status, setStatus] = useState<string>('初期化中');
  const [errorDetails, setErrorDetails] = useState<any>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus('sessionIdがnull');
      return;
    }

    console.log('=== Realtime Test Start ===');
    console.log('Session ID:', sessionId);

    const supabase = createClient();

    // 最もシンプルなサブスクリプション
    const channel = supabase
      .channel(`test_${sessionId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: '' },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_participants',
        },
        (payload) => {
          console.log('=== Realtime Event Received ===');
          console.log('Payload:', payload);
        }
      )
      .subscribe((status, err) => {
        console.log('=== Subscription Status Changed ===');
        console.log('Status:', status);
        console.log('Error:', err);

        setStatus(status);

        if (err) {
          console.error('=== Subscription Error Details ===');
          console.error('Error object:', err);
          console.error('Error message:', err.message);
          console.error('Error stack:', err.stack);
          setErrorDetails(err);
        }

        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed!');
          setStatus('接続成功');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error occurred');
          setStatus('チャンネルエラー');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Subscription timed out');
          setStatus('タイムアウト');
        } else if (status === 'CLOSED') {
          console.warn('⚠️ Channel closed');
          setStatus('接続終了');
        }
      });

    return () => {
      console.log('=== Cleaning up Realtime Test ===');
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { status, errorDetails };
}
