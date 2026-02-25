'use client'

import classNames from 'classnames'
import { Icon, NavBar, Screen } from '@/components'
import { useRouter } from 'next/navigation'
import { AliasButton, PostShelves, ProfileCard, StatusBar } from './_components'
import { NavBarHeight } from '@/constants/sizeguide'
import { useProfileStore } from '@/stores/profileStore'
import { useAuthStore } from '@/stores/authStore'

export default function Page() {
  const router = useRouter()

  const { signOut } = useAuthStore()
  // AuthProvider가 로그인 시 자동으로 프로필을 로드하므로 별도 fetch 불필요
  const { profile } = useProfileStore()

  const MYPOSTS = [
    { id: 1, title: '첫 번째 글', content: '안녕하세요! 이것은 첫 번째 글입니다.' },
    { id: 2, title: '두 번째 글', content: '두 번째 글도 재미있어요!' },
    { id: 3, title: '세 번째 글', content: '세 번째 글입니다. 잘 부탁드려요!' },
    { id: 4, title: '네 번째 글', content: '네 번째 글도 열심히 작성 중입니다.' },
    { id: 5, title: '다섯 번째 글', content: '다섯 번째 글이에요. 읽어주세요!' },
    { id: 6, title: '여섯 번째 글', content: '여섯 번째 글도 기대해주세요!' },
    { id: 7, title: '일곱 번째 글', content: '일곱 번째 글입니다.' },
  ]

  return (
    <Screen className={classNames(``)}>
      <div className='w-full h-dvh flex flex-col snap-y overflow-y-scroll justify-start items-center gap-1'>
        <div
          style={{
            height: `calc(100dvh - ${NavBarHeight}px)`,
          }}
          className='w-full flex flex-col snap-start justify-start items-center pt-2 px-2 gap-1'
        >
          <StatusBar credit={0} />
          <ProfileCard
            id={profile?.username || 'unknown'}
            follower={0}
            following={0}
            profileImage={null}
            name={profile?.display_name || 'Unknown User'}
            subname={'-'}
            description={profile?.bio || ''}
          />
          <AliasButton text={profile?.username || 'unknown'} link={''} />
        </div>
        <div className='w-full min-h-[120vw] px-2 flex flex-col snap-start justify-start items-center gap-1'>
          <PostShelves />
        </div>
      </div>
    </Screen>
  )
}
