'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  CheckSquare,
  Circle,
  CheckCircle2,
  Trash2,
  Clock,
  Calendar,
  Loader2,
  X,
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
interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  category: string | null
  dueDate: string | null
  dueTime: string | null
}

/* ─── Priority Config ─── */
const priorityColors: Record<string, string> = {
  low: 'text-emerald-400',
  medium: 'text-amber-400',
  high: 'text-orange-400',
  urgent: 'text-rose-400',
}

const priorityBadgeClass: Record<string, string> = {
  low: 'badge badge-emerald',
  medium: 'badge badge-amber',
  high: 'badge badge-violet',
  urgent: 'badge badge-rose',
}

const priorityLabels: Record<string, string> = {
  low: 'منخفض',
  medium: 'متوسط',
  high: 'عالي',
  urgent: 'عاجل',
}

const prioritySelectColors: Record<string, string> = {
  low: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  medium: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  high: 'bg-violet-500/10 border-violet-500/30 text-violet-400',
  urgent: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
}

/* ─── Helpers ─── */
function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const t = new Date()
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
}

function isThisWeek(dateStr: string | null): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - today.getDay())
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 7)
  return d >= start && d < end
}

const filterTabs = [
  { key: 'all', label: 'الكل' },
  { key: 'today', label: 'اليوم' },
  { key: 'week', label: 'هذا الأسبوع' },
  { key: 'completed', label: 'مكتملة' },
]

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formPriority, setFormPriority] = useState('medium')
  const [formCategory, setFormCategory] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formTime, setFormTime] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/tasks')
        const data = await res.json()
        if (!cancelled) setTasks(data || [])
      } catch {
        if (!cancelled) toast.error('حدث خطأ في جلب المهام')
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks')
      const data = await res.json()
      setTasks(data || [])
    } catch {
      toast.error('حدث خطأ في جلب المهام')
    }
  }

  /* ─── Filtered Tasks ─── */
  const filtered = tasks.filter(t => {
    switch (filter) {
      case 'today': return t.status === 'pending' && isToday(t.dueDate)
      case 'week': return t.status === 'pending' && isThisWeek(t.dueDate)
      case 'completed': return t.status === 'completed'
      default: return true
    }
  })

  /* ─── Handlers ─── */
  const handleToggleComplete = async (task: Task) => {
    const prev = task.status
    const next = prev === 'completed' ? 'pending' : 'completed'
    setTasks(ts => ts.map(t => t.id === task.id ? { ...t, status: next } : t))
    try {
      await fetch(`/api/tasks/${task.id}/complete`, { method: 'POST' })
    } catch {
      setTasks(ts => ts.map(t => t.id === task.id ? { ...t, status: prev } : t))
      toast.error('حدث خطأ')
    }
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المهمة؟')) return
    setTasks(ts => ts.filter(t => t.id !== taskId))
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      toast.success('تم حذف المهمة')
    } catch {
      toast.error('حدث خطأ في الحذف')
      fetchTasks()
    }
  }

  const handleSubmit = async () => {
    if (!formTitle.trim()) {
      toast.error('يرجى إدخال عنوان المهمة')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDesc.trim() || null,
          priority: formPriority,
          category: formCategory.trim() || null,
          dueDate: formDate || null,
          dueTime: formTime || null,
        }),
      })
      if (res.ok) {
        toast.success('تم إضافة المهمة')
        setShowModal(false)
        resetForm()
        fetchTasks()
      } else {
        toast.error('حدث خطأ في إنشاء المهمة')
      }
    } catch {
      toast.error('حدث خطأ في الاتصال')
    }
    setSubmitting(false)
  }

  const resetForm = () => {
    setFormTitle('')
    setFormDesc('')
    setFormPriority('medium')
    setFormCategory('')
    setFormDate('')
    setFormTime('')
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">المهام</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          مهمة جديدة
        </button>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={itemVariants} className="flex gap-2 overflow-x-auto pb-1">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
              filter === tab.key
                ? 'bg-violet-500/15 text-violet-400 border border-violet-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
            )}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass p-4 flex items-center gap-3">
              <div className="skeleton w-5 h-5 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
              <div className="skeleton w-16 h-6 rounded-lg" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div variants={itemVariants} className="glass p-12 text-center">
          <CheckSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">
            {filter === 'completed' ? 'لا توجد مهام مكتملة' : 'لا توجد مهام'}
          </p>
          {filter !== 'completed' && (
            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" />
              أضف مهمة جديدة
            </button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filtered.map(task => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.3 }}
                className="glass glass-hover p-4 flex items-start gap-3 group"
              >
                {/* Priority Indicator */}
                <div className={cn(
                  'w-1 self-stretch rounded-full shrink-0',
                  task.priority === 'urgent' && 'bg-rose-500',
                  task.priority === 'high' && 'bg-violet-500',
                  task.priority === 'medium' && 'bg-amber-500',
                  task.priority === 'low' && 'bg-emerald-500',
                  !task.priority && 'bg-gray-500'
                )} />

                {/* Checkbox */}
                <button
                  onClick={() => handleToggleComplete(task)}
                  className="shrink-0 mt-0.5"
                >
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className={cn('w-5 h-5', priorityColors[task.priority] || 'text-gray-500')} />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium',
                    task.status === 'completed' ? 'text-gray-500 line-through' : 'text-white'
                  )}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {task.dueDate && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(task.dueDate).toLocaleDateString('ar-SA')}
                      </span>
                    )}
                    {task.dueTime && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {task.dueTime}
                      </span>
                    )}
                    {task.priority && (
                      <span className={cn('badge', priorityBadgeClass[task.priority])}>
                        {priorityLabels[task.priority]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(task.id)}
                  className="btn-icon opacity-0 group-hover:opacity-100 shrink-0 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ─── Add Task Modal ─── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <motion.div
            className="modal-content max-w-lg"
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">مهمة جديدة</h2>
              <button onClick={() => setShowModal(false)} className="btn-icon">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">العنوان</label>
                <input
                  type="text"
                  className="input"
                  placeholder="عنوان المهمة..."
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">الوصف</label>
                <textarea
                  className="textarea min-h-[80px]"
                  placeholder="وصف اختياري..."
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                />
              </div>

              {/* Priority */}
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">الأولوية</label>
                <div className="flex gap-2 flex-wrap">
                  {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setFormPriority(p)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                        formPriority === p
                          ? prioritySelectColors[p]
                          : 'border-white/10 text-gray-400 hover:bg-white/5'
                      )}
                    >
                      {priorityLabels[p]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">التصنيف</label>
                <input
                  type="text"
                  className="input"
                  placeholder="مثال: عمل، دراسة..."
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">التاريخ</label>
                  <input
                    type="date"
                    className="input"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">الوقت</label>
                  <input
                    type="time"
                    className="input"
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                  />
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
                إضافة المهمة
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
