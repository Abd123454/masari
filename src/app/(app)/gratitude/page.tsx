'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Save, Check, Loader2, Sparkles, RotateCw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface GratitudeEntry {
  id: string
  item1: string
  item2: string
  item3: string
  date: string
  createdAt: string
}

const quotes = [
  'اشكر الله على نعمه الظاهرة والباطنة',
  'الامتنان هو مفتاح السعادة والرضا',
  'من شكر الماضي نعم المستقبل',
  'اشكر الله على كل لحظة في حياتك',
  'القلب الشاكر يعيش في سعادة دائمة',
  'الامتنان يحوّل ما لدينا إلى ما يكفينا',
  'لا تنتظر كثرة النعم لتشكر، اشكر لتكثر النعم',
  'كل يوم جديد هو فرصة جديدة للشكر',
  'الحمد لله الذي أنعم علينا نعمًا لا تحصى',
  'من وجد الله فماذا فقد، ومن فقد الله فماذا وجد',
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })
}

export default function GratitudePage() {
  const [entries, setEntries] = useState<GratitudeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState(['', '', ''])
  const [saving, setSaving] = useState(false)
  const [todaySaved, setTodaySaved] = useState(false)
  const [quoteIndex, setQuoteIndex] = useState(0)

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/gratitude')
      if (res.ok) {
        const data = await res.json()
        setEntries(data)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const todayEntry = data.find((e: GratitudeEntry) => {
          const d = new Date(e.date)
          return d >= today && d < tomorrow
        })
        if (todayEntry) {
          setItems([todayEntry.item1 || '', todayEntry.item2 || '', todayEntry.item3 || ''])
          setTodaySaved(true)
        }
      }
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  const handleSave = async () => {
    if (!items[0].trim() && !items[1].trim() && !items[2].trim()) {
      toast.error('يرجى كتابة شيء واحد على الأقل تشكر الله عليه')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/gratitude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item1: items[0], item2: items[1], item3: items[2] }),
      })
      if (!res.ok) throw new Error()
      toast.success('تم حفظ الامتنان بنجاح')
      setTodaySaved(true)
      fetchEntries()
    } catch {
      toast.error('حدث خطأ في الحفظ')
    }
    setSaving(false)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const pastEntries = entries.filter((e) => {
    const d = new Date(e.date)
    return d < tomorrow
  })

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
            <Heart className="h-5 w-5 text-rose-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">الامتنان</h1>
        </div>
      </motion.div>

      {/* Inspirational Quote */}
      <motion.div variants={itemVariants} className="glass-accent p-6 flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
          <Heart className="h-6 w-6 text-rose-400" />
        </div>
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.p
              key={quoteIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="text-gray-300 text-sm leading-relaxed"
            >
              {quotes[quoteIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
        <button
          onClick={() => setQuoteIndex((prev) => (prev + 1) % quotes.length)}
          className="btn-icon shrink-0"
        >
          <RotateCw className="h-4 w-4" />
        </button>
      </motion.div>

      {/* Today's Gratitude */}
      <motion.div variants={itemVariants} className="glass p-6">
        <h2 className="text-lg font-bold text-white mb-5">امتنان اليوم</h2>

        <div className="space-y-4 mb-5">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="badge badge-violet text-xs font-bold w-6 h-6 flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const newItems = [...items]
                  newItems[idx] = e.target.value
                  setItems(newItems)
                  setTodaySaved(false)
                }}
                className="input"
                placeholder={`أنا ممتن لـ...`}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'جاري الحفظ...' : 'حفظ الامتنان'}
          </button>
          {todaySaved && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 text-emerald-400 text-sm"
            >
              <Check className="h-3.5 w-3.5" />
              <span>تم الحفظ</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Past Entries */}
      <motion.div variants={itemVariants} className="glass p-6">
        <h2 className="text-lg font-bold text-white mb-4">الامتنانات السابقة</h2>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : pastEntries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Heart className="h-10 w-10 text-gray-600" />
            <p className="text-gray-500 text-sm text-center">سجل ما تشكر الله عليه</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {pastEntries.map((entry) => (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                >
                  <p className="text-sm text-gray-400 mb-3">{formatDate(entry.date)}</p>
                  <div className="space-y-2">
                    {[entry.item1, entry.item2, entry.item3].filter(Boolean).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="badge badge-violet text-xs mt-0.5 shrink-0 w-5 h-5 flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <p className="text-sm text-gray-300">{item}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
