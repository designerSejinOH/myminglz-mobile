'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Screen, Icon } from '@/components'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types'
import { useFollow } from '@/hooks/useFollow'
import { useFollowCount } from '@/hooks/useFollowCount'
import { useProfileStore } from '@/stores/profileStore'
import classNames from 'classnames'

export default function ProfileViewPage() {
  const router = useRouter()
  const params = useParams()
  const profileId = params.profileId as string

  const { profile: currentProfile } = useProfileStore()
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(true)

  const { isFollowing, isLoading: isFollowLoading, toggleFollow } = useFollow(profileId)
  const { followerCount, followingCount } = useFollowCount(profileId)

  const isOwnProfile = currentProfile?.id === profileId

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', profileId).single()
      setTargetProfile(data ?? null)
      setIsPageLoading(false)
    }
    if (profileId) fetchProfile()
  }, [profileId])

  if (isPageLoading) {
    return (
      <Screen
        className='bg-[#242424]'
        header={{ title: '', left: { icon: 'left', onClick: () => router.back() } }}
      >
        <div className='w-full h-full flex items-center justify-center'>
          <div className='w-16 h-16 rounded-full bg-gray-800 animate-pulse' />
        </div>
      </Screen>
    )
  }

  if (!targetProfile) {
    return (
      <Screen
        className='bg-[#242424] flex flex-col items-center justify-center gap-4'
        header={{ title: '프로필', left: { icon: 'left', onClick: () => router.back() } }}
      >
        <Icon icon='user' size={48} className='text-gray-700' />
        <span className='text-sm text-gray-500'>존재하지 않는 프로필이에요</span>
      </Screen>
    )
  }

  return (
    <Screen
      className='bg-[#242424]'
      header={{
        title: `@${targetProfile.username}`,
        left: { icon: 'left', onClick: () => router.back() },
      }}
    >
      <div className='w-full h-full flex flex-col overflow-y-auto pb-24'>
        {/* 프로필 이미지 + 기본 정보 */}
        <div className='w-full flex flex-col items-center gap-4 pt-6 pb-4 px-6'>
          {/* 프로필 이미지 */}
          <div className='w-24 h-24 rounded-full overflow-hidden bg-gray-800 border border-white/10'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={targetProfile.profile_image || '/img/sample/profile.png'}
              alt={targetProfile.username}
              className='w-full h-full object-cover'
            />
          </div>

          {/* 이름 + 아이디 */}
          <div className='flex flex-col items-center gap-1'>
            <h1 className='text-xl font-bold text-white'>{targetProfile.display_name}</h1>
            <span className='text-sm text-gray-400'>@{targetProfile.username}</span>
          </div>

          {/* 팔로워 / 팔로잉 */}
          <div className='flex flex-row gap-8'>
            <div className='flex flex-col items-center gap-0.5'>
              <span className='text-lg font-bold text-white'>{followerCount}</span>
              <span className='text-xs text-gray-500'>팔로워</span>
            </div>
            <div className='flex flex-col items-center gap-0.5'>
              <span className='text-lg font-bold text-white'>{followingCount}</span>
              <span className='text-xs text-gray-500'>팔로잉</span>
            </div>
          </div>

          {/* 팔로우 버튼 (내 프로필이 아닐 때만) */}
          {!isOwnProfile && (
            <button
              onClick={toggleFollow}
              disabled={isFollowLoading}
              className={classNames(
                'w-full h-12 rounded-full flex justify-center items-center text-sm font-semibold transition-colors duration-200',
                'active:scale-95 transition-transform',
                isFollowing
                  ? 'bg-gray-800 text-white border border-gray-700'
                  : 'bg-primary text-black',
                isFollowLoading && 'opacity-50 cursor-not-allowed',
              )}
            >
              {isFollowLoading ? '...' : isFollowing ? '팔로잉' : '팔로우'}
            </button>
          )}

          {/* 내 프로필 안내 */}
          {isOwnProfile && (
            <button
              onClick={() => router.push('/mypage/settings')}
              className='w-full h-12 rounded-full bg-gray-800 text-white text-sm font-medium flex justify-center items-center border border-gray-700 active:bg-gray-700 transition-colors'
            >
              프로필 수정
            </button>
          )}
        </div>

        {/* 한줄 소개 */}
        {targetProfile.bio && (
          <div className='mx-4 px-4 py-3 bg-card rounded-2xl'>
            <p className='text-sm text-gray-300 leading-relaxed'>{targetProfile.bio}</p>
          </div>
        )}

        {/* 비공개 계정 안내 */}
        {targetProfile.is_private && !isOwnProfile && !isFollowing && (
          <div className='mx-4 mt-4 flex flex-col items-center gap-2 py-10'>
            <Icon icon='folder' size={36} className='text-gray-700' />
            <span className='text-sm text-gray-500 text-center'>
              비공개 계정이에요.
              <br />
              팔로우하면 게시물을 볼 수 있어요.
            </span>
          </div>
        )}
      </div>
    </Screen>
  )
}
