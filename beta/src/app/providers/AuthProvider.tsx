'use client'

import { useEffect, PropsWithChildren } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useProfileStore } from '@/stores/profileStore'
import { supabase } from '@/lib/supabase'

export default function AuthProvider({ children }: PropsWithChildren) {
  const { setUser, setSession, setIsLoading } = useAuthStore()
  const { fetchProfile, setProfile, setIsLoading: setProfileIsLoading } = useProfileStore()

  useEffect(() => {
    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)

      // 이메일 인증 완료된 유저는 프로필 자동 로드
      if (session?.user?.email_confirmed_at) {
        fetchProfile(session.user.id)
      } else {
        // 비로그인 또는 이메일 미인증 상태 — 프로필 로딩 즉시 종료
        setProfile(null)
        setProfileIsLoading(false)
      }
    }

    initializeAuth()

    // 인증 상태 변화 구독 (로그인·로그아웃·이메일 인증 완료 등)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)

      if (session?.user?.email_confirmed_at) {
        // 인증 완료 → 프로필 자동 로드
        fetchProfile(session.user.id)
      } else {
        // 로그아웃 또는 이메일 미인증 → 프로필 클리어
        setProfile(null)
        setProfileIsLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setSession, setIsLoading, fetchProfile, setProfile, setProfileIsLoading])

  return <>{children}</>
}
