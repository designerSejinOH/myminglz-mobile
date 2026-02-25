'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Screen } from '@/components'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const POLL_INTERVAL_MS = 3000 // 3초마다 인증 상태 체크

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading } = useAuthStore()

  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isVerified, setIsVerified] = useState(false)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 쿼리스트링에서 이메일 가져오기 (회원가입 직후 페이지에 넘어온 경우)
  const emailFromQuery = searchParams.get('email')
  const displayEmail = user?.email ?? emailFromQuery ?? ''

  // 이메일 인증 상태를 서버에서 확인하는 함수
  const checkVerificationStatus = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.refreshSession()

      if (session?.user?.email_confirmed_at) {
        setIsVerified(true)
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current)
          pollTimerRef.current = null
        }
        toast.success('이메일이 확인되었습니다!')
        router.push('/auth/onboarding')
      }
    } catch {
      // 네트워크 오류 등은 조용히 무시 (다음 폴링에서 재시도)
    }
  }

  // 백그라운드 폴링: 3초마다 이메일 인증 상태 체크
  // 다른 브라우저/기기에서 인증 링크를 클릭해도 자동으로 감지됨
  useEffect(() => {
    if (isLoading) return

    // 이미 인증된 유저면 바로 온보딩으로
    if (user?.email_confirmed_at) {
      router.push('/auth/onboarding')
      return
    }

    // 폴링 시작
    pollTimerRef.current = setInterval(checkVerificationStatus, POLL_INTERVAL_MS)

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user?.email_confirmed_at])

  // 카운트다운 타이머
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleResendEmail = async () => {
    if (!displayEmail || countdown > 0) return

    setIsResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: displayEmail,
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

  const handleManualCheck = async () => {
    await checkVerificationStatus()
    // checkVerificationStatus 내부에서 확인 안 됐을 경우 토스트
    if (!isVerified) {
      // refreshSession 후 store의 user가 아직 업데이트 전일 수 있어 직접 확인
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user?.email_confirmed_at) {
        toast.error('아직 이메일이 확인되지 않았습니다')
      }
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
    <Screen className='bg-[#242424] flex flex-col justify-between items-center'>
      <span className='w-full text-center text-sm font-normal leading-[1.2] opacity-20 mt-4'>
        @beta {process.env.NEXT_PUBLIC_APP_VERSION}
      </span>

      <div className='w-full max-w-sm flex-1 flex flex-col justify-center items-center gap-8 px-6'>
        {/* 이메일 아이콘 */}
        <div className='relative w-24 h-24 rounded-full bg-gray-800 flex justify-center items-center'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='44'
            height='44'
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
          {/* 폴링 중임을 나타내는 애니메이션 도트 */}
          <span className='absolute top-1 right-1 w-3 h-3 rounded-full bg-primary animate-pulse' />
        </div>

        {/* 안내 메시지 */}
        <div className='w-full flex flex-col items-center gap-3 text-center'>
          <h1 className='text-2xl font-semibold text-white'>이메일을 확인해주세요</h1>
          <p className='text-sm text-gray-400 leading-relaxed'>
            {displayEmail && (
              <>
                <span className='text-primary font-medium'>{displayEmail}</span>
                <br />
              </>
            )}
            으로 확인 이메일을 보냈습니다.
            <br />
            이메일의 링크를 클릭하면
            <br />
            자동으로 다음 단계로 이동합니다.
          </p>
          <p className='text-xs text-gray-600'>
            다른 기기에서 링크를 클릭해도 여기서 자동으로 감지됩니다
          </p>
        </div>

        {/* 버튼 영역 */}
        <div className='w-full flex flex-col gap-3'>
          <button
            onClick={handleManualCheck}
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
              {countdown > 0
                ? `${countdown}초 후 재발송 가능`
                : isResending
                  ? '발송 중...'
                  : '이메일 다시 보내기'}
            </span>
          </button>
        </div>

        {/* 도움말 */}
        <div className='flex flex-col items-center gap-1'>
          <p className='text-xs text-gray-500 text-center'>이메일이 오지 않았다면 스팸함을 확인해주세요</p>
          <button
            onClick={() => router.push('/')}
            className='text-xs text-gray-600 underline underline-offset-2 mt-1'
          >
            처음으로 돌아가기
          </button>
        </div>
      </div>

      <div className='w-full h-fit py-8 text-center text-sm font-normal leading-[1.2] opacity-40'>© ZERONINEZ</div>
    </Screen>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <Screen className='bg-[#242424] flex flex-col justify-center items-center'>
          <div className='animate-pulse'>
            <img src='/img/sample/profile.png' alt='logo' className='w-auto h-24' />
          </div>
        </Screen>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
