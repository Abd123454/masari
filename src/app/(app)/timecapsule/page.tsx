'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Plus, Lock, Mail, Calendar, X, Loader2, Send, Sparkles, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TimeCapsule {
  id: string
  title: string
  message: string
  mood: string | null
  isOpened: boolean
  openDate: string
  createdAt: string
  updatedAt: string
}

const moodOptions = [
  { value: '', label: 'بدون' },
  { value: 'happy', label: 'سعيد' },
  { value: 'excited', label: 'متحمس' },
  { value: 'hopeful', label: 'متفائل' },
  { value: 'grateful', label: 'ممتن' },
  { value: 'dreamy', label: 'حالم' },
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
  return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' })
}

function calcProgress(createdAt: string, openDate: string): number {
  const created = new Date(createdAt).getTime()
  const open = new Date(openDate).getTime()
  const now = Date.now()
  if (now >= open) return 100
  const total = open - created
  const elapsed = now - created
  return Math.min(Math.max((elapsed / total) * 100, 0), 100)
}

function isReadyToOpen(openDate: string, isOpened: boolean): boolean {
  if (isOpened) return false
  return new Date(openDate) <= new Date()
}

export default function TimeCapsulePage() {
  const [capsules, setCapsules] = useState<TimeCapsule[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [revealModal, setRevealModal] = useState<TimeCapsule | null>(null)
  const [saving, setSaving] = useState(false)
  const [opening, setOpening] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [mood, setMood] = useState('')
  const [openDate, setOpenDate] = useState('')

  const fetchCapsules = useCallback(async () => {
    try {
      const res = await fetch('/api/timecapsule')
      if (res.ok) setCapsules(await res.json())
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchCapsules() }, [fetchCapsules])

  const handleCreate = async () => {
    if (!title.trim() || !message.trim() || !openDate) {
      toast.error('يرجى تعبئة جميع الحقول المطلوبة')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/timecapsule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), message: message.trim(), mood: mood || null, openDate }),
      })
      if (!res.ok) throw new Error()
      toast.success('تم إنشاء الكبسولة الزمنية بنجاح')
      setModalOpen(false)
      setTitle('')
      setMessage('')
      setMood('')
      setOpenDate('')
      fetchCapsules()
    } catch {
      toast.error('حدث خطأ في إنشاء الكبسولة')
    }
    setSaving(false)
  }

  const handleOpen = async (capsule: TimeCapsule) => {
    setOpening(true)
    try {
      const res = await fetch(`/api/timecapsule/${capsule.id}/open`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setRevealModal(updated)
      toast.success('تم فتح الكبسولة الزمنية')
      fetchCapsules()
    } catch {
      toast.error('حدث خطأ في فتح الكبسولة')
    }
    setOpening(false)
  }

  const closedCapsules = capsules.filter((c) => !c.isOpened)
  const openedCapsules = capsules.filter((c) => c.isOpened)

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
            <Package className="h-5 w-5 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">الكبسولة الزمنية</h1>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Package className="h-4 w-4" />
          كبسولة جديدة
        </button>
      </motion.div>

      {/* Empty State */}
      {!loading && capsules.length === 0 && (
        <motion.div variants={itemVariants} className="glass p-12 flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10">
            <Package className="h-8 w-8 text-violet-400" />
          </div>
          <p className="text-gray-400">اصنع أول كبسولة زمنية</p>
          <button onClick={() => setModalOpen(true)} className="btn-secondary text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" />
            إنشاء كبسولة
          </button>
        </motion.div>
      )}

      {/* Closed Capsules */}
      {closedCapsules.length > 0 && (
        <motion.div variants={itemVariants}>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-violet-400" />
            كبسولات مغلقة ({closedCapsules.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {closedCapsules.map((capsule) => {
                const progress = calcProgress(capsule.createdAt, capsule.openDate)
                const ready = isReadyToOpen(capsule.openDate, capsule.isOpened)
                return (
                  <motion.div
                    key={capsule.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass glass-hover p-6"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                        <Package className="h-5 w-5 text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{capsule.title}</p>
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>يُفتح في: {formatDate(capsule.openDate)}</span>
                        </div>
                      </div>
                      <Lock className="h-4 w-4 text-gray-600 shrink-0" />
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                        <span>التقدم</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-bar-fill bg-gradient-to-l from-violet-500 to-blue-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {ready && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => handleOpen(capsule)}
                        disabled={opening}
                        className="w-full btn-primary flex items-center justify-center gap-2 relative overflow-hidden"
                      >
                        <span className="absolute inset-0 bg-gradient-to-l from-violet-500/20 to-blue-500/20 animate-pulse" />
                        <Send className="h-4 w-4 relative z-10" />
                        <span className="relative z-10">
                          {opening ? 'جاري الفتح...' : 'افتح الكبسولة'}
                        </span>
                      </motion.button>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Opened Capsules */}
      {openedCapsules.length > 0 && (
        <motion.div variants={itemVariants}>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-emerald-400" />
            كبسولات مفتوحة ({openedCapsules.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {openedCapsules.map((capsule) => (
                <motion.button
                  key={capsule.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setRevealModal(capsule)}
                  className="glass glass-hover p-6 text-right"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                      <Mail className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{capsule.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="badge badge-emerald text-xs">تم الفتح</span>
                        <span className="text-gray-500 text-xs">{formatDateShort(capsule.openDate)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{capsule.message}</p>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <motion.div key={i} variants={itemVariants} className="glass p-6">
              <div className="skeleton h-6 w-3/4 rounded-lg mb-3" />
              <div className="skeleton h-4 w-1/2 rounded-lg mb-4" />
              <div className="skeleton h-2 w-full rounded-lg" />
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Capsule Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="modal-content max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Package className="h-5 w-5 text-violet-400" />
                  كبسولة زمنية جديدة
                </h3>
                <button onClick={() => setModalOpen(false)} className="btn-icon">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">العنوان</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input"
                    placeholder="أعطِ كبسولتك عنوانًا..."
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">الرسالة</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="textarea"
                    rows={4}
                    placeholder="اكتب رسالتك لنفسك المستقبلية..."
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">المزاج (اختياري)</label>
                  <select
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="input"
                  >
                    {moodOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">تاريخ الافتتاح</label>
                  <input
                    type="date"
                    value={openDate}
                    onChange={(e) => setOpenDate(e.target.value)}
                    className="input"
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  />
                </div>

                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {saving ? 'جاري الإنشاء...' : 'إنشاء الكبسولة'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reveal Modal */}
      <AnimatePresence>
        {revealModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setRevealModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotateY: -30 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
              className="modal-content max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
                  className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-emerald-500/10 mb-4"
                >
                  <Mail className="h-8 w-8 text-emerald-400" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="badge badge-emerald">تم الفتح</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{revealModal.title}</h3>
                  <p className="text-xs text-gray-500">{formatDate(revealModal.createdAt)}</p>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass p-5 mb-6"
              >
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{revealModal.message}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <button
                  onClick={() => setRevealModal(null)}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  إغلاق
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
