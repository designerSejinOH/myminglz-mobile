'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Screen } from '@/components'
import { Icon } from '@/components'
import { NavBarHeight } from '@/constants/sizeguide'
import { useProfiles } from '@/hooks/useProfiles'
import { Profile } from '@/types'
import classNames from 'classnames'

function ProfileGridCard({ profile, onClick }: { profile: Profile; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        'w-full flex flex-col items-center gap-2 p-3',
        'bg-card rounded-2xl active:scale-95 transition-transform duration-150',
      )}
    >
      <div className='w-16 h-16 rounded-full overflow-hidden bg-gray-700 shrink-0'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.profile_image || '/img/sample/profile.png'}
          alt={profile.username}
          className='w-full h-full object-cover'
        />
      </div>
      <div className='w-full flex flex-col items-center gap-0.5'>
        <span className='text-sm font-semibold text-white truncate w-full text-center'>{profile.display_name}</span>
        <span className='text-xs text-gray-400 truncate w-full text-center'>@{profile.username}</span>
      </div>
    </button>
  )
}

export default function ExplorePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const { profiles, isLoading } = useProfiles(searchQuery)

  return (
    <Screen className='bg-[#121212]'>
      <div
        style={{ paddingBottom: NavBarHeight + 16 }}
        className='w-full h-full flex flex-col gap-4 px-4 pt-4 overflow-y-auto'
      >
        {/* 헤더 */}
        <div className='w-full flex flex-col gap-1 pt-2'>
          <h1 className='text-xl font-bold text-white'>탐색</h1>
          <p className='text-xs text-gray-500'>다른 사용자의 프로필을 찾아보세요</p>
        </div>

        {/* 검색 입력 */}
        <div className='w-full relative'>
          <div className='absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none'>
            <Icon icon='search' size={18} className='text-gray-500' />
          </div>
          <input
            type='text'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='이름 또는 아이디로 검색'
            className='w-full h-12 pl-10 pr-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors text-sm'
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className='absolute right-3 top-1/2 -translate-y-1/2'
            >
              <Icon icon='close' size={16} className='text-gray-500' />
            </button>
          )}
        </div>

        {/* 결과 */}
        {isLoading ? (
          <div className='grid grid-cols-3 gap-2'>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className='w-full aspect-square bg-card rounded-2xl animate-pulse' />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-20 gap-3'>
            <Icon icon='search' size={40} className='text-gray-700' />
            <span className='text-sm text-gray-500'>
              {searchQuery ? `"${searchQuery}" 검색 결과가 없어요` : '아직 프로필이 없어요'}
            </span>
          </div>
        ) : (
          <>
            {searchQuery.trim() === '' && (
              <p className='text-xs text-gray-600'>최근 가입 순 · {profiles.length}명</p>
            )}
            <div className='grid grid-cols-3 gap-2'>
              {profiles.map((profile) => (
                <ProfileGridCard
                  key={profile.id}
                  profile={profile}
                  onClick={() => router.push(`/profile/${profile.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </Screen>
  )
}
