import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface FollowCount {
  followerCount: number
  followingCount: number
}

export function useFollowCount(profileId: string) {
  const supabase = createClient()
  const [counts, setCounts] = useState<FollowCount>({ followerCount: 0, followingCount: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!profileId) return

    const fetchCounts = async () => {
      const [followerRes, followingRes] = await Promise.all([
        // 나를 팔로우하는 사람 수
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', profileId)
          .eq('status', 'accepted'),
        // 내가 팔로우하는 사람 수
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', profileId)
          .eq('status', 'accepted'),
      ])

      setCounts({
        followerCount: followerRes.count ?? 0,
        followingCount: followingRes.count ?? 0,
      })
      setIsLoading(false)
    }

    fetchCounts()
  }, [profileId])

  return { ...counts, isLoading }
}
