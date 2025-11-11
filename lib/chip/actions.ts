'use server';

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/database.types';

type TransferChipsResponse = {
  success: boolean;
  error?: string;
  from_balance?: number;
  to_balance?: number;
};

type Transaction = Database['public']['Tables']['transactions']['Row'];
type Balance = Database['public']['Tables']['balances']['Row'];

/**
 * チップを送信する
 * Supabase RPC Function `transfer_chips` を呼び出す
 */
export async function transferChips(
  sessionId: string,
  fromUserId: string,
  toUserId: string,
  amount: number
): Promise<TransferChipsResponse> {
  try {
    const supabase = await createClient();

    // 認証チェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    // 送信者が現在のユーザーと一致するか確認
    if (user.id !== fromUserId) {
      return {
        success: false,
        error: '自分のアカウントからのみ送信できます',
      };
    }

    // RPC Functionを呼び出し
    const { data, error } = await supabase.rpc('transfer_chips', {
      p_session_id: sessionId,
      p_from_user_id: fromUserId,
      p_to_user_id: toUserId,
      p_amount: amount,
    });

    if (error) {
      console.error('Transfer chips RPC error:', error);
      return {
        success: false,
        error: 'チップの送信に失敗しました',
      };
    }

    // RPC Functionからのレスポンスを解析
    const response = data as TransferChipsResponse;

    if (!response.success) {
      return response;
    }

    return response;
  } catch (error) {
    console.error('Transfer chips error:', error);
    return {
      success: false,
      error: 'チップの送信中にエラーが発生しました',
    };
  }
}

/**
 * 残高を取得する
 */
export async function getBalance(
  sessionId: string,
  userId: string
): Promise<{ balance: number | null; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('balances')
      .select('amount')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Get balance error:', error);
      return { balance: null, error: '残高の取得に失敗しました' };
    }

    return { balance: data?.amount ?? null };
  } catch (error) {
    console.error('Get balance error:', error);
    return { balance: null, error: '残高の取得中にエラーが発生しました' };
  }
}

/**
 * セッション内の全参加者の残高を取得する
 */
export async function getAllBalances(
  sessionId: string
): Promise<{ balances: Balance[]; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('balances')
      .select('*')
      .eq('session_id', sessionId)
      .order('amount', { ascending: false });

    if (error) {
      console.error('Get all balances error:', error);
      return { balances: [], error: '残高一覧の取得に失敗しました' };
    }

    return { balances: data || [] };
  } catch (error) {
    console.error('Get all balances error:', error);
    return {
      balances: [],
      error: '残高一覧の取得中にエラーが発生しました',
    };
  }
}

/**
 * トランザクション履歴を取得する
 */
export async function getTransactions(
  sessionId: string
): Promise<{ transactions: Transaction[]; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get transactions error:', error);
      return { transactions: [], error: '履歴の取得に失敗しました' };
    }

    return { transactions: data || [] };
  } catch (error) {
    console.error('Get transactions error:', error);
    return { transactions: [], error: '履歴の取得中にエラーが発生しました' };
  }
}

/**
 * 最近のトランザクション履歴を取得する（件数制限付き）
 */
export async function getRecentTransactions(
  sessionId: string,
  limit: number = 10
): Promise<{ transactions: Transaction[]; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Get recent transactions error:', error);
      return { transactions: [], error: '履歴の取得に失敗しました' };
    }

    return { transactions: data || [] };
  } catch (error) {
    console.error('Get recent transactions error:', error);
    return { transactions: [], error: '履歴の取得中にエラーが発生しました' };
  }
}
