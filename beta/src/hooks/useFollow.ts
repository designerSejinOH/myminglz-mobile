import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useProfileStore } from '@/stores/profileStore'
import toast from 'react-hot-toast'

export function useFollow(targetProfileId: string) {
  const supabase = createClient()
  const { user } = useAuthStore()
  const { profile } = useProfileStore() // 현재 로그인한 유저의 profile

  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 팔로우 여부 초기 조회
  useEffect(() => {
    if (!profile?.id || !targetProfileId) return

    const fetchFollowStatus = async () => {
      const { data } = await supabase
        .from('follows')
        .select('status')
        .eq('follower_id', profile.id)
        .eq('following_id', targetProfileId)
        .maybeSingle()

      setIsFollowing(data?.status === 'accepted')
      setIsLoading(false)
    }

    fetchFollowStatus()
  }, [profile?.id, targetProfileId])

  const toggleFollow = async () => {
    if (!profile?.id) {
      toast.error('로그인이 필요해요.')
      return
    }
    if (profile.id === targetProfileId) {
      toast.error('자기 자신은 팔로우할 수 없어요.')
      return
    }

    setIsLoading(true)

    if (isFollowing) {
      // 언팔로우
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', profile.id)
        .eq('following_id', targetProfileId)

      if (error) {
        toast.error('언팔로우에 실패했어요.')
      } else {
        setIsFollowing(false)
        toast.success('언팔로우했어요.')
      }
    } else {
      // 팔로우 (지금은 전부 공개라 바로 accepted)
      const { error } = await supabase.from('follows').insert({
        follower_id: profile.id,
        following_id: targetProfileId,
        status: 'accepted',
      })

      if (error) {
        toast.error('팔로우에 실패했어요.')
      } else {
        setIsFollowing(true)
        toast.success('팔로우했어요.')
      }
    }

    setIsLoading(false)
  }

  return { isFollowing, isLoading, toggleFollow }
}
