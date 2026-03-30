'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smile, SmilePlus, Meh, Frown, Angry, Save, Loader2, BookOpen } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface MoodLog {
  id: string
  mood: string
  note: string | null
  date: string
  createdAt: string
}

const moods = [
  { key: 'happy', label: 'سعيد', icon: Smile, color: '#10B981', bg: 'bg-emerald-500/15', ring: 'ring-emerald-500/40', text: 'text-emerald-400', value: 5 },
  { key: 'good', label: 'جيد', icon: SmilePlus, color: '#3B82F6', bg: 'bg-blue-500/15', ring: 'ring-blue-500/40', text: 'text-blue-400', value: 4 },
  { key: 'neutral', label: 'عادي', icon: Meh, color: '#F59E0B', bg: 'bg-amber-500/15', ring: 'ring-amber-500/40', text: 'text-amber-400', value: 3 },
  { key: 'sad', label: 'حزين', icon: Frown, color: '#F97316', bg: 'bg-orange-500/15', ring: 'ring-orange-500/40', text: 'text-orange-400', value: 2 },
  { key: 'angry', label: 'سيء', icon: Angry, color: '#F43F5E', bg: 'bg-rose-500/15', ring: 'ring-rose-500/40', text: 'text-rose-400', value: 1 },
]

const moodIconMap: Record<string, React.ElementType> = {
  happy: Smile,
  good: SmilePlus,
  neutral: Meh,
  sad: Frown,
  angry: Angry,
}

const moodColorMap: Record<string, string> = {
  happy: '#10B981',
  good: '#3B82F6',
  neutral: '#F59E0B',
  sad: '#F97316',
  angry: '#F43F5E',
}

const moodTextMap: Record<string, string> = {
  happy: 'سعيد',
  good: 'جيد',
  neutral: 'عادي',
  sad: 'حزين',
  angry: 'سيء',
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

export default function MoodPage() {
  const [logs, setLogs] = useState<MoodLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [todaySaved, setTodaySaved] = useState(false)

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/mood')
      if (res.ok) {
        const data = await res.json()
        setLogs(data)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const todayLog = data.find((l: MoodLog) => {
          const d = new Date(l.date)
          return d >= today && d < tomorrow
        })
        if (todayLog) {
          setSelectedMood(todayLog.mood)
          setNote(todayLog.note || '')
          setTodaySaved(true)
        }
      }
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const getWeeklyData = () => {
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    const data = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const tomorrow = new Date(d)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dayLog = logs.find((l: MoodLog) => {
        const ld = new Date(l.date)
        return ld >= d && ld < tomorrow
      })
      const moodValue = dayLog ? (moods.find(m => m.key === dayLog.mood)?.value || 3) : 0
      data.push({
        name: dayNames[d.getDay()],
        value: moodValue,
      })
    }
    return data
  }

  const handleSave = async () => {
    if (!selectedMood) {
      toast.error('يرجى اختيار مزاجك أولاً')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: selectedMood, note: note || null }),
      })
      if (!res.ok) throw new Error()
      toast.success('تم حفظ المزاج بنجاح')
      setTodaySaved(true)
      fetchLogs()
    } catch {
      toast.error('حدث خطأ في حفظ المزاج')
    }
    setSaving(false)
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <Smile className="h-5 w-5 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">المزاج</h1>
        </div>
      </motion.div>

      {/* Mood Selection */}
      <motion.div variants={itemVariants} className="glass p-8">
        <div className="text-center mb-6">
          <p className="text-lg text-gray-300">كيف تشعر اليوم؟</p>
        </div>
        <div className="grid grid-cols-5 gap-3 max-w-lg mx-auto mb-6">
          {moods.map((mood) => {
            const Icon = mood.icon
            const isSelected = selectedMood === mood.key
            return (
              <motion.button
                key={mood.key}
                onClick={() => { setSelectedMood(mood.key); setTodaySaved(false) }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200',
                  isSelected
                    ? `${mood.bg} ring-2 ${mood.ring} scale-110 shadow-lg`
                    : 'opacity-40 hover:opacity-70'
                )}
              >
                <div className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200',
                  isSelected ? `${mood.bg}` : 'bg-white/[0.03]'
                )}>
                  <Icon className={cn('h-7 w-7 transition-colors', isSelected ? mood.text : 'text-gray-400')} />
                </div>
                <span className={cn('text-xs font-medium transition-colors', isSelected ? 'text-white' : 'text-gray-500')}>
                  {mood.label}
                </span>
              </motion.button>
            )
          })}
        </div>

        {/* Note */}
        <div className="max-w-lg mx-auto">
          <textarea
            value={note}
            onChange={(e) => { setNote(e.target.value); setTodaySaved(false) }}
            className="textarea"
            rows={2}
            placeholder="ملاحظات (اختياري)"
          />
          <button
            onClick={handleSave}
            disabled={saving || !selectedMood}
            className="btn-primary w-full mt-3 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'جاري الحفظ...' : 'حفظ المزاج'}
          </button>
          {todaySaved && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-emerald-400 text-sm mt-2 flex items-center justify-center gap-1"
            >
              <Save className="h-3.5 w-3.5" />
              تم الحفظ
            </motion.p>
          )}
        </div>
      </motion.div>

      {/* Weekly Chart */}
      <motion.div variants={itemVariants} className="glass p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-violet-400" />
          سجل المزاج هذا الأسبوع
        </h2>
        {loading ? (
          <div className="skeleton h-48 w-full rounded-xl" />
        ) : (
          <div className="h-64" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getWeeklyData()}>
                <defs>
                  <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 5]} />
                <Tooltip
                  contentStyle={{
                    background: '#1F2937',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    color: '#fff',
                  }}
                  formatter={(value: number) => {
                    const labels = ['', 'سيء', 'حزين', 'عادي', 'جيد', 'سعيد']
                    return [labels[value] || '-', 'المزاج']
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  fill="url(#moodGradient)"
                  dot={{ r: 4, fill: '#8B5CF6', stroke: '#111827', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* Mood History */}
      <motion.div variants={itemVariants} className="glass p-6">
        <h2 className="text-lg font-bold text-white mb-4">سجل المزاج</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Smile className="h-10 w-10 text-gray-600" />
            <p className="text-gray-500">لا توجد سجلات مزاج بعد</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {logs.map((log) => {
                const Icon = moodIconMap[log.mood] || Meh
                const color = moodColorMap[log.mood] || '#6b7280'
                return (
                  <motion.div
                    key={log.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <Icon className="h-5 w-5" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{moodTextMap[log.mood] || log.mood}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDate(log.date)}</p>
                    </div>
                    {log.note && (
                      <p className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">{log.note}</p>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
