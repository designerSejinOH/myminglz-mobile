import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types'

interface ProfileState {
  profile: Profile | null
  isLoading: boolean
  setProfile: (profile: Profile | null) => void
  setIsLoading: (isLoading: boolean) => void
  fetchProfile: (userId: string) => Promise<Profile | null>
  createProfile: (
    userId: string,
    data: { username: string; display_name: string; bio?: string },
  ) => Promise<{ error: Error | null }>
  updateProfile: (
    userId: string,
    data: { username?: string; display_name?: string; bio?: string },
  ) => Promise<{ error: Error | null }>
  checkUsernameAvailable: (username: string, currentUserId?: string) => Promise<boolean>
  refreshProfile: (userId: string) => Promise<void>
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: true,

  setProfile: (profile) => set({ profile }),
  setIsLoading: (isLoading) => set({ isLoading }),

  fetchProfile: async (userId) => {
    try {
      set({ isLoading: true })
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

      if (error) {
        if (error.code === 'PGRST116') {
          // 프로필 없음
          set({ profile: null, isLoading: false })
          return null
        }
        throw error
      }

      set({ profile: data, isLoading: false })
      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      set({ profile: null, isLoading: false })
      return null
    }
  },

  createProfile: async (userId, data) => {
    try {
      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: data.username,
          display_name: data.display_name,
          bio: data.bio || '',
        })
        .select()
        .single()

      if (error) throw error

      // 직접 profile 설정 (fetchProfile 호출하지 않음)
      set({ profile: newProfile, isLoading: false })
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  updateProfile: async (userId, data) => {
    try {
      const updateData: Partial<Profile> = {}
      if (data.username !== undefined) updateData.username = data.username
      if (data.display_name !== undefined) updateData.display_name = data.display_name
      if (data.bio !== undefined) updateData.bio = data.bio

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      // 직접 profile 설정 (fetchProfile 호출하지 않음)
      set({ profile: updatedProfile, isLoading: false })
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  checkUsernameAvailable: async (username, currentUserId) => {
    try {
      const { data, error } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle()

      if (error) throw error

      // 데이터가 없으면 사용 가능
      if (!data) return true

      // 본인의 username이면 사용 가능
      if (currentUserId && data.id === currentUserId) return true

      return false
    } catch (error) {
      console.error('Error checking username:', error)
      return false
    }
  },

  // 프로필 이미지 업데이트 후 최신 데이터로 새로고침하는 함수 추가
  refreshProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (error) throw error
      set({ profile: data })
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  },
}))
