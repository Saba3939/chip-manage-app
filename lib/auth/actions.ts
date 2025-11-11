'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

/**
 * 新規登録
 */
export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<{ error: string | null; data: any }> {
  const supabase = await createClient()

  // 新規ユーザー登録
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (authError) {
    return { error: authError.message, data: null }
  }

  if (!authData.user) {
    return { error: 'ユーザーの作成に失敗しました', data: null }
  }

  // プロフィール情報の保存
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    display_name: displayName,
  })

  if (profileError) {
    // プロフィール作成に失敗したが、ユーザーは作成されている
    console.error('Profile creation error:', profileError)
  }

  return { error: null, data: authData }
}

/**
 * ログイン
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

/**
 * ログアウト
 */
export async function signOut(): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}

/**
 * Googleログイン
 */
export async function signInWithGoogle(): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createClient()
  const origin = (await headers()).get('origin') || process.env.NEXT_PUBLIC_SITE_URL

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return { url: null, error: error.message }
  }

  return { url: data.url, error: null }
}

/**
 * 現在のユーザーを取得
 */
export async function getCurrentUser() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * セッションを取得
 */
export async function getSession() {
  const supabase = await createClient()

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session) {
    return null
  }

  return session
}

/**
 * ユーザープロフィールを取得
 */
export async function getUserProfile(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}
