'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * プロフィール作成
 */
export async function createProfile(userId: string, displayName: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from('profiles').insert({
    id: userId,
    display_name: displayName,
  })

  if (error) {
    console.error('Error creating profile:', error)
    return { error: error.message, data: null }
  }

  return { error: null, data }
}

/**
 * プロフィール取得
 */
export async function getProfile(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return { error: error.message, data: null }
  }

  return { error: null, data }
}

/**
 * プロフィール更新
 */
export async function updateProfile(
  userId: string,
  updates: { display_name?: string }
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    return { error: error.message, data: null }
  }

  return { error: null, data }
}

/**
 * 現在のユーザーのプロファイルを取得
 */
export async function getCurrentUserProfile() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'ユーザーが見つかりませんでした', data: null }
  }

  return getProfile(user.id)
}
