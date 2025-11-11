import type { User, Session, Participant, Balance, Transaction, SessionWithDetails } from '@/types';

/**
 * モックユーザーデータ
 */
export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'kento@example.com',
    display_name: 'けんと',
  },
  {
    id: 'user-2',
    email: 'tanaka@example.com',
    display_name: '田中',
  },
  {
    id: 'user-3',
    email: 'sato@example.com',
    display_name: '佐藤',
  },
  {
    id: 'user-4',
    email: 'suzuki@example.com',
    display_name: '鈴木',
  },
  {
    id: 'user-5',
    email: 'yamada@example.com',
    display_name: '山田',
  },
];

/**
 * 現在ログイン中のユーザー（モック）
 */
export const currentUser: User = mockUsers[0];

/**
 * モックセッションデータ
 */
export const mockSessions: Session[] = [
  {
    id: 'session-1',
    host_user_id: 'user-1',
    name: '今日のポーカー',
    initial_chips: 1000,
    max_participants: 10,
    rate: 10,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'session-2',
    host_user_id: 'user-2',
    name: '週末テキサスホールデム',
    initial_chips: 2000,
    max_participants: 8,
    rate: 20,
    status: 'waiting',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'session-3',
    host_user_id: 'user-1',
    name: '練習セッション',
    initial_chips: 500,
    max_participants: 6,
    status: 'completed',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'session-4',
    host_user_id: 'user-3',
    name: 'トランプナイト',
    initial_chips: 1500,
    max_participants: 12,
    rate: 15,
    status: 'active',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString(),
  },
];

/**
 * モック参加者データ
 */
export const mockParticipants: Participant[] = [
  // Session 1の参加者
  {
    id: 'participant-1',
    session_id: 'session-1',
    user_id: 'user-1',
    joined_at: new Date().toISOString(),
    user: mockUsers[0],
  },
  {
    id: 'participant-2',
    session_id: 'session-1',
    user_id: 'user-2',
    joined_at: new Date().toISOString(),
    user: mockUsers[1],
  },
  {
    id: 'participant-3',
    session_id: 'session-1',
    user_id: 'user-3',
    joined_at: new Date().toISOString(),
    user: mockUsers[2],
  },
  {
    id: 'participant-4',
    session_id: 'session-1',
    user_id: 'user-4',
    joined_at: new Date().toISOString(),
    user: mockUsers[3],
  },
  // Session 2の参加者
  {
    id: 'participant-5',
    session_id: 'session-2',
    user_id: 'user-2',
    joined_at: new Date(Date.now() - 3600000).toISOString(),
    user: mockUsers[1],
  },
  {
    id: 'participant-6',
    session_id: 'session-2',
    user_id: 'user-5',
    joined_at: new Date(Date.now() - 3500000).toISOString(),
    user: mockUsers[4],
  },
  // Session 3の参加者
  {
    id: 'participant-7',
    session_id: 'session-3',
    user_id: 'user-1',
    joined_at: new Date(Date.now() - 86400000).toISOString(),
    user: mockUsers[0],
  },
  {
    id: 'participant-8',
    session_id: 'session-3',
    user_id: 'user-3',
    joined_at: new Date(Date.now() - 86300000).toISOString(),
    user: mockUsers[2],
  },
  {
    id: 'participant-9',
    session_id: 'session-3',
    user_id: 'user-4',
    joined_at: new Date(Date.now() - 86200000).toISOString(),
    user: mockUsers[3],
  },
];

/**
 * モック残高データ
 */
export const mockBalances: Balance[] = [
  // Session 1の残高
  {
    id: 'balance-1',
    session_id: 'session-1',
    user_id: 'user-1',
    amount: 1250,
    updated_at: new Date().toISOString(),
    user: mockUsers[0],
  },
  {
    id: 'balance-2',
    session_id: 'session-1',
    user_id: 'user-2',
    amount: 800,
    updated_at: new Date().toISOString(),
    user: mockUsers[1],
  },
  {
    id: 'balance-3',
    session_id: 'session-1',
    user_id: 'user-3',
    amount: 1450,
    updated_at: new Date().toISOString(),
    user: mockUsers[2],
  },
  {
    id: 'balance-4',
    session_id: 'session-1',
    user_id: 'user-4',
    amount: 500,
    updated_at: new Date().toISOString(),
    user: mockUsers[3],
  },
  // Session 2の残高
  {
    id: 'balance-5',
    session_id: 'session-2',
    user_id: 'user-2',
    amount: 2000,
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    user: mockUsers[1],
  },
  {
    id: 'balance-6',
    session_id: 'session-2',
    user_id: 'user-5',
    amount: 2000,
    updated_at: new Date(Date.now() - 3500000).toISOString(),
    user: mockUsers[4],
  },
  // Session 3の残高（完了済み）
  {
    id: 'balance-7',
    session_id: 'session-3',
    user_id: 'user-1',
    amount: 750,
    updated_at: new Date(Date.now() - 7200000).toISOString(),
    user: mockUsers[0],
  },
  {
    id: 'balance-8',
    session_id: 'session-3',
    user_id: 'user-3',
    amount: 600,
    updated_at: new Date(Date.now() - 7200000).toISOString(),
    user: mockUsers[2],
  },
  {
    id: 'balance-9',
    session_id: 'session-3',
    user_id: 'user-4',
    amount: 150,
    updated_at: new Date(Date.now() - 7200000).toISOString(),
    user: mockUsers[3],
  },
];

