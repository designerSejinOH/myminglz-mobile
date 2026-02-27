'use client'

import { Screen } from '@/components'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Screen className='bg-[#242424] flex flex-col justify-center items-center'>
      <div className='animate-pulse'>
        <img src='/img/sample/profile.png' alt='logo' className='w-auto h-24' />
      </div>
      <span className='text-base mt-4 text-white/30 text-center'>문제가 발생했습니다.</span>
      <p className='text-sm mt-2 text-white/15 text-center'>{error.message}</p>
      <button
        onClick={() => reset()}
        className='w-full h-14 bg-primary rounded-full flex justify-center items-center active:scale-95 transition-transform duration-200'
      >
        다시 시도하기
      </button>
    </Screen>
  )
}
