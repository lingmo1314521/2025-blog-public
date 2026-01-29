'use client'

import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { RefreshCw, Image as ImageIcon, Edit3, Trash2, FolderOpen, ExternalLink } from 'lucide-react'
import { useI18n } from './i18n-context' // 引入 hook

export type ContextMenuType = 'desktop' | 'file' | 'window'

interface ContextMenuProps {
  x: number
  y: number
  type: ContextMenuType
  meta?: any 
  onClose: () => void
  onRefresh: () => void
  onChangeWallpaper: () => void
  onOpen?: (meta: any) => void
  onEdit?: (meta: any) => void
  onDelete?: (meta: any) => void
}

export const ContextMenu = ({ 
  x, y, type, meta, 
  onClose, onRefresh, onChangeWallpaper, onOpen, onEdit, onDelete 
}: ContextMenuProps) => {
  const { t } = useI18n() // 获取 t 函数
  const menuRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const menuStyle: React.CSSProperties = { top: y, left: x }
  const isBottom = typeof window !== 'undefined' && y > window.innerHeight - 200
  if (isBottom) {
      menuStyle.top = 'auto'
      menuStyle.bottom = window.innerHeight - y
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.9, y: isBottom ? 10 : -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.1 }}
        className="fixed z-[99999] min-w-[160px] bg-white/80 dark:bg-[#2c2c2c]/80 backdrop-blur-xl border border-white/20 shadow-xl rounded-lg overflow-hidden py-1.5 flex flex-col select-none origin-top-left"
        style={menuStyle}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* === 文件菜单 === */}
        {type === 'file' && (
            <>
                <MenuItem icon={<FolderOpen size={14} />} label={t('ctx_open')} onClick={() => { onOpen?.(meta); onClose() }} bold />
                {/* <MenuItem icon={<ExternalLink size={14} />} label={t('ctx_open_new_tab')} onClick={() => { window.open(`/blog/${meta?.slug}`, '_blank'); onClose() }} />
                */}
                <div className="h-[1px] bg-black/5 dark:bg-white/10 my-1 mx-2" />
                <MenuItem icon={<Edit3 size={14} />} label={t('ctx_edit')} onClick={() => { onEdit?.(meta); onClose() }} />
                <div className="h-[1px] bg-black/5 dark:bg-white/10 my-1 mx-2" />
                <MenuItem icon={<Trash2 size={14} />} label={t('ctx_delete')} onClick={() => { onDelete?.(meta); onClose() }} variant="danger" />
            </>
        )}

        {/* === 桌面菜单 === */}
        {type === 'desktop' && (
            <>
                <MenuItem icon={<RefreshCw size={14} />} label={t('ctx_refresh')} onClick={() => { onRefresh(); onClose(); }} />
                <MenuItem icon={<ImageIcon size={14} />} label={t('ctx_wallpaper')} onClick={() => { onChangeWallpaper(); onClose(); }} />
            </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

const MenuItem = ({ icon, label, onClick, disabled = false, bold = false, variant = 'default' }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-2 px-3 py-1.5 mx-1 rounded text-xs text-left transition-colors
      ${disabled ? 'opacity-50 cursor-default' : 'cursor-pointer'}
      ${variant === 'danger' 
          ? 'text-red-600 hover:bg-red-500 hover:text-white' 
          : 'text-gray-800 dark:text-gray-200 hover:bg-blue-500 hover:text-white'}
    `}
  >
    {icon}
    <span className={bold ? "font-bold" : ""}>{label}</span>
  </button>
)