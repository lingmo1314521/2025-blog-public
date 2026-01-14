// components/macos/apps/calendar.tsx
'use client'
import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { clsx } from '../utils'
import { useI18n } from '../i18n-context'

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export const CalendarApp = () => {
  const { t } = useI18n()
  const [currentDate, setCurrentDate] = useState(new Date())
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear(); const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []
    for (let i = 0; i < firstDay; i++) days.push({ day: '', type: 'empty' })
    for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, type: 'current' })
    return days
  }
  const isToday = (day: number) => { const today = new Date(); return day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear() }

  return (
    <div className="h-full bg-white dark:bg-[#1e1e1e] text-black dark:text-white flex">
       <div className="w-52 bg-gray-50 dark:bg-[#252525] border-r border-gray-200 dark:border-white/10 p-4 flex flex-col gap-6">
           <div className="text-3xl font-bold px-2">{currentDate.getFullYear()}</div>
           <div className="space-y-1">
               <div className="flex items-center justify-between px-2 py-1 bg-gray-200 dark:bg-white/10 rounded-md">
                   <span className="text-sm font-medium">{t(MONTH_KEYS[currentDate.getMonth()])}</span>
               </div>
               <div className="grid grid-cols-7 gap-1 text-[10px] text-center opacity-60 px-2">
                   {DAY_KEYS.map(d => <div key={d}>{t(d)[0]}</div>)}
                   {Array.from({length:31}).map((_,i) => <div key={i}>{i+1}</div>)}
               </div>
           </div>
       </div>
       <div className="flex-1 flex flex-col">
           <div className="h-12 border-b border-gray-200 dark:border-white/10 flex items-center justify-between px-6">
               <div className="text-lg font-bold">{t(MONTH_KEYS[currentDate.getMonth()])}</div>
               <div className="flex items-center gap-2">
                   <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded"><ChevronLeft size={20} /></button>
                   <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm bg-gray-100 dark:bg-white/10 rounded hover:opacity-80">{t('today')}</button>
                   <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded"><ChevronRight size={20} /></button>
               </div>
               <button className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded"><Plus size={20} /></button>
           </div>
           <div className="flex-1 grid grid-cols-7 grid-rows-[auto_1fr] overflow-hidden">
               {DAY_KEYS.map(day => <div key={day} className="h-8 flex items-center justify-end px-2 text-xs font-medium text-gray-500 border-b border-r border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#252525]">{t(day)}</div>)}
               <div className="col-span-7 grid grid-cols-7 grid-rows-5 h-full">
                   {getDaysInMonth(currentDate).map((item, idx) => (
                       <div key={idx} className="border-b border-r border-gray-100 dark:border-white/5 p-2 relative group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                           {item.day && <div className={clsx("w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium", isToday(item.day as number) ? "bg-red-500 text-white" : "text-gray-700 dark:text-gray-300")}>{item.day}</div>}
                       </div>
                   ))}
               </div>
           </div>
       </div>
    </div>
  )
}