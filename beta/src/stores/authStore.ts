import { create } from 'zustand'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setIsLoading: (isLoading: boolean) => void
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setIsLoading: (isLoading) => set({ isLoading }),

  signInWithEmail: async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  signUpWithEmail: async (email, password) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // 이메일 인증 링크 클릭 시 /auth/callback으로 이동 → 세션 생성 → 온보딩
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },
}))
