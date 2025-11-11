import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

/**
 * クライアント側でSupabaseクライアントを作成
 * ブラウザ環境（Client Components）で使用
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
