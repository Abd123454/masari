'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Menu, PanelRightClose, PanelRightOpen, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const pageTitles: Record<string, string> = {
  '/': 'الرئيسية',
  '/tasks': 'المهام',
  '/habits': 'العادات',
  '/notes': 'الملاحظات',
  '/calendar': 'التقويم',
  '/goals': 'الأهداف',
  '/finance': 'المالية',
  '/study': 'الدراسة',
  '/chinese': 'الصينية',
  '/fitness': 'اللياقة',
  '/water': 'الماء',
  '/sleep': 'النوم',
  '/mood': 'المزاج',
  '/journal': 'اليوميات',
  '/gratitude': 'الامتنان',
  '/timecapsule': 'الكبسولة الزمنية',
  '/achievements': 'الإنجازات',
  '/stats': 'الإحصائيات',
  '/rpg': 'الشخصية',
  '/motivation': 'التحفيز',
  '/reading': 'القراءة',
  '/photos': 'الصور',
  '/videos': 'الفيديوهات',
  '/agent': 'المساعد الذكي',
  '/tawjihi': 'التوجيهي',
  '/settings': 'الإعدادات',
}

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname]
  // Check for nested routes
  const basePath = '/' + pathname.split('/').filter(Boolean)[0]
  return pageTitles[basePath] || 'مساري'
}

interface HeaderProps {
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

export function Header({ onToggleSidebar, sidebarOpen }: HeaderProps) {
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)
  const [user, setUser] = useState<{ name: string } | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    fetch('/api/user')
      .then(r => r.json())
      .then(data => {
        if (data.name) setUser({ name: data.name })
      })
      .catch(() => {})
  }, [])

  return (
    <motion.header
      key={pageTitle}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.04] bg-[#050A18]/70 backdrop-blur-2xl px-4 lg:px-6"
    >
      {/* Right Side: Hamburger + Sidebar Toggle + Page Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        <button
          onClick={onToggleSidebar}
          className="flex lg:hidden h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop Sidebar Toggle */}
        <button
          onClick={onToggleSidebar}
          className="hidden lg:flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title={sidebarOpen ? 'طي القائمة' : 'فتح القائمة'}
        >
          {sidebarOpen ? (
            <PanelRightClose className="h-4.5 w-4.5" />
          ) : (
            <PanelRightOpen className="h-4.5 w-4.5" />
          )}
        </button>

        <h2 className="text-base font-semibold text-white">{pageTitle}</h2>
      </div>

      {/* Left Side: Search + User Info */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className={cn(
          'hidden md:flex items-center transition-all duration-300 overflow-hidden',
          searchOpen ? 'w-64' : 'w-9'
        )}>
          {searchOpen ? (
            <div className="flex items-center gap-2 w-full">
              <Search className="h-4 w-4 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="بحث..."
                autoFocus
                onBlur={() => setSearchOpen(false)}
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
              />
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Search className="h-4.5 w-4.5" />
            </button>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium text-white">
              {user?.name || 'مستخدم'}
            </span>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-sm font-bold text-white shadow-lg shadow-violet-500/20">
            {user?.name?.charAt(0) || 'م'}
          </div>
        </div>
      </div>
    </motion.header>
  )
}
