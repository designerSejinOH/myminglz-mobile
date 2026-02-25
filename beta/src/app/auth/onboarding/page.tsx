'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Screen } from '@/components'
import { useAuthStore } from '@/stores/authStore'
import { useProfileStore } from '@/stores/profileStore'
import classNames from 'classnames'
import toast from 'react-hot-toast'

export default function ProfileSetupPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuthStore()
  // AuthProvider가 로그인 시 자동으로 프로필을 로드하므로 별도 fetch 불필요
  const { profile, isLoading: profileLoading, createProfile, checkUsernameAvailable } = useProfileStore()

  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')

  const [onboardingStep, setOnboardingStep] = useState(0) // 0: 아이디 1: 프로필 설정 2: 한줄 소개

  // 프로필이 이미 있으면 메인으로 이동 (AuthProvider가 이미 fetch 완료한 상태)
  useEffect(() => {
    if (!authLoading && !profileLoading && profile) {
      router.push('/map')
    }
  }, [authLoading, profileLoading, profile, router])

  // username 중복 체크 (디바운스)
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameStatus('idle')
      return
    }

    // 유효성 검사
    const isValidFormat = /^[a-zA-Z0-9_]{3,20}$/.test(username)
    if (!isValidFormat) {
      setUsernameStatus('idle')
      return
    }

    setUsernameStatus('checking')
    const timer = setTimeout(async () => {
      const isAvailable = await checkUsernameAvailable(username)
      setUsernameStatus(isAvailable ? 'available' : 'taken')
    }, 500)

    return () => clearTimeout(timer)
  }, [username, checkUsernameAvailable])

  const validateForm = () => {
    if (!displayName.trim()) {
      toast.error('이름을 입력해주세요')
      return false
    }
    if (displayName.length > 30) {
      toast.error('이름은 30자 이내로 입력해주세요')
      return false
    }
    if (!username.trim()) {
      toast.error('아이디를 입력해주세요')
      return false
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      toast.error('아이디는 영어, 숫자, 언더스코어만 사용 가능합니다 (3-20자)')
      return false
    }
    if (usernameStatus === 'taken') {
      toast.error('이미 사용 중인 아이디입니다')
      return false
    }
    if (bio.length > 150) {
      toast.error('한줄 소개는 150자 이내로 입력해주세요')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    if (onboardingStep === 0) {
      e.preventDefault()
      if (!username.trim()) {
        toast.error('아이디를 입력해주세요')
        return
      }
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        toast.error('아이디는 영어, 숫자, 언더스코어만 사용 가능합니다 (3-20자)')
        return
      }
      if (usernameStatus === 'taken') {
        toast.error('이미 사용 중인 아이디입니다')
        return
      }
      setOnboardingStep(1)
      return
    } else if (onboardingStep === 1) {
      e.preventDefault()
      if (!displayName.trim()) {
        toast.error('이름을 입력해주세요')
        return
      }
      if (displayName.length > 30) {
        toast.error('이름은 30자 이내로 입력해주세요')
        return
      }
      setOnboardingStep(2)
      return
    }

    e.preventDefault()

    if (!user) return
    if (!validateForm()) return

    setIsSubmitting(true)

    const { error } = await createProfile(user.id, {
      username: username.toLowerCase(),
      display_name: displayName.trim(),
      bio: bio.trim(),
    })

    if (error) {
      toast.error(error.message || '프로필 생성에 실패했습니다')
      setIsSubmitting(false)
      return
    }

    toast.success('프로필이 생성되었습니다!')

    // router.push가 가끔 작동하지 않는 경우를 대비해 replace 사용
    router.replace('/map')

    // 만약 1초 후에도 페이지가 안 바뀌면 강제 이동
    setTimeout(() => {
      window.location.href = '/map'
    }, 1000)
  }

  if (authLoading || profileLoading) {
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
      {/* Header */}
      <div className='w-full flex flex-col justify-start items-start gap-4 p-6'>
        <div className='w-full h-fit flex justify-start items-center gap-2'>
          <span className='text-sm text-gray-500'>{onboardingStep + 1} / 3</span>
        </div>
        <h1 className='text-2xl font-semibold text-white'>
          {onboardingStep === 0
            ? '사용하실 아이디를 \n입력해주세요'
            : onboardingStep === 1
              ? '프로필 이름을 \n입력해주세요'
              : '간단한 자기소개를 \n입력해주세요'}
        </h1>
        <p className='text-xs text-gray-400 text-center'>
          {onboardingStep === 0
            ? '아이디는 영어, 숫자, 언더스코어만 사용 가능합니다 (3-20자)'
            : onboardingStep === 1
              ? '실명이나 닉네임 등 원하는 이름을 입력해주세요 (30자 이내)'
              : '자신을 간단히 소개할 수 있는 글을 입력해주세요 (150자 이내)'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className='w-full h-full flex flex-col'>
        <div className='w-full h-full flex flex-col gap-2'>
          {onboardingStep === 0 ? (
            <>
              {/* Username */}
              <div className='w-full h-full flex flex-col gap-2 p-6'>
                <div className='relative'>
                  <span className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-500'>@</span>
                  <input
                    id='username'
                    type='text'
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder='myminglz_user'
                    maxLength={20}
                    className='w-full h-12 pl-9 pr-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors'
                    disabled={isSubmitting}
                  />
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-xs text-gray-500'>영어, 숫자, 언더스코어 (3-20자)</span>
                  {usernameStatus === 'checking' && <span className='text-xs text-gray-400'>확인 중...</span>}
                  {usernameStatus === 'available' && <span className='text-xs text-green-400'>사용 가능</span>}
                  {usernameStatus === 'taken' && <span className='text-xs text-red-400'>이미 사용 중</span>}
                </div>
              </div>
            </>
          ) : onboardingStep === 1 ? (
            <>
              {/* Display Name */}
              <div className='w-full h-full flex flex-col gap-2 p-6'>
                <input
                  id='displayName'
                  type='text'
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder='홍길동'
                  maxLength={30}
                  className='w-full h-12 px-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors'
                  disabled={isSubmitting}
                />
                <span className='text-xs text-gray-500 text-right'>{displayName.length}/30</span>
              </div>
            </>
          ) : (
            <>
              {/* Bio */}
              <div className='w-full h-full flex flex-col gap-2 p-6'>
                <textarea
                  id='bio'
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder='간단한 자기소개를 입력해주세요'
                  maxLength={150}
                  rows={3}
                  className='w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors resize-none'
                  disabled={isSubmitting}
                />
                <span className='text-xs text-gray-500 text-right'>{bio.length}/150</span>
              </div>
            </>
          )}
        </div>
        {/* Submit Button */}
        <div className='w-full p-6 h-fit flex flex-col gap-2'>
          <button
            type='submit'
            disabled={
              onboardingStep === 0
                ? !username.trim() ||
                  !/^[a-zA-Z0-9_]{3,20}$/.test(username) ||
                  usernameStatus === 'taken' ||
                  usernameStatus === 'checking' ||
                  isSubmitting
                : onboardingStep === 1
                  ? !displayName.trim() || displayName.length > 30 || isSubmitting
                  : isSubmitting || usernameStatus === 'taken' || usernameStatus === 'checking'
            }
            className='w-full h-14 bg-primary rounded-full flex justify-center items-center mt-2 active:scale-95 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <span className='text-lg font-semibold text-black'>
              {onboardingStep === 0 ? '다음' : onboardingStep === 1 ? '다음' : isSubmitting ? '생성 중...' : '시작하기'}
            </span>
          </button>
        </div>
      </form>
    </Screen>
  )
}
