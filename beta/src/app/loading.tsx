import classNames from 'classnames'
import { NavBar, Screen } from '@/components'

export default function LoadingPage() {
  return (
    <>
      <Screen className='bg-[#242424] flex flex-col justify-center items-center'>
        <div className='animate-pulse'>
          <img src='/img/sample/profile.png' alt='logo' className='w-auto h-24' />
        </div>
        <span className='text-sm mt-4 text-white/15'>잠시만 기다려주세요!</span>
      </Screen>
    </>
  )
}
