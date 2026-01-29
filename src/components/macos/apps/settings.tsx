'use client'

import React, { useState } from 'react'
import { Image as ImageIcon, Globe, Monitor, Volume2, PlayCircle } from 'lucide-react'
import { useI18n } from '../i18n-context'
import { clsx } from '../utils'

const WALLPAPERS = [
  // [优化] 动态壁纸现在使用 kl.webp 作为预览图
  { id: 'ww_live', url: 'live', preview: '/kl.webp', name: 'Wuthering Waves (Live)', isVideo: true },
  { id: 'monterey', url: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=3270&auto=format&fit=crop', name: 'Monterey' },
  { id: 'big_sur', url: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=2940&auto=format&fit=crop', name: 'Big Sur' },
  { id: 'mojave', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=3270&auto=format&fit=crop', name: 'Mojave' },
  { id: 'dark_nebula', url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2342&auto=format&fit=crop', name: 'Dark Nebula' },
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
                                <div className="aspect-video rounded-lg overflow-hidden border-4 border-transparent hover:border-blue-500/50 transition-all shadow-sm relative bg-gray-900">
                                    {/* 无论是不是视频，都显示图片作为底 */}
                                    <img 
                                        src={wp.isVideo ? wp.preview : wp.url} 
                                        alt={wp.name} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                    />
                                    
                                    {/* 如果是视频，叠加一个优雅的播放层 */}
                                    {wp.isVideo && (
                                        <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center backdrop-blur-[1px]">
                                            <div className="bg-white/20 p-2 rounded-full backdrop-blur-md border border-white/30 group-hover:bg-white/30 transition-colors">
                                                <PlayCircle size={20} className="text-white fill-white/20"/>
                                            </div>
                                            <span className="text-[10px] font-bold text-white mt-1.5 tracking-widest drop-shadow-md">LIVE</span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-center text-xs text-gray-500">{wp.name}</div>
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