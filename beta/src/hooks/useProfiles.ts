import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types'

/**
 * 전체 프로필 목록 조회 훅
 * - searchQuery가 있으면 username / display_name 기준 ilike 검색
 * - 없으면 최신 50개 반환
 */
export function useProfiles(searchQuery: string = '') {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProfiles = async () => {
      setIsLoading(true)

      let query = supabase
        .from('profiles')
        .select('id, user_id, username, display_name, bio, profile_image, is_private, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(50)

      if (searchQuery.trim()) {
        query = query.or(
          `username.ilike.%${searchQuery.trim()}%,display_name.ilike.%${searchQuery.trim()}%`,
        )
      }

      const { data } = await query
      setProfiles(data ?? [])
      setIsLoading(false)
    }

    // 검색 중일 때 300ms 디바운스, 초기 로드는 즉시
    const delay = searchQuery.trim() ? 300 : 0
    const timer = setTimeout(fetchProfiles, delay)
    return () => clearTimeout(timer)
  }, [searchQuery])

  return { profiles, isLoading }
}
