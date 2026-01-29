'use client'

import React, { useState } from 'react'
import { Image as ImageIcon, Globe, Monitor, Volume2 } from 'lucide-react'
import { useI18n } from '../i18n-context'
import { clsx } from '../utils'

// 壁纸数据
const WALLPAPERS = [
  { id: 'monterey', url: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=3270&auto=format&fit=crop' },
  { id: 'big_sur', url: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=2940&auto=format&fit=crop' },
  { id: 'mojave', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=3270&auto=format&fit=crop' },
  { id: 'dark_nebula', url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2342&auto=format&fit=crop' },
]

type Tab = 'wallpaper' | 'language' | 'display' | 'sound'

export const Settings = ({ setWallpaper }: { setWallpaper?: (url: string) => void }) => {
  const { t, language, setLanguage } = useI18n()
  const [activeTab, setActiveTab] = useState<Tab>('wallpaper')

  const SidebarItem = ({ id, icon: Icon, label }: { id: Tab, icon: any, label: string }) => (
    <div onClick={() => setActiveTab(id)} className={clsx("px-2 py-1.5 rounded-md text-sm cursor-pointer flex items-center gap-2 transition-colors", activeTab === id ? "bg-blue-500 text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10")}>
      <Icon size={16} /><span>{label}</span>
    </div>
  )

  return (
    <div className="h-full bg-[#f6f6f6] dark:bg-[#1e1e1e] text-black dark:text-white flex">
        <div className="w-1/3 max-w-[180px] border-r border-gray-200 dark:border-white/10 p-3 space-y-1 bg-gray-50/50 dark:bg-[#252525]">
            <SidebarItem id="wallpaper" icon={ImageIcon} label={t('wallpaper')} />
            <SidebarItem id="language" icon={Globe} label={t('language')} />
            <div className="h-[1px] bg-gray-200 dark:bg-white/10 my-2 mx-2" />
            <SidebarItem id="display" icon={Monitor} label={t('display')} />
            <SidebarItem id="sound" icon={Volume2} label={t('sound')} />
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'wallpaper' && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold">{t('wallpaper')}</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {WALLPAPERS.map((wp) => (
                            <div key={wp.id} onClick={() => setWallpaper?.(wp.url)} className="group cursor-pointer space-y-2">
                                <div className="aspect-video rounded-lg overflow-hidden border-4 border-transparent hover:border-blue-500/50 transition-all shadow-sm">
                                    <img src={wp.url} alt={t(wp.id)} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                                </div>
                                <div className="text-center text-xs text-gray-500">{t(wp.id)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'language' && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold">{t('language')}</h2>
                    <div className="bg-white dark:bg-[#2c2c2c] rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden">
                        {['en', 'zh', 'mix'].map((lang: any) => (
                             <div key={lang} onClick={() => setLanguage(lang)} className={clsx("p-3 border-b border-gray-100 dark:border-white/5 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5", language === lang && "bg-blue-50 dark:bg-blue-900/20")}>
                                <span>{lang === 'en' ? 'English' : lang === 'zh' ? '简体中文' : '中英文共存 (Mixed)'}</span>
                                {language === lang && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {(activeTab === 'display' || activeTab === 'sound') && (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm flex-col gap-2">
                    <Monitor size={48} className="opacity-20"/>
                    {t('settings_adjust_via_cc')}
                </div>
            )}
        </div>
    </div>
  )
}