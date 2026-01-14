import React from 'react'
import { Desktop } from '@/components/macos/desktop'
import { INITIAL_APPS } from '@/components/macos/apps-config'

export default function MacOSPage() {
  return (
    // 强制黑色背景，防止加载闪烁，并禁止页面滚动
    <div className="h-screen w-screen overflow-hidden bg-black fixed inset-0 z-0">
      <Desktop apps={INITIAL_APPS} />
    </div>
  )
}