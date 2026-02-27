'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Screen } from '@/components'
import { useAuthStore } from '@/stores/authStore'

export default function Page() {
  const router = useRouter()
  const { user, isLoading } = useAuthStore()
  const [isRedirecting, setIsRedirecting] = useState(false)

  // 이미 로그인된 경우 - 상태에 따라 적절한 페이지로 리다이렉트
  useEffect(() => {
    if (!isLoading && user && !isRedirecting) {
      setIsRedirecting(true)
      if (!user.email_confirmed_at) {
        router.replace('/auth/verify')
      } else {
        router.replace('/map')
      }
    }
  }, [user, isLoading, isRedirecting, router])

  if (isLoading || isRedirecting) {
    //사이트 저장된 모든 데이터 지우고 새로고침하는 기능
    const handleReset = () => {
      localStorage.clear()
      sessionStorage.clear()
      router.refresh()
    }

    return (
      <Screen className='bg-[#242424] flex flex-col justify-center items-center'>
        <div className='animate-pulse'>
          <img src='/img/sample/profile.png' alt='logo' className='w-auto h-24' />
        </div>
        <span className='text-sm mt-4 text-white/15'>잠시만 기다려주세요!</span>
        <button
          onClick={handleReset}
          className='w-full mt-6 h-14 bg-primary rounded-full flex justify-center items-center active:scale-95 transition-transform duration-200'
        >
          <span className='text-lg font-semibold text-black'>문제가 계속되나요? 새로고침하기</span>
        </button>
      </Screen>
    )
  }

  return (
    <Screen className='bg-[#242424] flex flex-col justify-between items-center'>
      <span className='w-full text-center text-sm font-normal leading-[1.2] opacity-20 mt-4'>
        @beta {process.env.NEXT_PUBLIC_APP_VERSION}
      </span>

      {/* 로고 영역 */}
      <div className='w-full max-w-sm flex-1 flex flex-col justify-center items-center gap-4 px-6'>
        <img src='/img/sample/profile.png' alt='logo' className='w-auto h-28' />
        <span className='text-primary text-3xl font-semibold'>myminglz</span>
        <p className='text-sm font-normal leading-[1.4] opacity-60 text-center'>
          걸어다니며 지역을 탐방하는
          <br />
          로컬 기반 SNS 플랫폼
        </p>
      </div>

      {/* 버튼 영역 */}
      <div className='w-full max-w-sm flex flex-col gap-3 px-6 pb-12'>
        <button
          onClick={() => router.push('/auth/signup')}
          className='w-full h-14 bg-primary rounded-full flex justify-center items-center active:scale-95 transition-transform duration-200'
        >
          <span className='text-lg font-semibold text-black'>회원가입</span>
        </button>
        <button
          onClick={() => router.push('/auth/login')}
          className='w-full h-14 bg-gray-800 rounded-full flex justify-center items-center active:scale-95 transition-transform duration-200'
        >
          <span className='text-lg font-semibold text-gray-200'>로그인</span>
        </button>
      </div>
      <div className='w-full h-fit pb-6 text-center text-sm font-normal leading-[1.2] opacity-40'>© ZERONINEZ</div>
    </Screen>
  )
}
