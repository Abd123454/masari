'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Repeat,
  Circle,
  CheckCircle2,
  Trash2,
  Loader2,
  X,
  Flame,
  BookOpen,
  Heart,
  Dumbbell,
  Droplets,
  Star,
  Moon,
  Sun,
  BookMarked,
  Languages,
  Music,
  Brain,
  Coffee,
  Bike,
  Apple,
  TreePine,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

/* ─── Animation Variants ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.4, 0.25, 1] },
  },
}

/* ─── Types ─── */
interface Habit {
  id: string
  name: string
  icon: string
  color: string
  frequency: string
  completions: { id: string; date: string }[]
}

/* ─── Icon Map ─── */
const iconMap: Record<string, React.ElementType> = {
  Flame,
  BookOpen,
  Heart,
  Dumbbell,
  Droplets,
  Star,
  Moon,
  Sun,
  BookMarked,
  Languages,
  Music,
  Brain,
  Coffee,
  Bike,
  Apple,
  TreePine,
}

/* ─── Icon Options for Selector ─── */
const iconOptions = [
  { name: 'Flame', component: Flame },
  { name: 'BookOpen', component: BookOpen },
  { name: 'Heart', component: Heart },
  { name: 'Dumbbell', component: Dumbbell },
  { name: 'Droplets', component: Droplets },
  { name: 'Star', component: Star },
  { name: 'Moon', component: Moon },
  { name: 'Sun', component: Sun },
  { name: 'BookMarked', component: BookMarked },
  { name: 'Languages', component: Languages },
  { name: 'Music', component: Music },
  { name: 'Brain', component: Brain },
  { name: 'Coffee', component: Coffee },
  { name: 'Bike', component: Bike },
  { name: 'Apple', component: Apple },
  { name: 'TreePine', component: TreePine },
]

/* ─── Color Presets ─── */
const colorPresets = [
  '#8B5CF6', // violet
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#F43F5E', // rose
]

/* ─── Helpers ─── */
function isToday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const t = new Date()
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
}

