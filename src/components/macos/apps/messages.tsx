'use client'

import React, { useState, useEffect } from 'react'
import { Search, Edit, Settings as SettingsIcon, ChevronLeft, User, Mail, Globe } from 'lucide-react'
import { clsx } from '../utils'
import CommentSystem from '@/components/CommentSystem'

const CONTACTS = [
  { 
    id: 'guestbook', 
    name: 'Guestbook', 
    slug: 'messages-guestbook', 
    avatar: '🌍', 
    desc: 'Leave a message for everyone!',
    time: 'Now'
  },
  { 
    id: 'tech', 
    name: 'Tech Talk', 
    slug: 'messages-tech', 
    avatar: '💻', 
    desc: 'Discuss React, Next.js...',
    time: 'Yesterday'
  },
  { 
    id: 'feedback', 
    name: 'Bug Report', 
    slug: 'messages-bugs', 
    avatar: '🐛', 
    desc: 'Found a bug? Tell me here.',
    time: 'Mon'
  }
]

export const Messages = () => {
  const [activeContactId, setActiveContactId] = useState(CONTACTS[0].id)
  const [search, setSearch] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0) // 用于强制刷新评论组件

  // 设置表单状态
  const [nick, setNick] = useState('')
  const [mail, setMail] = useState('')
  const [link, setLink] = useState('')

  const activeContact = CONTACTS.find(c => c.id === activeContactId) || CONTACTS[0]
  const filteredContacts = CONTACTS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  // 打开设置时，读取本地存储
  const openSettings = () => {
    setNick(localStorage.getItem('twikoo-nick') || '')
    setMail(localStorage.getItem('twikoo-mail') || '')
    setLink(localStorage.getItem('twikoo-link') || '')
    setIsSettingsOpen(true)
  }

  // 保存设置
  const saveSettings = () => {
    localStorage.setItem('twikoo-nick', nick)
    localStorage.setItem('twikoo-mail', mail)
    localStorage.setItem('twikoo-link', link)
    setIsSettingsOpen(false)
    setRefreshKey(k => k + 1) // 强制刷新 Twikoo 以应用新信息
  }

  return (
    <div className="flex h-full w-full bg-white dark:bg-[#1e1e1e] text-black dark:text-white font-sans overflow-hidden">
      
      {/* --- 左侧边栏 --- */}
      <div className="w-[280px] flex flex-col border-r border-gray-200 dark:border-white/10 bg-[#f5f5f5]/90 dark:bg-[#252525]/90 backdrop-blur-xl">
        
        {/* 顶部栏 */}
        <div className="h-12 flex items-center justify-between px-3 shrink-0 pt-2 mb-2 gap-2">
           {/* 搜索框 */}
           <div className="relative flex-1">
              <Search size={12} className="absolute left-2 top-1.5 text-gray-400" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search" 
                className="w-full bg-gray-200/50 dark:bg-black/20 border border-transparent focus:border-blue-500/50 rounded-md py-1 pl-7 pr-2 text-xs outline-none transition-all placeholder-gray-500"
              />
           </div>
           
           {/* 设置按钮 */}
           <button 
             onClick={openSettings}
             className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-md text-gray-500 hover:text-blue-500 transition-colors"
             title="User Settings"
           >
              <SettingsIcon size={14} />
           </button>
        </div>

        {/* 联系人列表 */}
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
                    <div className={clsx(
                        "w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 bg-white shadow-sm overflow-hidden",
                        activeContactId === contact.id ? "bg-white/20 text-white backdrop-blur-sm" : "text-gray-600"
                    )}>
                        {contact.avatar}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex justify-between items-baseline">
                            <span className={clsx("font-semibold text-sm truncate", activeContactId === contact.id ? "text-white" : "text-gray-900 dark:text-gray-100")}>
                                {contact.name}
                            </span>
                            <span className={clsx("text-[10px]", activeContactId === contact.id ? "text-blue-100" : "text-gray-400")}>
                                {contact.time}
                            </span>
                        </div>
                        <div className={clsx("text-xs truncate opacity-90", activeContactId === contact.id ? "text-blue-100" : "text-gray-500 dark:text-gray-400")}>
                            {contact.desc}
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* --- 右侧主内容 --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1e1e1e] relative">
        
        {/* 设置界面 (覆盖层) */}
        {isSettingsOpen ? (
            <div className="absolute inset-0 z-50 bg-[#f5f5f5] dark:bg-[#1e1e1e] flex flex-col animate-in fade-in slide-in-from-right-10 duration-200">
                {/* 设置头部 */}
                <div className="h-12 border-b border-gray-200 dark:border-white/10 flex items-center px-4 gap-3 bg-white dark:bg-[#252525]">
                    <button onClick={() => setIsSettingsOpen(false)} className="flex items-center gap-1 text-blue-500 text-sm hover:opacity-80">
                        <ChevronLeft size={18}/> Back
                    </button>
                    <span className="font-bold text-sm ml-auto mr-auto -translate-x-8">iMessage Settings</span>
                </div>
                
                {/* 设置表单 */}
                <div className="flex-1 p-8 flex flex-col items-center max-w-md mx-auto w-full">
                    <div className="w-20 h-20 bg-gray-200 dark:bg-white/10 rounded-full flex items-center justify-center text-4xl mb-6 text-gray-400">
                        👤
                    </div>
                    
                    <div className="w-full space-y-4 bg-white dark:bg-[#2c2c2c] p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">My Information</h3>
                        
                        <div className="flex items-center gap-3 border-b border-gray-100 dark:border-white/5 pb-2">
                            <User size={16} className="text-gray-400"/>
                            <input 
                                value={nick} 
                                onChange={e => setNick(e.target.value)} 
                                placeholder="Nickname" 
                                className="flex-1 bg-transparent text-sm outline-none"
                            />
                        </div>
                        
                        <div className="flex items-center gap-3 border-b border-gray-100 dark:border-white/5 pb-2">
                            <Mail size={16} className="text-gray-400"/>
                            <input 
                                value={mail} 
                                onChange={e => setMail(e.target.value)} 
                                placeholder="Email (for Gravatar)" 
                                className="flex-1 bg-transparent text-sm outline-none"
                            />
                        </div>
                        
                        <div className="flex items-center gap-3 pb-2">
                            <Globe size={16} className="text-gray-400"/>
                            <input 
                                value={link} 
                                onChange={e => setLink(e.target.value)} 
                                placeholder="Website (http://...)" 
                                className="flex-1 bg-transparent text-sm outline-none"
                            />
                        </div>
                    </div>
                    
                    <p className="text-[10px] text-gray-400 mt-4 text-center max-w-xs">
                        This information is saved locally and used for your comments. Your email is used for Gravatar only.
                    </p>

                    <button 
                        onClick={saveSettings}
                        className="mt-8 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        ) : (
            // 正常聊天界面
            <>
                {/* 顶部联系人信息 */}
                <div className="h-12 border-b border-gray-200/50 dark:border-white/10 flex items-center px-4 gap-3 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md shrink-0 z-20 sticky top-0">
                    <span className="text-xs text-gray-400">To:</span>
                    <div className="flex items-center gap-1 bg-blue-100/50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-500/20">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{activeContact.name}</span>
                    </div>
                </div>

                {/* 聊天区域容器：高度自适应 */}
                <div className="flex-1 overflow-hidden relative flex flex-col">
                    <CommentSystem 
                        key={`${activeContact.slug}-${refreshKey}`} // 加上 refreshKey 确保更新设置后重载
                        slug={activeContact.slug} 
                        title={activeContact.name}
                        compact={true} 
                    />
                </div>
            </>
        )}
      </div>
    </div>
  )
}