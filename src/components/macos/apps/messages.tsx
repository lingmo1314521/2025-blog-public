'use client'

import React, { useState } from 'react'
import { Search, Edit, User, MessageSquare } from 'lucide-react'
import { clsx } from '../utils'
import CommentSystem from '@/components/CommentSystem' // 引入你的评论系统

// 定义左侧联系人列表
// 每一个联系人实际上对应一个不同的评论区 Slug (唯一标识)
const CONTACTS = [
  { 
    id: 'guestbook', 
    name: 'Guestbook', 
    slug: 'messages-guestbook', // 对应 Giscus discussion 的 term 或 Twikoo 的 path
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

  const activeContact = CONTACTS.find(c => c.id === activeContactId) || CONTACTS[0]
  const filteredContacts = CONTACTS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex h-full w-full bg-white dark:bg-[#1e1e1e] text-black dark:text-white font-sans overflow-hidden">
      
      {/* --- 左侧边栏 (联系人列表) --- */}
      <div className="w-[300px] flex flex-col border-r border-gray-200 dark:border-white/10 bg-[#f5f5f5]/80 dark:bg-[#252525]/80 backdrop-blur-xl">
        
        {/* 顶部搜索栏 */}
        <div className="h-12 flex items-center justify-between px-3 shrink-0 pt-2">
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

        {/* 列表 */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
            {filteredContacts.map(contact => (
                <div 
                    key={contact.id}
                    onClick={() => setActiveContactId(contact.id)}
                    className={clsx(
                        "group flex gap-3 p-3 rounded-lg cursor-pointer transition-all mb-0.5",
                        activeContactId === contact.id 
                            ? "bg-blue-500 text-white shadow-sm" 
                            : "hover:bg-gray-200 dark:hover:bg-white/5"
                    )}
                >
                    {/* 头像 */}
                    <div className={clsx(
                        "w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 bg-white shadow-sm",
                        activeContactId === contact.id ? "bg-white/20 text-white backdrop-blur-sm" : "text-gray-600"
                    )}>
                        {contact.avatar}
                    </div>
                    
                    {/* 信息 */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex justify-between items-baseline">
                            <span className={clsx("font-semibold text-sm truncate", activeContactId === contact.id ? "text-white" : "text-gray-900 dark:text-gray-100")}>
                                {contact.name}
                            </span>
                            <span className={clsx("text-[10px]", activeContactId === contact.id ? "text-blue-100" : "text-gray-400")}>
                                {contact.time}
                            </span>
                        </div>
                        <div className={clsx("text-xs truncate", activeContactId === contact.id ? "text-blue-100" : "text-gray-500 dark:text-gray-400")}>
                            {contact.desc}
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* --- 右侧主内容 (聊天/评论区) --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1e1e1e]">
        
        {/* 顶部联系人信息 */}
        <div className="h-12 border-b border-gray-200 dark:border-white/10 flex items-center px-4 gap-3 bg-white/50 dark:bg-[#252525]/50 backdrop-blur-md shrink-0 z-10">
            <div className="text-sm text-gray-500 font-medium">To:</div>
            <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-300">{activeContact.name}</span>
            </div>
        </div>

        {/* 聊天内容区 (这里嵌入 CommentSystem) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 bg-white dark:bg-[#1e1e1e]">
            
            {/* 模拟一条 iMessage 欢迎气泡 */}
            <div className="flex flex-col gap-1 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="self-center text-[10px] text-gray-400 mb-2">iMessage with {activeContact.name}</div>
                
                {/* 对方的气泡 (灰) */}
                <div className="self-start max-w-[80%] bg-[#e9e9eb] dark:bg-[#333] text-black dark:text-white px-4 py-2 rounded-2xl rounded-bl-sm text-sm shadow-sm relative group">
                    <p>👋 Hello! Welcome to the <b>{activeContact.name}</b> channel.</p>
                </div>
                
                {/* 对方的气泡 2 */}
                <div className="self-start max-w-[80%] bg-[#e9e9eb] dark:bg-[#333] text-black dark:text-white px-4 py-2 rounded-2xl rounded-tl-sm text-sm shadow-sm mt-1">
                    <p>{activeContact.desc}</p>
                    <p className="mt-1 opacity-70">Feel free to leave a comment below! 👇</p>
                </div>
            </div>

            {/* 真实的评论系统嵌入 */}
            <div className="animate-in fade-in duration-700 delay-300">
                <div className="flex items-center gap-2 mb-2 px-2 opacity-50">
                    <div className="h-[1px] flex-1 bg-gray-200 dark:bg-white/10"></div>
                    <span className="text-[10px] text-gray-400">Live Comments</span>
                    <div className="h-[1px] flex-1 bg-gray-200 dark:bg-white/10"></div>
                </div>
                
                {/* 关键：传递 compact=true 和 对应的 slug */}
                <CommentSystem 
                    key={activeContact.slug} // 添加 key 确保切换联系人时组件完全重载
                    slug={activeContact.slug} 
                    title={activeContact.name}
                    compact={true} 
                />
            </div>

        </div>
      </div>
    </div>
  )
}