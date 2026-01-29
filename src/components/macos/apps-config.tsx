'use client'

import React from 'react'
import { AppConfig } from './types'
import { Finder } from './apps/finder'
import { About } from './apps/about'
import { Settings } from './apps/settings'
import { WebBrowser } from './apps/web-browser'
import { MusicPlayer } from './apps/music-player'
import { Terminal } from './apps/terminal'
import { Calculator } from './apps/calculator'
import { MailApp } from './apps/mail'
import { CalendarApp } from './apps/calendar'
import { NotesApp } from './apps/notes'
import { VSCode } from './apps/vscode'
import { StorageManager } from './apps/storage-manager'
import { Preview } from './apps/preview'
import { WutheringWavesLauncher } from './apps/wuthering-waves'
import { PhotoBooth } from './apps/photo-booth'
import { Gamepad2, Image as ImageIcon } from 'lucide-react'

const PngIcon = ({ src, alt }: { src: string; alt: string }) => (
  <img src={src} alt={alt} draggable={false} className="w-full h-full object-contain" />
)

// [CLEANED] 移除了不必要的 Blog 引用
export const INITIAL_APPS: AppConfig[] = [
  { id: 'launchpad', title: 'Launchpad', icon: <PngIcon src="/icons/launchpad.png" alt="Launchpad" />, width: 0, height: 0, component: null },
  { id: 'finder', title: 'Finder', icon: <PngIcon src="/icons/finder.png" alt="Finder" />, width: 860, height: 500, component: <Finder /> },
  { id: 'safari', title: 'Safari', icon: <PngIcon src="/icons/safari.png" alt="Safari" />, width: 1024, height: 768, component: <WebBrowser initialUrl="https://mc.kurogames.com/" /> },
  { id: 'wuthering_waves', title: 'Wuthering Waves', icon: <div className="w-full h-full bg-black rounded-xl flex items-center justify-center text-yellow-400 border border-yellow-500/50 shadow-lg"><Gamepad2 /></div>, width: 1280, height: 760, minWidth: 1024, minHeight: 576, component: <WutheringWavesLauncher /> },
  { id: 'terminal', title: 'Terminal', icon: <PngIcon src="/icons/terminal.png" alt="Terminal" />, width: 600, height: 400, component: <Terminal /> },
  { id: 'vscode', title: 'VS Code', icon: <PngIcon src="/icons/vscode.png" alt="VS Code" />, width: 1100, height: 700, component: <VSCode /> },
  { id: 'notes', title: 'Notes', icon: <PngIcon src="/icons/notes.png" alt="Notes" />, width: 800, height: 550, component: <NotesApp /> },
  { id: 'mail', title: 'Mail', icon: <PngIcon src="/icons/mail.png" alt="Mail" />, width: 900, height: 600, component: <MailApp /> },
  { id: 'calendar', title: 'Calendar', icon: <PngIcon src="/icons/calendar.png" alt="Calendar" />, width: 800, height: 600, component: <CalendarApp /> },
  { id: 'calculator', title: 'Calculator', icon: <PngIcon src="/icons/calculator.png" alt="Calculator" />, width: 320, height: 520, resizable: false, maximizable: false, component: <Calculator /> },
  { id: 'music', title: 'Music', icon: <PngIcon src="/icons/music.png" alt="Music" />, width: 800, height: 500, component: <MusicPlayer /> },
  { id: 'photobooth', title: 'Photo Booth', icon: <div className="w-full h-full bg-gradient-to-br from-red-400 to-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg border-[3px] border-white/80"><ImageIcon size={36} className="drop-shadow-md"/></div>, width: 800, height: 650, component: <PhotoBooth /> },
  { id: 'storage_manager', title: 'Storage', icon: <div className="w-full h-full bg-gradient-to-br from-gray-500 to-gray-700 rounded-xl flex items-center justify-center text-white text-[10px] font-bold shadow-lg border-2 border-white/20 flex-col"><div className="text-xl mb-1">💾</div><div>DISK</div></div>, width: 700, height: 500, component: <StorageManager /> },
  { id: 'preview', title: 'Preview', icon: <div className="w-full h-full bg-blue-500 rounded-xl flex items-center justify-center text-white"><ImageIcon /></div>, width: 800, height: 600, component: <Preview /> },
  { id: 'settings', title: 'Settings', icon: <PngIcon src="/icons/settings.png" alt="Settings" />, width: 600, height: 400, component: <Settings /> },
  { id: 'about', title: 'About Lynx', icon: <PngIcon src="/icons/me.png" alt="About" />, width: 400, height: 500, component: <About /> },
]