/**
 * モックトランザクションデータ
 */
export const mockTransactions: Transaction[] = [
  // Session 1のトランザクション
  {
    id: 'transaction-1',
    session_id: 'session-1',
    from_user_id: 'user-2',
    to_user_id: 'user-1',
    amount: 100,
    created_at: new Date(Date.now() - 1800000).toISOString(),
    from_user: mockUsers[1],
    to_user: mockUsers[0],
  },
  {
    id: 'transaction-2',
    session_id: 'session-1',
    from_user_id: 'user-4',
    to_user_id: 'user-3',
    amount: 200,
    created_at: new Date(Date.now() - 1200000).toISOString(),
    from_user: mockUsers[3],
    to_user: mockUsers[2],
  },
  {
    id: 'transaction-3',
    session_id: 'session-1',
    from_user_id: 'user-2',
    to_user_id: 'user-3',
    amount: 150,
    created_at: new Date(Date.now() - 900000).toISOString(),
    from_user: mockUsers[1],
    to_user: mockUsers[2],
  },
  {
    id: 'transaction-4',
    session_id: 'session-1',
    from_user_id: 'user-1',
    to_user_id: 'user-3',
    amount: 50,
    created_at: new Date(Date.now() - 600000).toISOString(),
    from_user: mockUsers[0],
    to_user: mockUsers[2],
  },
  {
    id: 'transaction-5',
    session_id: 'session-1',
    from_user_id: 'user-4',
    to_user_id: 'user-1',
    amount: 300,
    created_at: new Date(Date.now() - 300000).toISOString(),
    from_user: mockUsers[3],
    to_user: mockUsers[0],
  },
];

/**
 * セッションIDから詳細情報を取得するヘルパー関数
 */
export function getSessionWithDetails(sessionId: string): SessionWithDetails | null {
  const session = mockSessions.find((s) => s.id === sessionId);
  if (!session) return null;

  const participants = mockParticipants.filter((p) => p.session_id === sessionId);
  const balances = mockBalances.filter((b) => b.session_id === sessionId);
  const host_user = mockUsers.find((u) => u.id === session.host_user_id);

  return {
    ...session,
    participants,
    balances,
    host_user,
  };
}

/**
 * ユーザーのアクティブセッションを取得
 */
export function getUserActiveSessions(userId: string): SessionWithDetails[] {
  const userParticipantSessions = mockParticipants
    .filter((p) => p.user_id === userId)
    .map((p) => p.session_id);

  return mockSessions
    .filter(
      (s) =>
        (s.status === 'waiting' || s.status === 'active') &&
        userParticipantSessions.includes(s.id)
    )
    .map((s) => getSessionWithDetails(s.id))
    .filter((s): s is SessionWithDetails => s !== null);
}

/**
 * ユーザーの履歴（完了済みセッション）を取得
 */
export function getUserCompletedSessions(userId: string): SessionWithDetails[] {
  const userParticipantSessions = mockParticipants
    .filter((p) => p.user_id === userId)
    .map((p) => p.session_id);

  return mockSessions
    .filter((s) => s.status === 'completed' && userParticipantSessions.includes(s.id))
    .map((s) => getSessionWithDetails(s.id))
    .filter((s): s is SessionWithDetails => s !== null)
    .slice(0, 10); // 最新10件
}

/**
 * セッションのトランザクション履歴を取得
 */
export function getSessionTransactions(sessionId: string): Transaction[] {
  return mockTransactions
    .filter((t) => t.session_id === sessionId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * ユーザーのセッション内残高を取得
 */
export function getUserBalance(sessionId: string, userId: string): Balance | null {
  return mockBalances.find((b) => b.session_id === sessionId && b.user_id === userId) || null;
}
