'use client'

import React, { useState, useMemo } from 'react'
import { Search, Edit } from 'lucide-react'
import { clsx } from '../utils'
import CommentSystem from '@/components/CommentSystem'
import { useI18n } from '../i18n-context'

export const Messages = () => {
  const { t } = useI18n()
  
  const CONTACTS = useMemo(() => [
    { 
      id: 'guestbook', 
      name: t('msg_guestbook'), 
      slug: 'messages-guestbook', 
      avatar: '🌍', 
      desc: t('msg_guestbook_desc'),
      time: t('msg_now')
    },
    { 
      id: 'tech', 
      name: t('msg_tech'), 
      slug: 'messages-tech', 
      avatar: '💻', 
      desc: t('msg_tech_desc'),
      time: t('msg_yesterday')
    },
    { 
      id: 'feedback', 
      name: t('msg_bug'), 
      slug: 'messages-bugs', 
      avatar: '🐛', 
      desc: t('msg_bug_desc'),
      time: t('msg_mon')
    }
  ], [t])

  const [activeContactId, setActiveContactId] = useState(CONTACTS[0].id)
  const [search, setSearch] = useState('')

  // 确保 activeContact 始终有效
  const activeContact = CONTACTS.find(c => c.id === activeContactId) || CONTACTS[0]
  const filteredContacts = CONTACTS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex h-full w-full bg-white dark:bg-[#1e1e1e] text-black dark:text-white font-sans overflow-hidden relative">
      
      {/* 左侧边栏 (联系人列表) */}
      <div className="w-[280px] flex flex-col border-r border-gray-200 dark:border-white/10 bg-[#f5f5f5]/90 dark:bg-[#252525]/90 backdrop-blur-xl">
        <div className="h-12 flex items-center justify-between px-3 shrink-0 pt-2 mb-2">
           <div className="relative flex-1 mr-2">
              <Search size={12} className="absolute left-2 top-1.5 text-gray-400" />
              <input 
                type="text" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder={t('msg_search')} 
                className="w-full bg-gray-200/50 dark:bg-black/20 border border-transparent focus:border-blue-500/50 rounded-md py-1 pl-7 pr-2 text-xs outline-none transition-all placeholder-gray-500"
              />
           </div>
           <button className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-md text-blue-500"><Edit size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2">
            {filteredContacts.map(contact => (
                <div 
                    key={contact.id} 
                    onClick={() => setActiveContactId(contact.id)} 
                    className={clsx(
                        "group flex gap-3 p-3 rounded-lg cursor-pointer transition-all mb-0.5 select-none", 
                        activeContactId === contact.id 
                            ? "bg-blue-500 text-white shadow-sm" 
                            : "hover:bg-gray-200 dark:hover:bg-white/5"
                    )}
                >
                    <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 bg-white shadow-sm overflow-hidden", activeContactId === contact.id ? "bg-white/20 text-white backdrop-blur-sm" : "text-gray-600")}>{contact.avatar}</div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex justify-between items-baseline">
                            <span className={clsx("font-semibold text-sm truncate", activeContactId === contact.id ? "text-white" : "text-gray-900 dark:text-gray-100")}>{contact.name}</span>
                            <span className={clsx("text-[10px]", activeContactId === contact.id ? "text-blue-100" : "text-gray-400")}>{contact.time}</span>
                        </div>
                        <div className={clsx("text-xs truncate opacity-90", activeContactId === contact.id ? "text-blue-100" : "text-gray-500 dark:text-gray-400")}>{contact.desc}</div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* 右侧主内容 */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1e1e1e] relative">
        
        {/* 顶部栏 */}
        <div className="h-12 border-b border-gray-200/50 dark:border-white/10 flex items-center justify-between px-4 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md shrink-0 z-20 sticky top-0">
            <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{t('msg_to')}</span>
                <div className="flex items-center gap-1 bg-blue-100/50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-500/20">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{activeContact.name}</span>
                </div>
            </div>
        </div>

        {/* 聊天区域 (只渲染 CommentSystem，样式由 globals.css 控制) */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
            <CommentSystem 
                key={activeContact.slug} 
                slug={activeContact.slug} 
                title={activeContact.name}
                compact={true} 
            />
        </div>
      </div>
    </div>
  )
}