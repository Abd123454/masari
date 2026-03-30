'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Plus, Trash2, Clock, X, Loader2, BedDouble, Sunset } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SleepLog {
  id: string
  sleepTime: string
  wakeTime: string
  quality: string
  note: string | null
  date: string
  createdAt: string
}

const qualityMap: Record<string, { label: string; badge: string; color: string }> = {
  excellent: { label: 'ممتاز', badge: 'badge-emerald', color: '#10B981' },
  good: { label: 'جيد', badge: 'badge-blue', color: '#3B82F6' },
  average: { label: 'متوسط', badge: 'badge-amber', color: '#F59E0B' },
  poor: { label: 'ضعيف', badge: 'badge-rose', color: '#F43F5E' },
}

const qualityOptions = [
  { key: 'excellent', label: 'ممتاز', color: 'emerald' },
  { key: 'good', label: 'جيد', color: 'blue' },
  { key: 'average', label: 'متوسط', color: 'amber' },
  { key: 'poor', label: 'ضعيف', color: 'rose' },
]

function calcHours(sleepTime: string, wakeTime: string): { hours: number; minutes: number } {
  const s = new Date(sleepTime)
  const w = new Date(wakeTime)
  let diffMs = w.getTime() - s.getTime()
  if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000
  const totalMin = Math.floor(diffMs / 60000)
  return { hours: Math.floor(totalMin / 60), minutes: totalMin % 60 }
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric', month: 'short' })
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
}

