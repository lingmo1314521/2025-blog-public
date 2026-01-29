'use client'

import React, { useState } from 'react'
import { Search, Reply, Trash2, Archive, Send, Inbox, FileText } from 'lucide-react'
import { clsx } from '../utils'
import { useOs } from '../os-context'
import { useI18n } from '../i18n-context'

const INITIAL_EMAILS = [
  { id: 1, sender: "GitHub", subject: "[GitHub] A new public key was added", preview: "Hi LynxMuse, A new public key was added...", time: "10:23 AM", read: false },
  { id: 2, sender: "Vercel", subject: "Deployment Succeeded", preview: "The deployment for project 'lynx-blog'...", time: "Yesterday", read: true },
  { id: 3, sender: "Kuro Games", subject: "Wuthering Waves Launch", preview: "Resonator Lynx, welcome to Solaris-3...", time: "Friday", read: true },
]

export const MailApp = () => {
  const { t } = useI18n()
  const { addNotification } = useOs()
  const [emails, setEmails] = useState(INITIAL_EMAILS)
  const [selectedId, setSelectedId] = useState<number | null>(1)
  const [nav, setNav] = useState('inbox')
  
  const selectedEmail = emails.find(e => e.id === selectedId)

  const handleDelete = () => {
    if (!selectedId) return
    setEmails(prev => prev.filter(e => e.id !== selectedId))
    setSelectedId(null)
    addNotification({ title: t('mail'), message: t('mail_deleted'), type: 'info', icon: <Trash2 size={18} /> })
  }

  const handleReply = () => {
    if (!selectedId) return
    addNotification({ title: t('mail'), message: t('mail_sent'), type: 'success', icon: <Send size={18} /> })
  }

  return (
    <div className="flex h-full w-full bg-white dark:bg-[#1e1e1e] text-black dark:text-white">
      {/* Sidebar */}
      <div className="w-40 bg-gray-100 dark:bg-[#2b2b2b] pt-8 flex flex-col gap-1 px-2 border-r border-gray-200 dark:border-white/10">
          {['inbox', 'sent', 'trash'].map(item => (
            <div key={item} onClick={() => setNav(item)} className={clsx("flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer", nav === item ? "bg-gray-300 dark:bg-white/20" : "hover:bg-gray-200 dark:hover:bg-white/10")}>
                {item === 'inbox' ? <Inbox size={16}/> : item === 'sent' ? <Send size={16}/> : <Trash2 size={16}/>} {t(item)}
            </div>
          ))}
      </div>

      {/* List */}
      <div className="w-72 border-r border-gray-200 dark:border-white/10 flex flex-col bg-gray-50 dark:bg-[#252525]">
         <div className="h-12 border-b border-gray-200 dark:border-white/10 flex items-center px-3 shrink-0">
            <div className="relative w-full">
                <Search size={12} className="absolute left-2 top-2 text-gray-400" />
                <input type="text" placeholder={t('search')} className="w-full bg-white dark:bg-black/20 rounded-md py-1.5 pl-7 pr-2 text-xs outline-none" />
            </div>
         </div>
         <div className="flex-1 overflow-y-auto">
             {emails.map(email => (
                 <div key={email.id} onClick={() => setSelectedId(email.id)} className={clsx("p-3 border-b border-gray-200 dark:border-white/5 cursor-pointer", selectedId === email.id ? "bg-blue-500 text-white" : "hover:bg-gray-200 dark:hover:bg-white/5")}>
                     <div className="flex justify-between items-baseline mb-0.5">
                        <span className="font-bold text-sm truncate">{email.sender}</span>
                        <span className="text-[10px] opacity-70">{email.time}</span>
                     </div>
                     <div className="text-xs truncate font-medium mb-0.5">{email.subject}</div>
                     <div className="text-xs opacity-70 truncate">{email.preview}</div>
                 </div>
             ))}
         </div>
      </div>

      {/* Reading Pane */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#1e1e1e]">
         {selectedEmail ? (
             <>
                <div className="h-14 border-b border-gray-200 dark:border-white/10 flex items-center justify-between px-6 shrink-0 bg-gray-50/50 dark:bg-[#252525]">
                    <div className="flex flex-col justify-center">
                        <div className="text-sm font-bold">{selectedEmail.subject}</div>
                        <div className="text-xs text-gray-500">{t('mail_to_me')}</div>
                    </div>
                    <div className="flex items-center gap-4 text-gray-500">
                        <Reply size={18} className="cursor-pointer hover:text-blue-500 transition-colors" onClick={handleReply} />
                        <Archive size={18} className="cursor-pointer hover:text-blue-500 transition-colors" />
                        <Trash2 size={18} className="cursor-pointer hover:text-red-500 transition-colors" onClick={handleDelete} />
                    </div>
                </div>
                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center font-bold text-white">
                            {selectedEmail.sender[0]}
                        </div>
                        <div>
                            <div className="text-sm font-bold">{selectedEmail.sender}</div>
                            <div className="text-xs text-gray-500">{selectedEmail.time}</div>
                        </div>
                    </div>
                    <div className="prose dark:prose-invert text-sm max-w-none">
                        <p>Hi Lynx,</p>
                        <p>{selectedEmail.preview}</p>
                        <p>This is a simulated email for your portfolio demonstration.</p>
                    </div>
                </div>
             </>
         ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-300 dark:text-gray-600">
                 <FileText size={64} className="mb-4 opacity-50" />
                 <div>{t('no_mail')}</div>
             </div>
         )}
      </div>
    </div>
  )
}