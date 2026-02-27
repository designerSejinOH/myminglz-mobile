'use client'

import { Icon } from '@/components'
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import classNames from 'classnames'
import { Profile } from '@/types'
import { useFollowCount } from '@/hooks/useFollowCount'
import { useFollowList } from '@/hooks/useFollowList'
import { useFollow } from '@/hooks/useFollow'

interface ProfileCardProps {
  mode: 'user' | 'guest'
  profiles?: Profile[]
}

export const ProfileCard = (props: ProfileCardProps) => {
  const { profiles } = props

  const main_profile = profiles ? profiles[0] : null
  // 팔로우 기능
  const { isFollowing, isLoading: isFollowLoading, toggleFollow } = useFollow(main_profile?.id || '')
  const { followerCount, followingCount } = useFollowCount(main_profile?.id || '')
  const { list, isLoading: isFollowListLoading } = useFollowList(main_profile?.id || '', 'followers')

  const [isProfileImageModalOpen, setIsProfileImageModalOpen] = useState({
    open: false,
    image: '',
  })

  const handleClickImage = (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
    //이미지 클릭시 해당 이미지 확대 모달창 띄우기
    setIsProfileImageModalOpen({
      open: true,
      image: e.currentTarget.src,
    })
  }

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation()
        }}
        className={classNames('w-full h-full rounded-2xl bg-card flex flex-col justify-start items-center')}
      >
        {/* header */}
        <div className='w-full h-fit flex flex-row justify-between items-center px-4 py-4 gap-2'>
          {/* TODO: 멀티프로필 */}
          <div className='h-fit flex flex-row justify-start items-center -space-x-2'>
            {profiles?.map((profile, index, arr) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={index}
                src={profile?.profile_image ? profile.profile_image : '/img/sample/profile.png'}
                alt={`follower-${index}`}
                style={{ zIndex: arr.length - index }}
                className='w-10 h-10 bg-black rounded-full object-cover outline outline-1.5 outline-card'
              />
            ))}
            <div className='w-10 h-10 ml-4 bg-white/10 flex justify-center items-center rounded-full z-10'>
              <Icon icon='plus' size={24} />
            </div>
          </div>
          <button onClick={toggleFollow} disabled={isFollowLoading} className='border rounded-2xl px-4 w-fit h-10'>
            {isFollowing ? '언팔로우' : '팔로우'}
          </button>
        </div>
        {/* contents */}
        {/* top */}
        <div className='w-full h-full relative px-4 pb-4 flex flex-col justify-center items-center gap-4'>
          <div className=' w-full h-fit flex flex-col justify-start items-start gap-3'>
            <div className=' w-full h-fit'>
              <h1 className='text-3xl font-semibold leading-tight'>{main_profile?.username || 'unknown'}</h1>
            </div>
            <div className=' w-fit h-fit flex flex-row justify-start items-center gap-4'>
              <div className='w-fit h-fit flex flex-row text-sm leading-tight justify-start items-center gap-1'>
                <span className='opacity-80'>팔로워</span>
                <span className=''>{followerCount}</span>
              </div>
              <div className='w-fit h-fit flex flex-row text-sm leading-tight justify-start items-center gap-1'>
                <span className='opacity-80'>팔로잉</span>
                <span className=''>{followingCount}</span>
              </div>
            </div>
          </div>
          {/* middle */}
          <div className='w-full h-full flex justify-center items-center rounded-xl overflow-hidden relative'>
            {main_profile?.profile_image === null ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                onClick={(e) => {
                  e.stopPropagation()
                  handleClickImage(e)
                }}
                src={'/img/sample/profile.png'}
                alt='sample.profile'
                className='absolute w-auto h-full object-cover active:scale-95 transition-transform duration-200 ease-in-out'
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                onClick={(e) => {
                  e.stopPropagation()
                  handleClickImage(e)
                }}
                src={main_profile?.profile_image || '/img/sample/profile.png'}
                alt='profile'
                className='absolute w-auto h-full object-cover active:scale-95 transition-transform duration-200 ease-in-out'
              />
            )}
          </div>
          {/* bottom */}
          <div className='w-full h-fit flex flex-col justify-start items-start gap-2'>
            <div className='w-full h-fit text-xl font-semibold leading-tight'>
              {main_profile?.display_name || 'Unknown User'}
            </div>
            <div className='w-full h-fit text-base font-medium leading-tight'>
              {main_profile?.username || 'unknown'}
            </div>
            <p className='w-full h-fit text-sm font-normal leading-normal opacity-90'>{main_profile?.bio || ''}</p>
          </div>
        </div>
      </div>
      {/* profile image modal */}
      <AnimatePresence>
        {isProfileImageModalOpen.open && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='fixed inset-0 z-50 flex justify-center items-center bg-[#1A1A1A]/80 backdrop-blur-md'
          >
            <button
              onClick={() =>
                setIsProfileImageModalOpen({
                  open: false,
                  image: '',
                })
              }
              className='absolute top-0 right-0 p-4 text-white'
            >
              <Icon icon='close' size={20} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={isProfileImageModalOpen.image}
              alt='profile enlarged'
              className='max-w-full max-h-full object-contain'
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
