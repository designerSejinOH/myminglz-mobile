'use client'

import { useRouter } from 'next/navigation'
import { Icon } from '@/components'

export const StatusBar = ({ credit }: { credit: number }) => {
  const router = useRouter()

  return (
    <div className='w-full h-fit flex flex-row justify-between items-end px-2 py-2'>
      <div className='w-fit h-fit flex flex-row justify-center items-center gap-2'>
        <div className='w-6 h-6 rounded-full bg-yellow text-black flex justify-center items-center text-sm font-medium leading-none'>
          C
        </div>
        <span className='text-sm font-normal leading-none'>{credit.toLocaleString()}</span>
      </div>
      <div className='flex flex-row gap-3 items-center'>
        <button onClick={() => router.push('/mypage/settings')} className='active:scale-95 transition-transform'>
          설정
        </button>
      </div>
    </div>
  )
}
