// components/macos/i18n-context.tsx
'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { TRANSLATIONS, Language } from './translations'

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

export const useI18n = () => {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used within an I18nProvider')
  return context
}

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    // 1. 优先读取本地存储
    const saved = localStorage.getItem('macos-lang') as Language
    if (saved && ['en', 'zh', 'mix'].includes(saved)) {
      setLanguageState(saved)
    } else {
      // 2. 其次检测浏览器语言
      const browserLang = navigator.language
      if (browserLang.startsWith('zh')) {
        setLanguageState('zh')
      } else {
        setLanguageState('en')
      }
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('macos-lang', lang)
  }

  const t = (key: string): string => {
    // @ts-ignore
    return TRANSLATIONS[language]?.[key] || key
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}