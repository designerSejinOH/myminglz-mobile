'use client'

import { useEffect, useRef } from 'react'
import { Toaster } from 'react-hot-toast'
import { NavBar } from './NavBar'
import { motion } from 'motion/react'
import { usePathname } from 'next/navigation'

export const Layout = ({ children }) => {
  const ref = useRef(null)
  const pathname = usePathname()

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        ref={ref}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          touchAction: 'auto',
        }}
        className='shadow-lg outline outline-black/10 outline-1 bg-[#121212] flex flex-col'
      >
        {children}
        <Toaster />
        {pathname !== '/' && !pathname.includes('/auth') && <NavBar />}
      </motion.div>
    </>
  )
}
