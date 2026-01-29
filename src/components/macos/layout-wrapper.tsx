'use client'

import React, { Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Layout from '@/layout'
import { Toaster } from 'sonner' // 1. 引入 Toaster (假设你用的是 sonner)
import { clsx } from '@/components/macos/utils' 

function LayoutLogic({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const isDesktop = pathname === '/'
  const isEmbedded = searchParams.get('embedded') === 'true'
  const isWritePage = pathname?.startsWith('/write')

  if (isDesktop || isEmbedded) {
    return (
        <div 
          id={isEmbedded ? "app-embedded" : "app-desktop"} 
          className={clsx(
            "min-h-screen bg-white dark:bg-[#121212]",
            isWritePage ? "embedded-write" : "embedded-read"
          )}
        >
            {children}
            {/* 添加 richColors 属性，恢复红绿彩色样式 */}
            <Toaster position="bottom-right" richColors /> 
        </div>
    )
  }

  // 原有的全局 Layout 通常已经包含了 Toaster，所以这里不用加
  return <Layout>{children}</Layout>
}

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-black"/>}>
      <LayoutLogic>{children}</LayoutLogic>
    </Suspense>
  )
}