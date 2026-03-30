'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  CheckSquare,
  Repeat,
  StickyNote,
  CalendarDays,
  Target,
  Wallet,
  BookOpen,
  Languages,
  Dumbbell,
  Droplets,
  Moon,
  Smile,
  Heart,
  Package,
  Trophy,
  BarChart3,
  Sparkles,
  BookHeart,
  Sword,
  Library,
  Camera,
  Video,
  Bot,
  GraduationCap,
  Settings,
  X,
  ChevronLeft,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'الرئيسية',
    items: [
      { label: 'الرئيسية', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    title: 'الإنتاجية',
    items: [
      { label: 'المهام', href: '/tasks', icon: CheckSquare },
      { label: 'العادات', href: '/habits', icon: Repeat },
      { label: 'الملاحظات', href: '/notes', icon: StickyNote },
      { label: 'التقويم', href: '/calendar', icon: CalendarDays },
      { label: 'الأهداف', href: '/goals', icon: Target },
    ],
  },
  {
    title: 'التعلم',
    items: [
      { label: 'الدراسة', href: '/study', icon: BookOpen },
      { label: 'الصينية', href: '/chinese', icon: Languages },
      { label: 'التوجيهي', href: '/tawjihi', icon: GraduationCap },
      { label: 'القراءة', href: '/reading', icon: Library },
    ],
  },
  {
    title: 'الصحة',
    items: [
      { label: 'اللياقة', href: '/fitness', icon: Dumbbell },
      { label: 'الماء', href: '/water', icon: Droplets },
      { label: 'النوم', href: '/sleep', icon: Moon },
      { label: 'المزاج', href: '/mood', icon: Smile },
    ],
  },
  {
    title: 'التطوير',
    items: [
      { label: 'اليوميات', href: '/journal', icon: BookHeart },
      { label: 'الامتنان', href: '/gratitude', icon: Heart },
      { label: 'الكبسولة الزمنية', href: '/timecapsule', icon: Package },
      { label: 'الإنجازات', href: '/achievements', icon: Trophy },
    ],
  },
  {
    title: 'المالية',
    items: [
      { label: 'المالية', href: '/finance', icon: Wallet },
    ],
  },
  {
    title: 'متقدم',
    items: [
      { label: 'الإحصائيات', href: '/stats', icon: BarChart3 },
      { label: 'الشخصية', href: '/rpg', icon: Sword },
      { label: 'التحفيز', href: '/motivation', icon: Sparkles },
      { label: 'المساعد الذكي', href: '/agent', icon: Bot },
    ],
  },
  {
    title: 'الوسائط',
    items: [
      { label: 'الصور', href: '/photos', icon: Camera },
      { label: 'الفيديوهات', href: '/videos', icon: Video },
    ],
  },
  {
    title: 'الإعدادات',
    items: [
      { label: 'الإعدادات', href: '/settings', icon: Settings },
    ],
  },
]

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

function NavItemButton({ item, isActive, isCollapsed }: { item: NavItem; isActive: boolean; isCollapsed: boolean }) {
  const Icon = item.icon

  const linkContent = (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 w-full relative',
        isActive
          ? 'bg-gradient-to-l from-violet-500/10 to-blue-500/5 text-white border-r-2 border-violet-500'
          : 'text-gray-500 hover:bg-white/5 hover:text-gray-300',
        isCollapsed && 'justify-center px-0'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200',
          isActive
            ? 'bg-violet-500/15'
            : 'bg-white/[0.04] group-hover:bg-white/[0.08]'
        )}
      >
        <Icon
          className={cn(
            'h-4 w-4 transition-all duration-200',
            isActive ? 'text-violet-400' : 'text-gray-500 group-hover:text-gray-400'
          )}
        />
      </div>
      {!isCollapsed && (
        <span className={cn(
          'truncate font-medium',
          isActive ? 'text-white' : ''
        )}>{item.label}</span>
      )}
    </div>
  )

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Link href={item.href} className="group relative flex items-center justify-center">
            {linkContent}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="left" className="font-cairo">
          {item.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Link href={item.href} className="group relative block">
      {linkContent}
    </Link>
  )
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const [user, setUser] = useState<{ name: string } | null>(null)

  useEffect(() => {
    fetch('/api/user')
      .then(r => r.json())
      .then(data => {
        if (data.name) setUser({ name: data.name })
      })
      .catch(() => {})
  }, [])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <TooltipProvider>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col shrink-0 transition-all duration-300 ease-in-out',
          'bg-[#080C18]/90 backdrop-blur-2xl border-l border-white/[0.06]',
          // Mobile: fixed overlay
          'fixed top-0 right-0 z-50 min-h-screen lg:relative lg:z-auto',
          isOpen ? 'w-72 lg:translate-x-0' : 'w-72 lg:w-20',
          !isOpen && 'translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo Header */}
        <div className="flex items-center justify-between p-4 pb-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <AnimatePresence>
              {isOpen && (
                <motion.h1
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-xl font-bold gradient-text whitespace-nowrap overflow-hidden"
                >
                  مساري
                </motion.h1>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onToggle}
              className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronLeft className="h-4 w-4" />
              </motion.div>
            </button>
            <button
              onClick={onToggle}
              className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mx-4 mb-2 h-px bg-white/[0.06]" />

        {/* Navigation Items */}
        <ScrollArea className="flex-1 px-3">
          <nav className="flex flex-col gap-1 py-2">
            {navSections.map((section) => (
              <div key={section.title} className="mb-1">
                {/* Section Label (hidden when collapsed) */}
                {!isOpen ? (
                  <div className="my-2 mx-auto h-px w-6 bg-white/[0.06]" />
                ) : (
                  <p className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    {section.title}
                  </p>
                )}
                {section.items.map((item) => (
                  <NavItemButton
                    key={item.href}
                    item={item}
                    isActive={isActive(item.href)}
                    isCollapsed={!isOpen}
                  />
                ))}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer: User + Logout */}
        <div className="p-3 border-t border-white/[0.06]">
          {isOpen ? (
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-blue-500/30 text-sm font-bold text-violet-300">
                {user?.name?.charAt(0) || 'م'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || 'مستخدم'}
                </p>
                <p className="text-xs text-gray-500">النسخة 1.0</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="flex mx-auto h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="font-cairo">
                تسجيل الخروج
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
