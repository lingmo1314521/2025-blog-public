'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { shareToGallery } from '@/app/actions/gallery-actions'

interface AsciiResult {
  asciiText: string
  imageUrl?: string
  width: number
  height: number
  processingTime: number
}

interface AsciiOutputsProps {
  result: AsciiResult
  imageTitle?: string
}

export function AsciiOutputs({ result, imageTitle }: AsciiOutputsProps) {
  const [activeTab, setActiveTab] = useState<'image' | 'text'>('image')
  const [shareTitle, setShareTitle] = useState(imageTitle || 'ASCII Art')
  const [isSharing, setIsSharing] = useState(false)

  const handleShare = async () => {
    if (!result.imageUrl) return
    setIsSharing(true)

    try {
      // 1. 将 Base64 图片转换为上传所需的 File 对象
      const blob = await (await fetch(result.imageUrl)).blob()
      const file = new File([blob], 'ascii.png', { type: 'image/png' })

      // 2. 封装 FormData
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', shareTitle)
      formData.append('asciiText', result.asciiText)
      formData.append('width', result.width.toString())
      formData.append('height', result.height.toString())
      formData.append('processingTime', result.processingTime.toString())

      // 3. 执行上传
      await shareToGallery(formData)
      alert('🎉 成功分享到画廊！')
    } catch (err) {
      console.error(err)
      alert('分享失败，请检查控制台输出')
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex gap-2 border-b'>
        {['image', 'text'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab ? 'border-brand border-b-2 text-brand' : 'text-slate-500'
            }`}
          >
            {tab === 'image' ? '转换图片' : '原始文本'}
          </button>
        ))}
      </div>

      {activeTab === 'image' && result.imageUrl && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='space-y-4'>
          <div className='overflow-hidden rounded-lg border bg-slate-50'>
            <img src={result.imageUrl} alt='ASCII Output' className='mx-auto max-h-[500px] object-contain' />
          </div>
          
          <div className='flex items-center gap-3 rounded-xl bg-slate-50 p-4 border border-dashed border-slate-300'>
            <input
              type='text'
              value={shareTitle}
              onChange={(e) => setShareTitle(e.target.value)}
              className='flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none'
              placeholder='给你的大作起个名字...'
            />
            <button
              onClick={handleShare}
              disabled={isSharing}
              className='rounded-md bg-brand px-6 py-2 text-sm font-bold text-white transition-all hover:bg-brand/90 disabled:opacity-50'
            >
              {isSharing ? '正在同步...' : '🚀 分享至云端画廊'}
            </button>
          </div>
        </motion.div>
      )}

      {activeTab === 'text' && (
        <div className='relative'>
          <textarea
            readOnly
            value={result.asciiText}
            className='h-64 w-full rounded-lg border bg-slate-900 p-4 font-mono text-[10px] leading-none text-green-400'
          />
        </div>
      )}
    </div>
  )
}