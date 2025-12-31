'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export function Gallery() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. 初始加载数据
    const fetchGallery = async () => {
      const { data, error } = await supabase
        .from('gallery_items')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!error) setItems(data || [])
      setLoading(false)
    }

    fetchGallery()

    // 2. 订阅数据库实时变更 (Realtime)
    // 每当有人成功插入数据，画廊会自动更新，无需刷新
    const channel = supabase
      .channel('public:gallery_items')
      .on('postgres_changes', 
        { event: 'INSERT', table: 'gallery_items', schema: 'public' }, 
        (payload) => {
          setItems((prev) => [payload.new, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) {
    return (
      <div className='flex h-64 items-center justify-center text-slate-400'>
        <div className='flex flex-col items-center gap-2'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent'></div>
          <p>正在拉取艺术品列表...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        <AnimatePresence mode='popLayout'>
          {items.map((item) => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className='group overflow-hidden rounded-2xl border bg-white shadow-sm transition-hover hover:shadow-xl'
            >
              <div className='relative aspect-[4/3] overflow-hidden bg-slate-100'>
                <img
                  src={item.image_url}
                  alt={item.title}
                  className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-110'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100 flex items-end p-4'>
                  <p className='text-[10px] text-white/80'>尺寸: {item.width} × {item.height}</p>
                </div>
              </div>
              <div className='p-4'>
                <div className='flex items-center justify-between'>
                  <h4 className='font-bold text-slate-800 line-clamp-1'>{item.title}</h4>
                </div>
                <div className='mt-2 flex items-center justify-between text-[11px] text-slate-400'>
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  <span className='rounded bg-slate-100 px-1.5 py-0.5 text-slate-500'>
                    {item.processing_time?.toFixed(0)}ms
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {items.length === 0 && (
        <div className='flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 py-20 text-slate-400'>
          <span className='text-4xl'>🎨</span>
          <p className='mt-4'>画廊还是空的，快去转换第一张作品并分享吧！</p>
        </div>
      )}
    </div>
  )
}