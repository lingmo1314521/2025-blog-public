// components/macos/notifications.tsx
'use client'

import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Bell, Info, CheckCircle, AlertTriangle } from 'lucide-react'
import { useOs } from './os-context'

export const Notifications = () => {
  const { notifications, removeNotification } = useOs()

  return (
    <div className="fixed top-12 right-4 z-[10000] flex flex-col gap-3 w-80 pointer-events-none">
      <AnimatePresence>
        {notifications.map((note) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            layout // 自动布局动画
            className="pointer-events-auto bg-white/80 dark:bg-[#2c2c2c]/80 backdrop-blur-xl border border-white/20 shadow-xl rounded-xl p-3 flex gap-3 relative overflow-hidden"
          >
            {/* Icon */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                note.type === 'success' ? 'bg-green-100 text-green-600' :
                note.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                'bg-blue-100 text-blue-600'
            }`}>
                {note.type === 'success' ? <CheckCircle size={20} /> :
                 note.type === 'warning' ? <AlertTriangle size={20} /> :
                 note.icon || <Info size={20} />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="font-semibold text-sm truncate">{note.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight line-clamp-2">{note.message}</div>
            </div>

            {/* Close */}
            <button 
                onClick={() => removeNotification(note.id)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
                <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}