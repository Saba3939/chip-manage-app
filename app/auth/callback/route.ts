import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

/**
 * 認証コールバックハンドラー
 * メール確認やOAuthログイン後にSupabaseから呼ばれる
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()

    // 認証コードを使ってセッションを交換
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error)
      // エラーの場合はログイン画面へリダイレクト
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }
  }

  // 成功時はダッシュボードへリダイレクト
  return NextResponse.redirect(`${origin}/dashboard`)
}