function getLast7DaysDates(): string[] {
  const dates: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formIcon, setFormIcon] = useState('Flame')
  const [formColor, setFormColor] = useState('#8B5CF6')
  const [formFrequency, setFormFrequency] = useState('daily')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/habits')
        const data = await res.json()
        if (!cancelled) setHabits(data || [])
      } catch {
        if (!cancelled) toast.error('حدث خطأ في جلب العادات')
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const fetchHabits = async () => {
    try {
      const res = await fetch('/api/habits')
      const data = await res.json()
      setHabits(data || [])
    } catch {
      toast.error('حدث خطأ في جلب العادات')
    }
  }

  /* ─── Handlers ─── */
  const handleToggleComplete = async (habit: Habit) => {
    const isCompletedToday = habit.completions?.some(c => isToday(c.date))
    const optimistic = habits.map(h => {
      if (h.id !== habit.id) return h
      const newCompletions = isCompletedToday
        ? h.completions.filter(c => !isToday(c.date))
        : [...h.completions, { id: `temp-${Date.now()}`, date: new Date().toISOString() }]
      return { ...h, completions: newCompletions }
    })
    setHabits(optimistic)
    try {
      await fetch(`/api/habits/${habit.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !isCompletedToday }),
      })
    } catch {
      setHabits(habits)
      toast.error('حدث خطأ')
    }
  }

  const handleDelete = async (habitId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه العادة؟')) return
    setHabits(hs => hs.filter(h => h.id !== habitId))
    try {
      await fetch(`/api/habits/${habitId}`, { method: 'DELETE' })
      toast.success('تم حذف العادة')
    } catch {
      toast.error('حدث خطأ في الحذف')
      fetchHabits()
    }
  }

  const handleSubmit = async () => {
    if (!formName.trim()) {
      toast.error('يرجى إدخال اسم العادة')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          icon: formIcon,
          color: formColor,
          frequency: formFrequency,
        }),
      })
      if (res.ok) {
        toast.success('تم إضافة العادة')
        setShowModal(false)
        resetForm()
        fetchHabits()
      } else {
        toast.error('حدث خطأ في إنشاء العادة')
      }
    } catch {
      toast.error('حدث خطأ في الاتصال')
    }
    setSubmitting(false)
  }

  const resetForm = () => {
    setFormName('')
    setFormIcon('Flame')
    setFormColor('#8B5CF6')
    setFormFrequency('daily')
  }

  const last7Dates = getLast7DaysDates()

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">العادات</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          عادة جديدة
        </button>
      </motion.div>

      {/* Habits Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="glass p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="skeleton w-10 h-10 rounded-xl" />
                <div className="skeleton h-4 w-24" />
              </div>
              <div className="flex gap-1.5 mb-3">
                {[1,2,3,4,5,6,7].map(j => (
                  <div key={j} className="skeleton w-full h-2 rounded-full" />
                ))}
              </div>
              <div className="skeleton h-4 w-20" />
            </div>
          ))}
        </div>
      ) : habits.length === 0 ? (
        <motion.div variants={itemVariants} className="glass p-12 text-center">
          <Repeat className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">ابدأ بتتبع عاداتك</p>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" />
            عادة جديدة
          </button>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {habits.map(habit => {
              const isCompletedToday = habit.completions?.some(c => isToday(c.date))
              const weekCompleted = last7Dates.filter(date =>
                habit.completions?.some(c => new Date(c.date).toISOString().split('T')[0] === date)
              ).length

              return (
                <motion.div
                  key={habit.id}
                  layout
                  variants={itemVariants}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass glass-hover p-5 group relative"
                >
                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(habit.id)}
                    className="btn-icon absolute top-3 left-3 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 z-10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Icon + Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm shrink-0"
                      style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
                    >
                      {(() => {
                        const HabitIcon = iconMap[habit.icon] || Flame
                        return <HabitIcon className="w-5 h-5" />
                      })()}
                    </div>
                    <div className="min-w-0">
                      <p className={cn(
                        'text-sm font-semibold truncate',
                        isCompletedToday && 'text-gray-500 line-through'
                      )}>
                        {habit.name}
                      </p>
                    </div>
                  </div>

                  {/* 7-Day Dots */}
                  <div className="flex gap-1.5 mb-3">
                    {last7Dates.map((date, i) => {
                      const completed = habit.completions?.some(c =>
                        new Date(c.date).toISOString().split('T')[0] === date
                      )
                      const isCurrentDay = isToday(date)
                      return (
                        <div
                          key={i}
                          className={cn(
                            'flex-1 h-2 rounded-full transition-all',
                            completed
                              ? 'bg-emerald-400'
                              : 'bg-white/[0.08]',
                            isCurrentDay && !completed && 'ring-1 ring-white/20'
                          )}
                        />
                      )
                    })}
                  </div>

                  {/* Progress Text */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {weekCompleted}/7 هذا الأسبوع
                    </p>

                    {/* Toggle Button */}
                    <button
                      onClick={() => handleToggleComplete(habit)}
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                        isCompletedToday
                          ? 'bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10'
                          : 'border border-white/10 text-gray-500 hover:border-emerald-400/50 hover:text-emerald-400'
                      )}
                    >
                      {isCompletedToday ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ─── Add Habit Modal ─── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <motion.div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">عادة جديدة</h2>
              <button onClick={() => setShowModal(false)} className="btn-icon">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">اسم العادة</label>
                <input
                  type="text"
                  className="input"
                  placeholder="مثال: الصلاة، القراءة..."
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Icon */}
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">الأيقونة</label>
                <div className="grid grid-cols-4 gap-2">
                  {iconOptions.map(opt => {
                    const IconComponent = opt.component
                    return (
                      <button
                        key={opt.name}
                        onClick={() => setFormIcon(opt.name)}
                        className={cn(
                          'flex items-center justify-center p-3 rounded-xl border transition-all',
                          formIcon === opt.name
                            ? 'bg-violet-500/15 border-violet-500/30 text-violet-400'
                            : 'border-white/10 text-gray-400 hover:bg-white/5'
                        )}
                      >
                        <IconComponent className="w-5 h-5" />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">اللون</label>
                <div className="flex gap-3">
                  {colorPresets.map(color => (
                    <button
                      key={color}
                      onClick={() => setFormColor(color)}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all',
                        formColor === color ? 'ring-2 ring-offset-2 ring-offset-gray-900 scale-110' : 'hover:scale-110'
                      )}
                      style={{ backgroundColor: color, ringColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">التكرار</label>
                <div className="flex gap-2">
                  {[
                    { key: 'daily', label: 'يومي' },
                    { key: 'weekly', label: 'أسبوعي' },
                  ].map(f => (
                    <button
                      key={f.key}
                      onClick={() => setFormFrequency(f.key)}
                      className={cn(
                        'flex-1 px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                        formFrequency === f.key
                          ? 'bg-violet-500/15 border-violet-500/30 text-violet-400'
                          : 'border-white/10 text-gray-400 hover:bg-white/5'
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                إضافة العادة
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
