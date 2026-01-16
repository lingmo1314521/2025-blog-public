'use client'

import React, { useState, useEffect } from 'react'
import { Search, Edit, Settings, X, Save } from 'lucide-react'
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

// --- 新增：用户信息设置弹窗 ---
const SettingsModal = ({ onClose, onSave }: { onClose: () => void, onSave: () => void }) => {
    const [nick, setNick] = useState('')
    const [mail, setMail] = useState('')
    const [link, setLink] = useState('')

    useEffect(() => {
        // Twikoo 默认使用这些 localStorage key 来存储用户信息
        setNick(localStorage.getItem('twikoo-nick') || '')
        setMail(localStorage.getItem('twikoo-mail') || '')
        setLink(localStorage.getItem('twikoo-link') || '')
    }, [])

    const handleSave = () => {
        localStorage.setItem('twikoo-nick', nick)
        localStorage.setItem('twikoo-mail', mail)
        localStorage.setItem('twikoo-link', link)
        onSave() // 触发刷新
        onClose()
    }

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-80 bg-[#f5f5f5] dark:bg-[#2c2c2c] rounded-xl shadow-2xl border border-white/20 p-5 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-sm dark:text-white">Profile Settings</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full"><X size={14}/></button>
                </div>
                
                <div className="space-y-3">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Nickname</label>
                        <input 
                            value={nick} 
                            onChange={e=>setNick(e.target.value)} 
                            className="w-full bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-md px-2 py-1.5 text-xs outline-none focus:border-blue-500 text-black dark:text-white" 
                            placeholder="Your Name"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Email (Optional)</label>
                        <input 
                            value={mail} 
                            onChange={e=>setMail(e.target.value)} 
                            className="w-full bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-md px-2 py-1.5 text-xs outline-none focus:border-blue-500 text-black dark:text-white" 
                            placeholder="For Gravatar"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Website (Optional)</label>
                        <input 
                            value={link} 
                            onChange={e=>setLink(e.target.value)} 
                            className="w-full bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-md px-2 py-1.5 text-xs outline-none focus:border-blue-500 text-black dark:text-white" 
                            placeholder="https://..."
                        />
                    </div>
                </div>

                <div className="mt-5 flex justify-end">
                    <button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1">
                        <Save size={12}/> Save
                    </button>
                </div>
            </div>
        </div>
    )
}

export const Messages = () => {
  const [activeContactId, setActiveContactId] = useState(CONTACTS[0].id)
  const [search, setSearch] = useState('')
  const [showSettings, setShowSettings] = useState(false) // 控制弹窗显示
  const [reloadKey, setReloadKey] = useState(0) // 用于强制刷新

  const activeContact = CONTACTS.find(c => c.id === activeContactId) || CONTACTS[0]
  const filteredContacts = CONTACTS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex h-full w-full bg-white dark:bg-[#1e1e1e] text-black dark:text-white font-sans overflow-hidden relative">
      
      {/* 弹窗 */}
      {showSettings && (
          <SettingsModal 
            onClose={() => setShowSettings(false)} 
            onSave={() => setReloadKey(k => k + 1)} 
          />
      )}

      {/* 左侧边栏 */}
      <div className="w-[280px] flex flex-col border-r border-gray-200 dark:border-white/10 bg-[#f5f5f5]/90 dark:bg-[#252525]/90 backdrop-blur-xl">
        <div className="h-12 flex items-center justify-between px-3 shrink-0 pt-2 mb-2">
           <div className="relative flex-1 mr-2">
              <Search size={12} className="absolute left-2 top-1.5 text-gray-400" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search" 
                className="w-full bg-gray-200/50 dark:bg-black/20 border border-transparent focus:border-blue-500/50 rounded-md py-1 pl-7 pr-2 text-xs outline-none transition-all placeholder-gray-500"
              />
           </div>
           <button className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-md text-blue-500">
              <Edit size={16} />
           </button>
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

      {/* 右侧主内容 */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1e1e1e] relative">
        
        {/* 顶部栏 */}
        <div className="h-12 border-b border-gray-200/50 dark:border-white/10 flex items-center justify-between px-4 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md shrink-0 z-20 sticky top-0">
            <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">To:</span>
                <div className="flex items-center gap-1 bg-blue-100/50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-500/20">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{activeContact.name}</span>
                </div>
            </div>
            
            {/* 设置按钮：点击打开用户信息设置弹窗 */}
            <button 
                onClick={() => setShowSettings(true)}
                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-all"
                title="Profile Settings"
            >
                <Settings size={16} />
            </button>
        </div>

        {/* 聊天区域容器 */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
            <CommentSystem 
                key={`${activeContact.slug}-${reloadKey}`} 
                slug={activeContact.slug} 
                title={activeContact.name}
                compact={true} 
                reloadKey={reloadKey}
            />
        </div>
      </div>
    </div>
  )
}