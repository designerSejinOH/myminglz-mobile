'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Screen, Icon, ProfileImageUpload } from '@/components'
import { useAuthStore } from '@/stores/authStore'
import { useProfileStore } from '@/stores/profileStore'
import classNames from 'classnames'
import toast from 'react-hot-toast'
import { active_classNames } from '@/theme/transitions'

export default function SettingsPage() {
  const router = useRouter()
  const { user, signOut } = useAuthStore()
  // AuthProvider가 로그인 시 자동으로 프로필을 로드하므로 별도 fetch 불필요
  const { profile, updateProfile, checkUsernameAvailable } = useProfileStore()

  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')

  //프로필 이미지 편집 상태
  const [isEditingImage, setIsEditingImage] = useState(false)

  // 계정 삭제 관련 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // 프로필 데이터로 폼 초기화
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name)
      setUsername(profile.username)
      setBio(profile.bio || '')
    }
  }, [profile])

  // username 중복 체크 (디바운스)
  useEffect(() => {
    if (!isEditing || !username || username.length < 3) {
      setUsernameStatus('idle')
      return
    }

    // 현재 username과 동일하면 체크 불필요
    if (username === profile?.username) {
      setUsernameStatus('available')
      return
    }

    const isValidFormat = /^[a-zA-Z0-9_]{3,20}$/.test(username)
    if (!isValidFormat) {
      setUsernameStatus('idle')
      return
    }

    setUsernameStatus('checking')
    const timer = setTimeout(async () => {
      const isAvailable = await checkUsernameAvailable(username, user?.id)
      setUsernameStatus(isAvailable ? 'available' : 'taken')
    }, 500)

    return () => clearTimeout(timer)
  }, [username, isEditing, profile?.username, checkUsernameAvailable, user?.id])

  const handleSignOut = async () => {
    await signOut()
    toast.success('로그아웃 되었습니다')
    router.push('/')
  }

  const handleCancelEdit = () => {
    if (profile) {
      setDisplayName(profile.display_name)
      setUsername(profile.username)
      setBio(profile.bio || '')
    }
    setIsEditing(false)
    setUsernameStatus('idle')
  }

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

  const handleSaveProfile = async () => {
    if (!user) return
    if (!validateForm()) return

    setIsSubmitting(true)

    const { error } = await updateProfile(user.id, {
      display_name: displayName.trim(),
      username: username.toLowerCase(),
      bio: bio.trim(),
    })

    if (error) {
      toast.error(error.message || '프로필 수정에 실패했습니다')
      setIsSubmitting(false)
      return
    }

    toast.success('프로필이 수정되었습니다')
    setIsEditing(false)
    setIsSubmitting(false)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== '계정삭제') {
      toast.error('확인 문구를 정확히 입력해주세요')
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '계정 삭제에 실패했습니다')
      }

      // 클라이언트 상태 초기화
      await signOut()

      toast.success('계정이 삭제되었습니다')
      router.push('/')
    } catch (error: any) {
      toast.error(error.message || '계정 삭제에 실패했습니다')
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Screen
        className={classNames('bg-[#242424]', 'fixed inset-0 z-50')}
        header={{
          title: '설정',
          left: {
            icon: 'left',
            onClick: () => router.back(),
          },
        }}
      >
        <div className='w-full h-full flex flex-col px-4 py-4 gap-6 overflow-y-auto pb-20'>
          <section className='flex flex-col items-center gap-3'>
            <div className={classNames('relative')}>
              <img
                src={profile?.profile_image || '/img/sample/profile.png'}
                alt='Profile Image'
                className='object-cover w-24 h-24 rounded-full overflow-hidden border border-white/30 shadow-lg'
              />
              <div
                className={classNames(
                  'absolute -right-1 z-10 -bottom-1 bg-black w-fit h-fit p-1.5 border border-white/50 rounded-full shadow-lg flex items-center justify-center',
                  active_classNames,
                )}
                onClick={() => setIsEditingImage(true)}
              >
                <Icon icon='edit' size={16} className='text-white/70' />
              </div>
            </div>
            <ProfileImageUpload
              isOpen={isEditingImage}
              onClose={() => setIsEditingImage(false)}
              profileId={profile?.id || ''}
              currentImageUrl={profile?.profile_image || null}
            />
          </section>
          {/* 프로필 섹션 */}
          <section className='flex flex-col gap-3'>
            <div className='flex flex-row justify-between items-center'>
              <h2 className='text-sm font-medium text-gray-400'>프로필</h2>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className='text-sm text-primary'>
                  수정
                </button>
              ) : (
                <div className='flex flex-row gap-3'>
                  <button onClick={handleCancelEdit} className='text-sm text-gray-400'>
                    취소
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSubmitting || usernameStatus === 'taken' || usernameStatus === 'checking'}
                    className='text-sm text-primary disabled:opacity-50'
                  >
                    {isSubmitting ? '저장 중...' : '저장'}
                  </button>
                </div>
              )}
            </div>

            <div className='bg-gray-800 rounded-xl p-4 flex flex-col gap-4'>
              {/* 이름 */}
              <div className='flex flex-col gap-2'>
                <span className='text-sm text-gray-400'>이름</span>
                {isEditing ? (
                  <input
                    type='text'
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={30}
                    className='w-full h-10 px-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors'
                    disabled={isSubmitting}
                  />
                ) : (
                  <span className='text-sm text-white'>{profile?.display_name || '-'}</span>
                )}
              </div>

              {/* 아이디 */}
              <div className='flex flex-col gap-2'>
                <span className='text-sm text-gray-400'>아이디</span>
                {isEditing ? (
                  <>
                    <div className='relative'>
                      <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm'>@</span>
                      <input
                        type='text'
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase())}
                        maxLength={20}
                        className='w-full h-10 pl-8 pr-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors'
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-xs text-gray-500'>영어, 숫자, 언더스코어 (3-20자)</span>
                      {usernameStatus === 'checking' && <span className='text-xs text-gray-400'>확인 중...</span>}
                      {usernameStatus === 'available' && <span className='text-xs text-green-400'>사용 가능</span>}
                      {usernameStatus === 'taken' && <span className='text-xs text-red-400'>이미 사용 중</span>}
                    </div>
                  </>
                ) : (
                  <span className='text-sm text-white'>@{profile?.username || '-'}</span>
                )}
              </div>

              {/* 한줄 소개 */}
              <div className='flex flex-col gap-2'>
                <span className='text-sm text-gray-400'>한줄 소개</span>
                {isEditing ? (
                  <>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      maxLength={150}
                      rows={3}
                      className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors resize-none'
                      disabled={isSubmitting}
                      placeholder='간단한 자기소개를 입력해주세요'
                    />
                    <span className='text-xs text-gray-500 text-right'>{bio.length}/150</span>
                  </>
                ) : (
                  <span className='text-sm text-white'>{profile?.bio || '-'}</span>
                )}
              </div>
            </div>
          </section>

          {/* 계정 정보 섹션 */}
          <section className='flex flex-col gap-3'>
            <h2 className='text-sm font-medium text-gray-400'>계정 정보</h2>
            <div className='bg-gray-800 rounded-xl p-4 flex flex-col gap-3'>
              <div className='flex flex-row justify-between items-center'>
                <span className='text-sm text-gray-400'>이메일</span>
                <span className='text-sm text-white'>{user?.email || '-'}</span>
              </div>
              <div className='flex flex-row justify-between items-center'>
                <span className='text-sm text-gray-400'>가입일</span>
                <span className='text-sm text-white'>
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
                </span>
              </div>
              <div className='flex flex-row justify-between items-center'>
                <span className='text-sm text-gray-400'>마지막 로그인</span>
                <span className='text-sm text-white'>
                  {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('ko-KR') : '-'}
                </span>
              </div>
            </div>
          </section>

          {/* 계정 관리 섹션 */}
          <section className='flex flex-col gap-3'>
            <h2 className='text-sm font-medium text-gray-400'>계정 관리</h2>
            <div className='flex flex-col gap-2'>
              <button
                onClick={handleSignOut}
                className='w-full bg-gray-800 rounded-xl p-4 flex flex-row justify-between items-center active:bg-gray-700 transition-colors'
              >
                <span className='text-sm text-red-400'>로그아웃</span>
                <Icon icon='log-out' size={18} className='text-red-400' />
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className='w-full bg-gray-800 rounded-xl p-4 flex flex-row justify-between items-center active:bg-gray-700 transition-colors'
              >
                <span className='text-sm text-red-500'>계정 삭제</span>
                <Icon icon='trash-2' size={18} className='text-red-500' />
              </button>
            </div>
          </section>

          {/* 앱 정보 섹션 */}
          <section className='flex flex-col gap-3'>
            <h2 className='text-sm font-medium text-gray-400'>앱 정보</h2>
            <div className='bg-gray-800 rounded-xl p-4 flex flex-col gap-3'>
              <div className='flex flex-row justify-between items-center'>
                <span className='text-sm text-gray-400'>버전</span>
                <span className='text-sm text-white'>{process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}</span>
              </div>
            </div>
          </section>
        </div>
      </Screen>

      {/* 계정 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70'>
          <div className='w-[90%] max-w-sm bg-gray-900 rounded-2xl p-6 flex flex-col gap-4'>
            <div className='flex flex-col gap-2'>
              <h3 className='text-lg font-semibold text-white'>계정 삭제</h3>
              <p className='text-sm text-gray-400'>
                계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
              </p>
            </div>

            <div className='flex flex-col gap-2'>
              <label className='text-sm text-gray-400'>
                계속하려면 <span className='text-red-400 font-medium'>계정삭제</span>를 입력하세요
              </label>
              <input
                type='text'
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder='계정삭제'
                className='w-full h-12 px-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500 transition-colors'
                disabled={isDeleting}
              />
            </div>

            <div className='flex flex-row gap-3 mt-2'>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                }}
                disabled={isDeleting}
                className='flex-1 h-12 bg-gray-800 rounded-xl flex justify-center items-center active:bg-gray-700 transition-colors disabled:opacity-50'
              >
                <span className='text-sm font-medium text-gray-300'>취소</span>
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmText !== '계정삭제'}
                className='flex-1 h-12 bg-red-600 rounded-xl flex justify-center items-center active:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <span className='text-sm font-medium text-white'>{isDeleting ? '삭제 중...' : '삭제'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
