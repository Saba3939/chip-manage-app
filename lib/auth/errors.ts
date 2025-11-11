import { AuthError } from '@supabase/supabase-js'

/**
 * Supabase認証エラーを日本語メッセージに変換
 */
export function getAuthErrorMessage(error: AuthError | Error | null): string {
  if (!error) return '不明なエラーが発生しました'

  // AuthErrorの場合
  if ('status' in error) {
    const authError = error as AuthError

    // エラーメッセージによる分岐
    const message = authError.message.toLowerCase()

    if (message.includes('email not confirmed')) {
      return 'メールアドレスが確認されていません。確認メールをご確認ください'
    }

    if (message.includes('invalid login credentials') || message.includes('invalid email or password')) {
      return 'メールアドレスまたはパスワードが正しくありません'
    }

    if (message.includes('user already registered')) {
      return 'このメールアドレスは既に登録されています'
    }

    if (message.includes('email rate limit exceeded')) {
      return 'メール送信回数が上限に達しました。しばらく時間をおいてから再度お試しください'
    }

    if (message.includes('password')) {
      return 'パスワードは8文字以上で入力してください'
    }

    if (message.includes('network')) {
      return 'ネットワークエラーが発生しました。接続を確認してください'
    }

    // ステータスコードによる分岐
    switch (authError.status) {
      case 400:
        return '入力内容に誤りがあります'
      case 401:
        return '認証に失敗しました'
      case 422:
        return 'メールアドレスまたはパスワードの形式が正しくありません'
      case 429:
        return 'リクエスト数が多すぎます。しばらく時間をおいてから再度お試しください'
      case 500:
        return 'サーバーエラーが発生しました。しばらく時間をおいてから再度お試しください'
    }
  }

  // 一般的なErrorの場合
  return error.message || '予期しないエラーが発生しました'
}

/**
 * 認証エラーの型定義
 */
export type AuthErrorType =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'user_already_exists'
  | 'weak_password'
  | 'network_error'
  | 'rate_limit'
  | 'unknown'

/**
 * エラーの種類を判定
 */
export function getAuthErrorType(error: AuthError | Error | null): AuthErrorType {
  if (!error) return 'unknown'

  if ('status' in error) {
    const authError = error as AuthError
    const message = authError.message.toLowerCase()

    if (message.includes('invalid login credentials') || message.includes('invalid email or password')) {
      return 'invalid_credentials'
    }
    if (message.includes('email not confirmed')) {
      return 'email_not_confirmed'
    }
    if (message.includes('user already registered')) {
      return 'user_already_exists'
    }
    if (message.includes('password')) {
      return 'weak_password'
    }
    if (message.includes('network')) {
      return 'network_error'
    }
    if (authError.status === 429) {
      return 'rate_limit'
    }
  }

  return 'unknown'
}
