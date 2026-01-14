// components/macos/apps/notes.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Search, PenLine } from 'lucide-react'
import { clsx } from '../utils'
import { useI18n } from '../i18n-context'

interface Note { id: string; title: string; content: string; date: string }

export const NotesApp = () => {
  const { t } = useI18n()
  const [notes, setNotes] = useState<Note[]>([])
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('macos-notes')
    if (saved) { const parsed = JSON.parse(saved); setNotes(parsed); if(parsed.length) setActiveNoteId(parsed[0].id) }
    else { const init = [{ id: '1', title: 'Welcome', content: 'Welcome to Notes!', date: new Date().toLocaleDateString() }]; setNotes(init); setActiveNoteId('1') }
  }, [])

  useEffect(() => { if (notes.length) localStorage.setItem('macos-notes', JSON.stringify(notes)) }, [notes])

  const createNote = () => {
    const newNote: Note = { id: Date.now().toString(), title: t('new_note'), content: '', date: new Date().toLocaleDateString() }
    setNotes([newNote, ...notes]); setActiveNoteId(newNote.id)
  }

  const activeNote = notes.find(n => n.id === activeNoteId)
  const filtered = notes.filter(n => n.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex h-full w-full bg-white dark:bg-[#1e1e1e] text-black dark:text-white">
      <div className="w-64 bg-gray-50 dark:bg-[#252525] border-r border-gray-200 dark:border-white/10 flex flex-col">
        <div className="h-12 flex items-center justify-between px-3 border-b border-gray-200 dark:border-white/10 shrink-0">
             <div className="flex items-center gap-2 text-gray-500"><PenLine size={16} /><span className="text-sm font-bold">{t('notes')}</span></div>
             <button onClick={createNote} className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded"><Plus size={18} /></button>
        </div>
        <div className="p-2"><div className="relative"><Search size={12} className="absolute left-2 top-2 text-gray-400" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('search')} className="w-full bg-gray-200 dark:bg-white/10 rounded-md py-1.5 pl-7 pr-2 text-xs outline-none" /></div></div>
        <div className="flex-1 overflow-y-auto">
            {filtered.map(note => (
                <div key={note.id} onClick={() => setActiveNoteId(note.id)} className={clsx("p-3 mx-2 rounded-md cursor-pointer mb-1", activeNoteId === note.id ? "bg-[#f5cd47] dark:bg-[#d6b23a] text-black" : "hover:bg-gray-200 dark:hover:bg-white/5")}>
                    <div className="font-bold text-sm truncate">{note.title}</div><div className="text-xs opacity-70 flex justify-between mt-1"><span>{note.date}</span></div>
                </div>
            ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-white dark:bg-[#1e1e1e]">
         {activeNote ? (
             <>
                <div className="h-10 flex items-center justify-end px-4 text-gray-400"><button onClick={() => {setNotes(notes.filter(n=>n.id!==activeNote.id)); setActiveNoteId(null)}} className="hover:text-red-500 transition-colors"><Trash2 size={16} /></button></div>
                <div className="flex-1 p-8 overflow-hidden">
                    <div className="text-xs text-gray-400 text-center mb-4">{activeNote.date}</div>
                    <textarea className="w-full h-full resize-none outline-none bg-transparent text-lg leading-relaxed font-sans" value={activeNote.content} onChange={(e) => {setNotes(notes.map(n=>n.id===activeNoteId?{...n, content:e.target.value, title:e.target.value.split('\n')[0]||t('new_note')}:n))}} placeholder={t('type_here')} />
                </div>
             </>
         ) : <div className="flex-1 flex items-center justify-center text-gray-400">{t('no_note')}</div>}
      </div>
    </div>
  )
}