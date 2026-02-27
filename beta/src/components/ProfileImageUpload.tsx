'use client'

import { useState, useRef, useEffect } from 'react'
import { uploadProfileImage, deleteProfileImage } from '@/lib/uploadProfileImage'
import { AnimatePresence, motion } from 'motion/react'
import { Icon } from './Icon'
import { useProfileStore } from '@/stores/profileStore'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'

interface Props {
  profileId: string
  currentImageUrl?: string | null
  isOpen?: boolean
  onClose?: () => void
}

type UploadStatus = 'idle' | 'compressing' | 'uploading' | 'deleting'

export function ProfileImageUpload({ profileId, currentImageUrl, isOpen, onClose }: Props) {
  const { user } = useAuthStore()
  const { refreshProfile } = useProfileStore()

  const [imageUrl, setImageUrl] = useState(currentImageUrl ?? null)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const isLoading = status !== 'idle'

  useEffect(() => {
    setImageUrl(currentImageUrl ?? null)
  }, [currentImageUrl])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능해요.')
      return
    }

    // 미리보기
    const preview = URL.createObjectURL(file)
    setImageUrl(preview)
    setProgress(0)

    const toastId = toast.loading('압축 중... 0%')

    try {
      const url = await uploadProfileImage(
        file,
        profileId,
        (compressProgress) => {
          setStatus('compressing')
          const p = Math.round(compressProgress * 0.5)
          setProgress(p)
          toast.loading(`압축 중... ${p}%`, { id: toastId })
        },
        (uploadProgress) => {
          setStatus('uploading')
          const p = 50 + Math.round(uploadProgress * 0.5)
          setProgress(p)
          toast.loading(`업로드 중... ${p}%`, { id: toastId })
        },
      )

      setImageUrl(url)
      setStatus('idle')
      setProgress(0)
      toast.success('프로필 사진이 저장됐어요.', { id: toastId })
      refreshProfile(user?.id || '')
    } catch (err) {
      console.error(err)
      setImageUrl(currentImageUrl ?? null)
      setStatus('idle')
      setProgress(0)
      toast.error('업로드에 실패했어요. 다시 시도해줘.', { id: toastId })
    }
  }

  const handleDelete = async () => {
    const toastId = toast.loading('사진 삭제 중...')
    setStatus('deleting')

    try {
      await deleteProfileImage(profileId)
      setImageUrl(null)
      setStatus('idle')
      toast.success('프로필 사진이 삭제됐어요.', { id: toastId })
      refreshProfile(user?.id || '')
    } catch (err) {
      console.error(err)
      setStatus('idle')
      toast.error('삭제에 실패했어요. 다시 시도해줘.', { id: toastId })
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col justify-center items-center gap-6 p-4'
        >
          {/* 닫기 버튼 */}
          <button className='absolute top-0 right-0 w-fit h-fit p-4' onClick={onClose}>
            <Icon icon='close' size={20} className='text-white' />
          </button>

          {/* 프로필 이미지 */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className='relative w-[70vw] aspect-square'
          >
            <div className='w-full h-full rounded-full overflow-hidden bg-black border border-white/30'>
              <img
                src={imageUrl ? imageUrl : '/img/sample/profile.png'}
                alt='프로필'
                className='w-full h-full object-cover'
              />

              {/* 로딩 오버레이 */}
              {isLoading && (
                <div className='absolute inset-0 rounded-full bg-black/50 flex items-center justify-center'>
                  {status === 'deleting' ? (
                    <Icon icon='delete' size={24} className='text-white/60' />
                  ) : (
                    // 원형 프로그레스
                    <svg className='w-16 h-16 -rotate-90' viewBox='0 0 64 64'>
                      <circle cx='32' cy='32' r='28' fill='none' stroke='white' strokeOpacity={0.2} strokeWidth='4' />
                      <circle
                        cx='32'
                        cy='32'
                        r='28'
                        fill='none'
                        stroke='white'
                        strokeWidth='4'
                        strokeLinecap='round'
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                        className='transition-all duration-300'
                      />
                    </svg>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* 하단 액션 버튼들 */}
          <div className='flex gap-3'>
            <button
              onClick={() => inputRef.current?.click()}
              disabled={isLoading}
              className='flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors'
            >
              <Icon icon={imageUrl ? 'edit' : 'add'} size={16} className='text-black' />
              {imageUrl ? '사진 변경' : '사진 추가'}
            </button>

            {imageUrl && (
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className='flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors'
              >
                <Icon icon='delete' size={16} className='text-white' />
                사진 삭제
              </button>
            )}
          </div>

          <input ref={inputRef} type='file' accept='image/*' className='hidden' onChange={handleFileChange} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
