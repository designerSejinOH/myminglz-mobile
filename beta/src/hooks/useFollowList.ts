import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Profile } from '@/types'

type ListType = 'followers' | 'following'

export function useFollowList(profileId: string, type: ListType) {
  const supabase = createClient()
  const [list, setList] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!profileId) return

    const fetchList = async () => {
      setIsLoading(true)

      const column = type === 'followers' ? 'follower_id' : 'following_id'
      const filter = type === 'followers' ? 'following_id' : 'follower_id'

      const { data } = await supabase
        .from('follows')
        .select(`profiles!${column}(id, username, display_name, bio, profile_image, created_at, updated_at)`)
        .eq(filter, profileId)
        .eq('status', 'accepted')

      const parsed = (data ?? [])
        .map((d) => d.profiles)
        .flat()
        .filter((p): p is Profile => !!p && !Array.isArray(p))

      setList(parsed)
      setIsLoading(false)
    }

    fetchList()
  }, [profileId, type])

  return { list, isLoading }
}
