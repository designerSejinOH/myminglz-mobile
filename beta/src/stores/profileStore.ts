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
    profileId: string,
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

  // userId = auth.users.id → profiles.user_id로 조회
  fetchProfile: async (userId) => {
    try {
      set({ isLoading: true })
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

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

  // userId = auth.users.id → user_id 컬럼으로 삽입, id는 DB에서 자동 생성
  createProfile: async (userId, data) => {
    try {
      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          username: data.username,
          display_name: data.display_name,
          bio: data.bio || '',
        })
        .select()
        .single()

      if (error) throw error

      set({ profile: newProfile, isLoading: false })
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  // profileId = profiles.id (UUID) → eq('id', profileId)로 수정
  updateProfile: async (profileId, data) => {
    try {
      const updateData: Partial<Profile> = {}
      if (data.username !== undefined) updateData.username = data.username
      if (data.display_name !== undefined) updateData.display_name = data.display_name
      if (data.bio !== undefined) updateData.bio = data.bio

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profileId)
        .select()
        .single()

      if (error) throw error

      set({ profile: updatedProfile, isLoading: false })
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  // user_id로 조회, 자기 자신 username인지는 user_id로 비교
  checkUsernameAvailable: async (username, currentUserId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id')
        .eq('username', username)
        .maybeSingle()

      if (error) throw error

      // 데이터가 없으면 사용 가능
      if (!data) return true

      // 본인의 username이면 사용 가능 (user_id로 비교)
      if (currentUserId && data.user_id === currentUserId) return true

      return false
    } catch (error) {
      console.error('Error checking username:', error)
      return false
    }
  },

  // user_id로 최신 프로필 새로고침
  refreshProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()
      if (error) throw error
      set({ profile: data })
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  },
}))
