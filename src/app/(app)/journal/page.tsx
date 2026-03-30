'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookHeart, Check, Save, Clock, Loader2, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface JournalEntry {
  id: string
  content: string
  date: string
  createdAt: string
  updatedAt: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
}

function formatDateArabic(dateStr: string): string {
  const d = new Date(dateStr)
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  return d.toLocaleDateString('ar-SA', options)
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })
}

function getTodayString(): string {
  return new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/journal')
      if (res.ok) {
        const data = await res.json()
        setEntries(data)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const todayEntry = data.find((e: JournalEntry) => {
          const d = new Date(e.date)
          return d >= today && d < tomorrow
        })
        if (todayEntry) {
          setContent(todayEntry.content || '')
          setActiveEntryId(todayEntry.id)
        }
      }
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const saveEntry = useCallback(async (contentToSave: string, entryId: string | null) => {
    setSaveStatus('saving')
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: contentToSave, entryId }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setActiveEntryId(data.id)
      setSaveStatus('saved')
      fetchEntries()
    } catch {
      toast.error('حدث خطأ في الحفظ')
      setSaveStatus('idle')
    }
  }, [fetchEntries])

  const handleContentChange = (value: string) => {
    setContent(value)
    setSaveStatus('idle')

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      saveEntry(value, activeEntryId)
    }, 2000)
  }

  const handleManualSave = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    saveEntry(content, activeEntryId)
  }

  const handleSelectEntry = (entry: JournalEntry) => {
    setContent(entry.content || '')
    setActiveEntryId(entry.id)
    setSaveStatus('idle')
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isTodayEntry = entries.some((e) => {
    const d = new Date(e.date)
    return d >= today && d < tomorrow
  })

  const pastEntries = entries.filter((e) => {
    const d = new Date(e.date)
    return d < tomorrow
  })

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
            <BookHeart className="h-5 w-5 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">اليوميات</h1>
        </div>
      </motion.div>

      {/* Main Area */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor - 2/3 */}
        <div className="lg:col-span-2 glass p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-gray-400">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{getTodayString()}</span>
            </div>
            <div className="flex items-center gap-3">
              {saveStatus === 'saved' && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1.5 text-emerald-400 text-sm"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>تم الحفظ</span>
                </motion.div>
              )}
              {saveStatus === 'saving' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5 text-violet-400 text-sm"
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>جاري الحفظ...</span>
                </motion.div>
              )}
              <button onClick={handleManualSave} className="btn-secondary flex items-center gap-1.5 text-sm">
                <Save className="h-3.5 w-3.5" />
                حفظ
              </button>
            </div>
          </div>

          {loading ? (
            <div className="skeleton h-[400px] w-full rounded-xl" />
          ) : (
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="textarea min-h-[400px] text-base leading-relaxed resize-none"
              placeholder="ابدأ بكتابة يومياتك..."
              dir="rtl"
            />
          )}

          <div className="flex items-center justify-between mt-3">
            <span className="text-gray-500 text-sm">{wordCount} كلمة</span>
            {!isTodayEntry && activeEntryId && (
              <span className="text-gray-600 text-xs flex items-center gap-1">
                <ChevronLeft className="h-3 w-3" />
                عرض يومية سابقة
              </span>
            )}
          </div>
        </div>

        {/* Sidebar - 1/3 */}
        <div className="glass p-6">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <BookHeart className="h-4 w-4 text-violet-400" />
            اليوميات السابقة
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : pastEntries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <BookHeart className="h-10 w-10 text-gray-600" />
              <p className="text-gray-500 text-sm text-center">لا توجد يوميات سابقة</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {pastEntries.map((entry) => (
                  <motion.button
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onClick={() => handleSelectEntry(entry)}
                    className={cn(
                      'w-full text-right p-3 rounded-xl transition-all duration-200',
                      activeEntryId === entry.id
                        ? 'bg-violet-500/10 border border-violet-500/20'
                        : 'bg-white/[0.02] hover:bg-white/[0.05] border border-transparent'
                    )}
                  >
                    <p className="text-sm text-gray-400 mb-1">{formatDateShort(entry.date)}</p>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {entry.content
                        ? entry.content.substring(0, 60) + (entry.content.length > 60 ? '...' : '')
                        : 'يومية فارغة'}
                    </p>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
