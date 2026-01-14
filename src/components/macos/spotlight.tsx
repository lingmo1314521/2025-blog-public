// components/macos/spotlight.tsx
'use client'
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Calculator, FileText, Globe, ArrowRight } from 'lucide-react'
import { useOs } from './os-context'
import { useI18n } from './i18n-context'

export const Spotlight = () => {
  const { isSpotlightOpen, toggleSpotlight, dockItems, launchApp } = useOs()
  const { t } = useI18n()
  const [input, setInput] = useState('')
  const [results, setResults] = useState<any[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (isSpotlightOpen) { setTimeout(() => inputRef.current?.focus(), 50); setInput(''); setResults([]) } }, [isSpotlightOpen])

  useEffect(() => {
    if (!input.trim()) { setResults([]); return }
    const res: any[] = []
    try {
      if (/^[\d+\-*/().\s]+$/.test(input)) {
        // eslint-disable-next-line no-eval
        const r = eval(input); if (!isNaN(r)) res.push({ id: 'calc', title: String(r), subtitle: `Calculation: ${input}`, icon: <Calculator size={20} className="text-orange-500"/>, action: () => alert(r) })
      }
    } catch {}
    dockItems.forEach(app => { if(app.id!=='launchpad' && t(app.id).toLowerCase().includes(input.toLowerCase())) res.push({ id: app.id, title: t(app.id), subtitle: 'App', icon: <div className="w-5 h-5">{app.icon}</div>, action: () => launchApp(app) }) })
    res.push({ id: 'web', title: `${t('search')} Google: "${input}"`, subtitle: 'Web', icon: <Globe size={20} className="text-blue-500"/>, action: () => window.open(`https://google.com/search?q=${input}`) })
    setResults(res)
  }, [input, dockItems, t, launchApp])

  return (
    <AnimatePresence>
      {isSpotlightOpen && (
        <>
          <div className="fixed inset-0 z-[10000] bg-transparent" onClick={() => toggleSpotlight(false)} />
          <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}} className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[10001] w-[600px] max-w-[90vw] flex flex-col font-sans">
            <div className="bg-white/80 dark:bg-[#1e1e1e]/90 backdrop-blur-3xl rounded-xl shadow-2xl border border-white/20 overflow-hidden">
                <div className="h-14 flex items-center px-4 gap-3">
                <Search size={22} className="text-gray-400 shrink-0" />
                <input ref={inputRef} type="text" value={input} onChange={(e)=>setInput(e.target.value)} placeholder={t('spotlight_placeholder')} className="flex-1 bg-transparent text-xl outline-none text-black dark:text-white placeholder-gray-400 font-light" autoFocus />
                </div>
                {results.length > 0 && <div className="border-t border-gray-200/50 dark:border-white/10 max-h-[400px] overflow-y-auto py-2">
                    {results.map((item, idx) => (
                        <div key={idx} onClick={() => {item.action(); toggleSpotlight(false)}} className="flex items-center gap-3 px-4 py-2 mx-2 rounded-md cursor-pointer hover:bg-blue-500 hover:text-white text-gray-800 dark:text-gray-200 group">
                            <div className="w-7 h-7 flex items-center justify-center shrink-0">{item.icon}</div>
                            <div className="flex-1 min-w-0"><div className="text-base font-medium truncate">{item.title}</div><div className="text-xs opacity-60 truncate">{item.subtitle}</div></div>
                        </div>
                    ))}
                </div>}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}