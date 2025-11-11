'use client';

import { useState, useCallback } from 'react';
import { transferChips } from '@/lib/chip/actions';

interface TransferParams {
  sessionId: string;
  toUserId: string;
  amount: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * チップ送信処理を管理するカスタムフック
 */
export function useChipTransfer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * チップを送信する
   */
  const transfer = useCallback(
    async ({
      sessionId,
      toUserId,
      amount,
      onSuccess,
      onError,
    }: TransferParams) => {
      setLoading(true);
      setError(null);

      try {
        // 認証ユーザーIDを取得（後でサーバー側でも確認される）
        // クライアント側では送信者IDは送らず、サーバー側で認証ユーザーを使用する
        // しかし、今回のRPC Functionは送信者IDを引数として受け取るため、
        // クライアント側でユーザーIDを取得する必要がある

        // Server Actionでユーザー認証を行うため、ここでは単純に呼び出す
        // Server Action内で現在のユーザーIDを取得し、from_user_idとして使用する
        // しかし、RPC Functionの設計上、fromUserIdも引数として受け取る必要がある

        // より良い実装: Server ActionでfromUserIdを自動的に取得する
        // 今回は一旦、クライアントからfromUserIdを渡さず、Server Actionで取得する形にする
        // → actionsを修正する必要があるが、今回はRPC Functionの引数に合わせる

        // クライアント側でユーザーIDを取得
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          const errorMsg = 'ログインが必要です';
          setError(errorMsg);
          onError?.(errorMsg);
          setLoading(false);
          return { success: false, error: errorMsg };
        }

        // Server Actionを呼び出し
        const result = await transferChips(
          sessionId,
          user.id,
          toUserId,
          amount
        );

        if (!result.success) {
          const errorMsg = result.error || 'チップの送信に失敗しました';
          setError(errorMsg);
          onError?.(errorMsg);
          setLoading(false);
          return result;
        }

        // 成功時のコールバック
        onSuccess?.();
        setLoading(false);
        return result;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'エラーが発生しました';
        setError(errorMsg);
        onError?.(errorMsg);
        setLoading(false);
        return { success: false, error: errorMsg };
      }
    },
    []
  );

  /**
   * エラーをクリアする
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    transfer,
    loading,
    error,
    clearError,
  };
}
