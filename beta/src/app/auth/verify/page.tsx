'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Screen } from '@/components'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import classNames from 'classnames'
import toast from 'react-hot-toast'

export default function VerifyEmailPage() {
  const router = useRouter()
  const { user, isLoading } = useAuthStore()
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // 이미 이메일 확인된 경우 리다이렉트
  useEffect(() => {
    if (!isLoading && user?.email_confirmed_at) {
      router.push('/auth/onboarding')
    }
  }, [user, isLoading, router])

  // 카운트다운 타이머
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleResendEmail = async () => {
    if (!user?.email || countdown > 0) return

    setIsResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      })

      if (error) throw error

      toast.success('확인 이메일을 다시 보냈습니다')
      setCountdown(60) // 60초 대기
    } catch (error: any) {
      toast.error(error.message || '이메일 발송에 실패했습니다')
    } finally {
      setIsResending(false)
    }
  }

  const handleRefreshStatus = async () => {
    // 세션 새로고침하여 이메일 확인 상태 업데이트
    const {
      data: { session },
    } = await supabase.auth.refreshSession()
    if (session?.user?.email_confirmed_at) {
      toast.success('이메일이 확인되었습니다!')
      router.push('/auth/onboarding')
    } else {
      toast.error('아직 이메일이 확인되지 않았습니다')
    }
  }

  if (isLoading) {
    return (
      <Screen className='bg-[#242424] flex flex-col justify-center items-center'>
        <div className='animate-pulse'>
          <img src='/img/sample/profile.png' alt='logo' className='w-auto h-24' />
        </div>
      </Screen>
    )
  }

  return (
    <Screen className={classNames('bg-[#242424] flex flex-col justify-between items-center')}>
      <span className='w-full text-center text-sm font-normal leading-[1.2] opacity-20 mt-4'>
        @beta {process.env.NEXT_PUBLIC_APP_VERSION}
      </span>

      <div className='w-full max-w-sm flex-1 flex flex-col justify-center items-center gap-8 px-6'>
        {/* Icon */}
        <div className='w-20 h-20 rounded-full bg-gray-800 flex justify-center items-center'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='40'
            height='40'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='text-primary'
          >
            <rect width='20' height='16' x='2' y='4' rx='2' />
            <path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' />
          </svg>
        </div>

        {/* Message */}
        <div className='w-full flex flex-col items-center gap-3 text-center'>
          <h1 className='text-2xl font-semibold text-white'>이메일을 확인해주세요</h1>
          <p className='text-sm text-gray-400 leading-relaxed'>
            <span className='text-primary font-medium'>{user?.email}</span>
            <br />
            으로 확인 이메일을 보냈습니다.
            <br />
            이메일의 링크를 클릭하여 가입을 완료해주세요.
          </p>
        </div>

        {/* Buttons */}
        <div className='w-full flex flex-col gap-3'>
          <button
            onClick={handleRefreshStatus}
            className='w-full h-14 bg-primary rounded-full flex justify-center items-center active:scale-95 transition-transform duration-200'
          >
            <span className='text-lg font-semibold text-black'>확인 완료했어요</span>
          </button>

          <button
            onClick={handleResendEmail}
            disabled={isResending || countdown > 0}
            className='w-full h-12 bg-gray-800 rounded-full flex justify-center items-center active:scale-95 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <span className='text-sm font-medium text-gray-300'>
              {countdown > 0 ? `${countdown}초 후 재발송 가능` : isResending ? '발송 중...' : '이메일 다시 보내기'}
            </span>
          </button>
        </div>

        {/* Help text */}
        <p className='text-xs text-gray-500 text-center'>이메일이 오지 않았다면 스팸함을 확인해주세요</p>
      </div>

      <div className='w-full h-fit py-8 text-center text-sm font-normal leading-[1.2] opacity-40'>© ZERONINEZ</div>
    </Screen>
  )
}
