import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * ミドルウェア
 * 認証状態のチェックとセッションのリフレッシュを行う
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // セッションのリフレッシュ（重要: これをスキップしないこと）
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // 認証が必要なルート
  const protectedRoutes = ['/dashboard', '/session']

  // 認証済みユーザーがアクセスすべきでないルート
  const authRoutes = ['/login', '/register']

  // 保護されたルートへのアクセス
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!user) {
      // 未認証の場合はログイン画面へリダイレクト
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // 認証済みユーザーが認証ページにアクセスした場合
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (user) {
      // ダッシュボードへリダイレクト
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * 以下を除く全てのルートにマッチ:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化ファイル)
     * - favicon.ico (faviconファイル)
     * - public フォルダ内の画像
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
