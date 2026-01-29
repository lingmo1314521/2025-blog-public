// components/macos/apps/calendar.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalIcon } from 'lucide-react'
import { clsx } from '../utils'
import { useI18n } from '../i18n-context'
import { useOs } from '../os-context'

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

interface Event {
    id: string
    dateStr: string // "YYYY-MM-DD"
    title: string
}

export const CalendarApp = () => {
  const { t } = useI18n()
  const { addNotification } = useOs()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [events, setEvents] = useState<Event[]>([])
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [newEventTitle, setNewEventTitle] = useState('')

  // Load events
  useEffect(() => {
    const saved = localStorage.getItem('macos-calendar-events')
    if (saved) {
        try { setEvents(JSON.parse(saved)) } catch {}
    } else {
        // Initial Demo Event
        const today = new Date().toISOString().split('T')[0]
        setEvents([{ id: '1', dateStr: today, title: 'Welcome to LynxOS' }])
    }
  }, [])

  // Save events
  useEffect(() => {
    localStorage.setItem('macos-calendar-events', JSON.stringify(events))
  }, [events])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear(); const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []
    for (let i = 0; i < firstDay; i++) days.push({ day: null, type: 'empty' })
    for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, type: 'current' })
    return days
  }

  const isToday = (day: number) => { 
      const today = new Date()
      return day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear() 
  }

  const isSelected = (day: number) => {
      return day === selectedDate.getDate() && currentDate.getMonth() === selectedDate.getMonth() && currentDate.getFullYear() === selectedDate.getFullYear()
  }

  const getDateStr = (day: number) => {
      const year = currentDate.getFullYear()
      const month = String(currentDate.getMonth() + 1).padStart(2, '0')
      const d = String(day).padStart(2, '0')
      return `${year}-${month}-${d}`
  }

  const handleAddEvent = () => {
      if(!newEventTitle.trim()) return
      const dateStr = selectedDate.toISOString().split('T')[0]
      const newEvent: Event = {
          id: Date.now().toString(),
          dateStr,
          title: newEventTitle
      }
      setEvents([...events, newEvent])
      setNewEventTitle('')
      setShowAddModal(false)
      addNotification({ title: t('calendar'), message: 'Event added successfully', type: 'success' })
  }

  const deleteEvent = (id: string) => {
      setEvents(events.filter(e => e.id !== id))
  }

  // Filter events for selected day
  const selectedDayStr = selectedDate.toISOString().split('T')[0]
  const currentDayEvents = events.filter(e => e.dateStr === selectedDayStr)

  return (
    <div className="h-full bg-white dark:bg-[#1e1e1e] text-black dark:text-white flex relative overflow-hidden">
       {/* Sidebar */}
       <div className="w-60 bg-gray-50 dark:bg-[#252525] border-r border-gray-200 dark:border-white/10 p-4 flex flex-col gap-6">
           <div className="text-3xl font-bold px-2 flex items-center gap-2">
               <CalIcon className="text-red-500" />
               {currentDate.getFullYear()}
           </div>
           
           {/* Mini Calendar (Simplified View) */}
           <div className="space-y-1">
               <div className="flex items-center justify-between px-2 py-1 bg-gray-200 dark:bg-white/10 rounded-md">
                   <span className="text-sm font-medium">{t(MONTH_KEYS[currentDate.getMonth()])}</span>
               </div>
               <div className="grid grid-cols-7 gap-1 text-[10px] text-center opacity-60 px-2 mt-2">
                   {DAY_KEYS.map(d => <div key={d}>{t(d)[0]}</div>)}
                   {Array.from({length:31}).map((_,i) => {
                       if (i >= 28) return null // Just a rough visual for sidebar
                       return <div key={i} className="py-0.5">{i+1}</div>
                   })}
               </div>
           </div>

           {/* Event List for Selected Day */}
           <div className="flex-1 flex flex-col overflow-hidden border-t border-gray-200 dark:border-white/10 pt-4">
                <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                    {selectedDate.toLocaleDateString()}
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                    {currentDayEvents.length === 0 ? (
                        <div className="text-xs text-gray-400 text-center mt-4">No events</div>
                    ) : (
                        currentDayEvents.map(ev => (
                            <div key={ev.id} className="bg-white dark:bg-white/5 p-2 rounded border border-gray-200 dark:border-white/5 text-xs flex justify-between group">
                                <span className="truncate">{ev.title}</span>
                                <button onClick={() => deleteEvent(ev.id)} className="opacity-0 group-hover:opacity-100 text-red-500"><Trash2 size={12}/></button>
                            </div>
                        ))
                    )}
                </div>
           </div>
       </div>

       {/* Main View */}
       <div className="flex-1 flex flex-col">
           <div className="h-12 border-b border-gray-200 dark:border-white/10 flex items-center justify-between px-6 bg-white dark:bg-[#1e1e1e] z-10">
               <div className="text-lg font-bold">{t(MONTH_KEYS[currentDate.getMonth()])}</div>
               <div className="flex items-center gap-2">
                   <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded"><ChevronLeft size={20} /></button>
                   <button onClick={() => {const now = new Date(); setCurrentDate(now); setSelectedDate(now)}} className="px-3 py-1 text-sm bg-gray-100 dark:bg-white/10 rounded hover:opacity-80 transition-opacity">{t('today')}</button>
                   <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded"><ChevronRight size={20} /></button>
               </div>
               <button onClick={() => setShowAddModal(true)} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded"><Plus size={20} /></button>
           </div>

           <div className="flex-1 grid grid-cols-7 grid-rows-[auto_1fr] overflow-hidden">
               {DAY_KEYS.map(day => <div key={day} className="h-8 flex items-center justify-end px-2 text-xs font-medium text-gray-500 border-b border-r border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#252525]">{t(day)}</div>)}
               
               <div className="col-span-7 grid grid-cols-7 grid-rows-5 h-full">
                   {getDaysInMonth(currentDate).map((item, idx) => {
                       const dateStr = item.day ? getDateStr(item.day as number) : ''
                       const hasEvent = events.some(e => e.dateStr === dateStr)
                       
                       return (
                           <div 
                                key={idx} 
                                onClick={() => item.day && setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), item.day as number))}
                                className={clsx(
                                   "border-b border-r border-gray-100 dark:border-white/5 p-2 relative group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer",
                                   !item.day && "bg-gray-50/30 dark:bg-[#000]/20"
                                )}
                           >
                               {item.day && (
                                   <>
                                    <div className={clsx(
                                        "w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium transition-all", 
                                        isToday(item.day as number) ? "bg-red-500 text-white" : 
                                        isSelected(item.day as number) ? "bg-black dark:bg-white text-white dark:text-black" :
                                        "text-gray-700 dark:text-gray-300"
                                    )}>
                                        {item.day}
                                    </div>
                                    {hasEvent && <div className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-400 mx-auto" />}
                                   </>
                               )}
                           </div>
                       )
                   })}
               </div>
           </div>
       </div>

       {/* Add Event Modal */}
       {showAddModal && (
           <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowAddModal(false)}>
               <div className="bg-white dark:bg-[#333] p-4 rounded-xl shadow-2xl w-80 border border-gray-200 dark:border-white/10" onClick={e => e.stopPropagation()}>
                   <h3 className="font-bold mb-4">{t('new_note')} on {selectedDate.toLocaleDateString()}</h3>
                   <input 
                      autoFocus
                      type="text" 
                      value={newEventTitle}
                      onChange={e => setNewEventTitle(e.target.value)}
                      placeholder="Event Title..."
                      className="w-full bg-gray-100 dark:bg-black/20 p-2 rounded mb-4 outline-none border border-transparent focus:border-blue-500"
                      onKeyDown={e => e.key === 'Enter' && handleAddEvent()}
                   />
                   <div className="flex justify-end gap-2">
                       <button onClick={() => setShowAddModal(false)} className="px-3 py-1.5 text-xs rounded bg-gray-200 dark:bg-white/10 hover:opacity-80">Cancel</button>
                       <button onClick={handleAddEvent} className="px-3 py-1.5 text-xs rounded bg-blue-500 text-white hover:bg-blue-600">Add</button>
                   </div>
               </div>
           </div>
       )}
    </div>
  )
}