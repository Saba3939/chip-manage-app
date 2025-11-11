/**
 * ユーザー型定義
 */
export interface User {
  id: string;
  email: string;
  display_name?: string;
}

/**
 * セッションステータス
 */
export type SessionStatus = 'waiting' | 'active' | 'completed';

/**
 * セッション型定義
 */
export interface Session {
  id: string;
  host_user_id: string;
  name?: string;
  initial_chips: number;
  max_participants: number;
  rate?: number; // 1チップあたりの円換算レート
  status: SessionStatus;
  created_at: string;
  updated_at: string;
}

/**
 * セッション参加者型定義
 */
export interface Participant {
  id: string;
  session_id: string;
  user_id: string;
  joined_at: string;
  user?: User; // リレーション
}

/**
 * 残高型定義
 */
export interface Balance {
  id: string;
  session_id: string;
  user_id: string;
  amount: number;
  updated_at: string;
  user?: User; // リレーション
}

/**
 * トランザクション型定義
 */
export interface Transaction {
  id: string;
  session_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  created_at: string;
  from_user?: User; // リレーション
  to_user?: User; // リレーション
}

/**
 * セッション詳細型（参加者と残高情報を含む）
 */
export interface SessionWithDetails extends Session {
  participants: Participant[];
  balances: Balance[];
  host_user?: User;
}

/**
 * QRコード生成用データ型
 */
export interface QRCodeData {
  session_id: string;
  type: 'join'; // 将来的に他のタイプを追加可能
}
