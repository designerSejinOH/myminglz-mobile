'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Screen } from '@/components'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const { user, isLoading, signInWithEmail } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  // 이미 로그인된 경우 리다이렉트
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('이메일과 비밀번호를 입력해주세요')
      return
    }

    setIsSubmitting(true)
    const { error } = await signInWithEmail(email, password)

    if (error) {
      toast.error(error.message || '로그인에 실패했습니다')
      setIsSubmitting(false)
      return
    }

    // 로그인 성공 시 AuthProvider의 onAuthStateChange가 user를 업데이트하고
    // 위 useEffect에서 자동 리다이렉트 처리
    toast.success('로그인 성공!')
  }

  if (isLoading || isRedirecting) {
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
      <div className='w-full flex items-center px-4 pt-4'>
        <button
          onClick={() => router.back()}
          className='w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 active:scale-95 transition-transform duration-200'
          aria-label='뒤로가기'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='20'
            height='20'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='text-white'
          >
            <path d='m15 18-6-6 6-6' />
          </svg>
        </button>
      </div>

      <div className='w-full max-w-sm flex-1 flex flex-col justify-center gap-8 px-6'>
        {/* 헤더 */}
        <div className='flex flex-col gap-2'>
          <h1 className='text-2xl font-bold text-white'>로그인</h1>
          <p className='text-sm text-gray-400'>계정에 로그인하세요</p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleLogin} className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <label htmlFor='email' className='text-sm text-gray-400'>
              이메일
            </label>
            <input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='email@example.com'
              className='w-full h-12 px-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors'
              disabled={isSubmitting}
              autoComplete='email'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label htmlFor='password' className='text-sm text-gray-400'>
              비밀번호
            </label>
            <input
              id='password'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='비밀번호를 입력하세요'
              className='w-full h-12 px-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors'
              disabled={isSubmitting}
              autoComplete='current-password'
            />
          </div>

          <button
            type='submit'
            disabled={isSubmitting}
            className='w-full h-14 bg-primary rounded-full flex justify-center items-center mt-2 active:scale-95 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <span className='text-lg font-semibold text-black'>
              {isSubmitting ? '로그인 중...' : '로그인'}
            </span>
          </button>
        </form>

        {/* 회원가입 링크 */}
        <div className='flex justify-center items-center gap-2'>
          <span className='text-sm text-gray-500'>아직 계정이 없으신가요?</span>
          <button
            onClick={() => router.push('/auth/signup')}
            className='text-sm text-primary font-medium'
          >
            회원가입
          </button>
        </div>
      </div>

      <div className='w-full h-fit py-8 text-center text-sm font-normal leading-[1.2] opacity-40'>© ZERONINEZ</div>
    </Screen>
  )
}
