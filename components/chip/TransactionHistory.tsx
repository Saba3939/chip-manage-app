'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RealtimeChannel } from '@supabase/supabase-js';

type Transaction = Database['public']['Tables']['transactions']['Row'];

type TransactionWithProfiles = Transaction & {
  from_profile: {
    display_name: string | null;
  } | null;
  to_profile: {
    display_name: string | null;
  } | null;
};

interface TransactionHistoryProps {
  sessionId: string;
  limit?: number;
  currentUserId?: string;
}

/**
 * トランザクション履歴コンポーネント
 * セッション内のチップ送受信履歴をリアルタイムで表示
 */
export function TransactionHistory({
  sessionId,
  limit = 20,
  currentUserId,
}: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<TransactionWithProfiles[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    let channel: RealtimeChannel | null = null;
    let isSubscribed = false;

    const setupRealtimeSubscription = async () => {
      try {
        // トランザクションデータを取得
        const { data: transactionsData, error: fetchError } = await supabase
          .from('transactions')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (fetchError) {
          throw fetchError;
        }

        // トランザクションがある場合はprofilesを取得
        let transactionsWithProfiles: TransactionWithProfiles[] = [];

        if (transactionsData && transactionsData.length > 0) {
          // ユーザーIDのリストを取得
          const userIds = Array.from(
            new Set([
              ...transactionsData.map((t) => t.from_user_id),
              ...transactionsData.map((t) => t.to_user_id),
            ])
          );

          // profilesを取得
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', userIds);

          if (profilesError) {
            console.error('Failed to fetch profiles:', profilesError);
          }

          // profilesをマップに変換
          const profilesMap = (profilesData || []).reduce(
            (acc, profile) => {
              acc[profile.id] = { display_name: profile.display_name };
              return acc;
            },
            {} as Record<string, { display_name: string | null }>
          );

          // トランザクションとprofilesを結合
          transactionsWithProfiles = transactionsData.map((transaction) => ({
            ...transaction,
            from_profile: profilesMap[transaction.from_user_id] || null,
            to_profile: profilesMap[transaction.to_user_id] || null,
          }));
        }

        setTransactions(transactionsWithProfiles);
        setError(null);
        setLoading(false); // 初期データ取得完了時にloadingを解除

        // 既存のチャンネルがあれば削除
        const existingChannels = supabase.getChannels();
        for (const ch of existingChannels) {
          if (ch.topic.includes('transactions') && ch.topic.includes(sessionId)) {
            await supabase.removeChannel(ch);
            console.log('Removed existing transactions channel:', ch.topic);
          }
        }

        // リアルタイム購読を設定（ユニークなチャンネル名）
        const channelName = `transactions:${sessionId}:${Date.now()}`;
        console.log('Creating transactions channel:', channelName);

        channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'transactions'
            },
            async (payload) => {
              console.log('Transaction inserted:', payload);
              const newTransaction = payload.new as Transaction;

              // クライアント側でsession_idをフィルタリング
              if (newTransaction.session_id !== sessionId) {
                return;
              }

              // 新しいトランザクションのprofiles情報を取得
              const userIds = [newTransaction.from_user_id, newTransaction.to_user_id];
              const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, display_name')
                .in('id', userIds);

              const profilesMap = (profilesData || []).reduce(
                (acc, profile) => {
                  acc[profile.id] = { display_name: profile.display_name };
                  return acc;
                },
                {} as Record<string, { display_name: string | null }>
              );

              const transactionWithProfiles = {
                ...newTransaction,
                from_profile: profilesMap[newTransaction.from_user_id] || null,
                to_profile: profilesMap[newTransaction.to_user_id] || null,
              };

              setTransactions((current) => {
                // 重複を防ぐ
                if (current.some((t) => t.id === newTransaction.id)) {
                  return current;
                }
                // 新しいトランザクションを先頭に追加し、limitを適用
                return [transactionWithProfiles, ...current].slice(0, limit);
              });
            }
          )
          .subscribe((status) => {
            console.log('Transaction subscription status:', status);
            if (status === 'SUBSCRIBED') {
              isSubscribed = true;
              console.log('✅ Transactions channel subscribed successfully');
            }
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              setError('リアルタイム接続に問題が発生しました');
            }
          });
      } catch (err) {
        console.error('Realtime transactions setup error:', err);
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
        setLoading(false);
      }
    };

    setupRealtimeSubscription();

    // クリーンアップ
    return () => {
      console.log('🧹 Cleaning up transactions subscription');
      if (channel) {
        console.log('Unsubscribing from transactions channel:', channel.topic);
        supabase.removeChannel(channel);
      }
      isSubscribed = false;
    };
  }, [sessionId, limit]);

  /**
   * 表示名を取得（フォールバック付き）
   */
  const getDisplayName = (
    profile: { display_name: string | null } | null,
    userId: string
  ) => {
    return profile?.display_name || `ユーザー ${userId.slice(0, 8)}`;
  };

  /**
   * トランザクションが自分に関連するかチェック
   */
  const isRelatedToCurrentUser = (transaction: Transaction) => {
    if (!currentUserId) return false;
    return (
      transaction.from_user_id === currentUserId ||
      transaction.to_user_id === currentUserId
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>送受信履歴</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-600">読み込み中...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>送受信履歴</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>送受信履歴</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-sm text-neutral-600 text-center py-8">
            まだ取引履歴がありません
          </p>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {transactions.map((transaction) => {
                const isHighlighted = isRelatedToCurrentUser(transaction);
                return (
                  <div
                    key={transaction.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isHighlighted
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-neutral-50 border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {/* 送信者 */}
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getDisplayName(
                              transaction.from_profile,
                              transaction.from_user_id
                            )[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {getDisplayName(
                            transaction.from_profile,
                            transaction.from_user_id
                          )}
                        </span>
                      </div>

                      <ArrowRight className="h-4 w-4 text-neutral-400 flex-shrink-0" />

                      {/* 受取人 */}
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getDisplayName(
                              transaction.to_profile,
                              transaction.to_user_id
                            )[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {getDisplayName(
                            transaction.to_profile,
                            transaction.to_user_id
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <div className="text-sm font-bold text-neutral-900">
                        {transaction.amount.toLocaleString()}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {formatDistanceToNow(
                          new Date(transaction.created_at),
                          {
                            addSuffix: true,
                            locale: ja,
                          }
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