export default function SleepPage() {
  const [logs, setLogs] = useState<SleepLog[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sleepTime, setSleepTime] = useState('23:00')
  const [wakeTime, setWakeTime] = useState('07:00')
  const [quality, setQuality] = useState('good')
  const [note, setNote] = useState('')

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/sleep')
      if (res.ok) setLogs(await res.json())
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const latestLog = logs[0]

  const getWeeklyData = () => {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    const data = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const tomorrow = new Date(d)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dayLog = logs.find(l => {
        const ld = new Date(l.date)
        return ld >= d && ld < tomorrow
      })
      const hours = dayLog ? calcHours(dayLog.sleepTime, dayLog.wakeTime).hours + calcHours(dayLog.sleepTime, dayLog.wakeTime).minutes / 60 : 0
      const qualityKey = dayLog?.quality || ''
      data.push({
        name: days[d.getDay()],
        hours: Math.round(hours * 10) / 10,
        quality: qualityKey,
      })
    }
    return data
  }

  const getBarColor = (hours: number) => {
    if (hours >= 7) return '#10B981'
    if (hours >= 5) return '#F59E0B'
    return '#F43F5E'
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const today = new Date()
      const [sh, sm] = sleepTime.split(':').map(Number)
      const [wh, wm] = wakeTime.split(':').map(Number)
      const sleepDate = new Date(today)
      sleepDate.setHours(sh, sm, 0, 0)
      const wakeDate = new Date(today)
      wakeDate.setHours(wh, wm, 0, 0)

      const res = await fetch('/api/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sleepTime: sleepDate.toISOString(), wakeTime: wakeDate.toISOString(), quality, note: note || null }),
      })
      if (!res.ok) throw new Error()
      toast.success('تم تسجيل النوم بنجاح')
      setModalOpen(false)
      setNote('')
      fetchLogs()
    } catch {
      toast.error('حدث خطأ في تسجيل النوم')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/sleep/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('تم حذف السجل')
      fetchLogs()
    } catch {
      toast.error('حدث خطأ في الحذف')
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
            <Moon className="h-5 w-5 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">النوم</h1>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Moon className="h-4 w-4" />
          تسجيل نوم
        </button>
      </motion.div>

      {/* Tonight's Sleep */}
      <motion.div variants={itemVariants} className="glass-accent p-8 flex flex-col items-center gap-4">
        {loading ? (
          <div className="skeleton h-32 w-full rounded-xl" />
        ) : latestLog ? (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/15">
              <Moon className="h-8 w-8 text-violet-400" />
            </div>
            {(() => {
              const { hours, minutes } = calcHours(latestLog.sleepTime, latestLog.wakeTime)
              return (
                <p className="text-4xl font-bold text-white">
                  {hours}h {minutes}m
                </p>
              )
            })()}
            <span className={cn('badge', qualityMap[latestLog.quality]?.badge || 'badge-blue')}>
              {qualityMap[latestLog.quality]?.label || latestLog.quality}
            </span>
            <div className="flex items-center gap-4 text-gray-400 text-sm">
              <div className="flex items-center gap-1.5">
                <Sunset className="h-4 w-4 text-blue-400" />
                <span>{formatTime(latestLog.sleepTime)}</span>
              </div>
              <span className="text-gray-600">{'\u2192'}</span>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-400" />
                <span>{formatTime(latestLog.wakeTime)}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/15">
              <BedDouble className="h-8 w-8 text-violet-400" />
            </div>
            <p className="text-gray-400">لا يوجد سجل نوم بعد</p>
            <button onClick={() => setModalOpen(true)} className="btn-secondary text-sm">سجل نومك الآن</button>
          </div>
        )}
      </motion.div>

      {/* Weekly Chart */}
      <motion.div variants={itemVariants} className="glass p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-violet-400" />
          ساعات النوم هذا الأسبوع
        </h2>
        {loading ? (
          <div className="skeleton h-48 w-full rounded-xl" />
        ) : (
          <div className="h-64" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getWeeklyData()} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 12]} />
                <Tooltip
                  contentStyle={{
                    background: '#1F2937',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    color: '#fff',
                  }}
                  formatter={(value: number) => [`${value}h`, 'النوم']}
                />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                  {getWeeklyData().map((entry, index) => (
                    <Cell key={index} fill={entry.hours > 0 ? getBarColor(entry.hours) : 'rgba(255,255,255,0.06)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* Sleep Logs */}
      <motion.div variants={itemVariants} className="glass p-6">
        <h2 className="text-lg font-bold text-white mb-4">سجلات النوم</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Moon className="h-10 w-10 text-gray-600" />
            <p className="text-gray-500">لا توجد سجلات نوم بعد</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {logs.map((log) => {
                const { hours, minutes } = calcHours(log.sleepTime, log.wakeTime)
                return (
                  <motion.div
                    key={log.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    className="group flex items-center justify-between p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                        <Moon className="h-4 w-4 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{formatDate(log.date)}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-gray-400 text-xs">{hours}h {minutes}m</span>
                          <span className="text-gray-600">{'\u2022'}</span>
                          <span className="text-gray-500 text-xs">{formatTime(log.sleepTime)} {'\u2192'} {formatTime(log.wakeTime)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn('badge', qualityMap[log.quality]?.badge || 'badge-blue')}>
                        {qualityMap[log.quality]?.label || log.quality}
                      </span>
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="btn-icon opacity-0 group-hover:opacity-100 text-rose-400 hover:bg-rose-500/10 hover:text-rose-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Add Sleep Modal */}
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
                  <Moon className="h-5 w-5 text-violet-400" />
                  تسجيل نوم
                </h3>
                <button onClick={() => setModalOpen(false)} className="btn-icon">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">وقت النوم</label>
                    <input
                      type="time"
                      value={sleepTime}
                      onChange={(e) => setSleepTime(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">وقت الاستيقاظ</label>
                    <input
                      type="time"
                      value={wakeTime}
                      onChange={(e) => setWakeTime(e.target.value)}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-3">جودة النوم</label>
                  <div className="grid grid-cols-2 gap-3">
                    {qualityOptions.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setQuality(opt.key)}
                        className={cn(
                          'p-3 rounded-xl border text-sm font-medium transition-all duration-200',
                          quality === opt.key
                            ? `bg-${opt.color}-500/10 border-${opt.color}-500/30 text-${opt.color}-400 ring-1 ring-${opt.color}-500/20`
                            : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:bg-white/[0.05]'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">ملاحظة (اختياري)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="textarea"
                    rows={2}
                    placeholder="ملاحظات عن نومك..."
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {saving ? 'جاري الحفظ...' : 'تسجيل النوم'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
