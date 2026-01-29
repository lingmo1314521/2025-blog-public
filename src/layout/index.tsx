'use client'

import { PropsWithChildren } from 'react'
import { Toaster } from 'sonner'
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from 'lucide-react'
import { useSizeInit } from '@/hooks/use-size'
import { useCenterInit } from '@/hooks/use-center'

export default function Layout({ children }: PropsWithChildren) {
  // 初始化响应式尺寸监听 (保留这些 Hook 以防其他地方依赖)
  useSizeInit()
  useCenterInit()

  return (
    <>
      {/* 这里我们移除了 NavCard, MusicCard, ScrollTopButton 和旧的背景
         因为现在是 MacOS 桌面风格，这些旧博客组件不再需要。
      */}
      <div className="min-h-screen">
        {children}
      </div>

      {/* 全局 Toast 提示配置 */}
      <Toaster
        position='top-center'
        toastOptions={{
          classNames: {
            error: 'bg-red-50 dark:bg-red-950 border-red-100 dark:border-red-900 text-red-600 dark:text-red-200',
            success: 'bg-green-50 dark:bg-green-950 border-green-100 dark:border-green-900 text-green-600 dark:text-green-200',
            warning: 'bg-amber-50 dark:bg-amber-950 border-amber-100 dark:border-amber-900 text-amber-600 dark:text-amber-200',
            info: 'bg-blue-50 dark:bg-blue-950 border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-200'
          },
          icons: {
            success: <CircleCheckIcon className='text-success' />,
            info: <InfoIcon className='text-info' />,
            warning: <TriangleAlertIcon className='text-warning' />,
            error: <OctagonXIcon className='text-error' />,
            loading: <Loader2Icon className='animate-spin' />
          }
        }}
      />
    </>
  )
}