'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Target, Trash2, Calendar, Minus, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const CATEGORY_CONFIG: Record<string, { label: string; badge: string; color: string; progressColor: string }> = {
  finance: { label: 'المالية', badge: 'badge-amber', color: 'text-amber-400', progressColor: '#F59E0B' },
  education: { label: 'التعليم', badge: 'badge-blue', color: 'text-blue-400', progressColor: '#3B82F6' },
  travel: { label: 'السفر', badge: 'badge-emerald', color: 'text-emerald-400', progressColor: '#10B981' },
  personal: { label: 'الشخصية', badge: 'badge-violet', color: 'text-violet-400', progressColor: '#8B5CF6' },
  health: { label: 'الصحة', badge: 'badge-rose', color: 'text-rose-400', progressColor: '#F43F5E' },
}

const CATEGORIES = Object.keys(CATEGORY_CONFIG)

interface Goal {
  id: string
  title: string
  description: string | null
  category: string
  progress: number
  deadline: string | null
  createdAt: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 }
}

function getProgressColor(progress: number): string {
  if (progress >= 100) return '#10B981'
  if (progress >= 75) return '#8B5CF6'
  if (progress >= 50) return '#3B82F6'
  if (progress >= 25) return '#F59E0B'
  return '#6b7280'
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formCategory, setFormCategory] = useState('personal')
  const [formDeadline, setFormDeadline] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch('/api/goals')
      if (res.ok) {
        const data = await res.json()
        setGoals(data.goals)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  const handleSubmit = async () => {
    if (!formTitle.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDesc.trim() || null,
          category: formCategory,
          deadline: formDeadline || null,
        }),
      })
      if (res.ok) {
        toast.success('تم إضافة الهدف بنجاح')
        setShowModal(false)
        fetchGoals()
      } else {
        toast.error('حدث خطأ أثناء إضافة الهدف')
      }
    } catch {
      toast.error('حدث خطأ في الاتصال')
    } finally {
      setSubmitting(false)
    }
  }

  const updateProgress = async (id: string, newProgress: number) => {
    const clamped = Math.min(100, Math.max(0, newProgress))
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: clamped }),
      })
      if (res.ok) {
        const data = await res.json()
        setGoals(prev => prev.map(g => g.id === id ? data.goal : g))
        if (clamped === 100) {
          toast.success('تم تحقيق الهدف!')
        }
      }
    } catch {
      toast.error('حدث خطأ أثناء تحديث التقدم')
    }
  }

  const deleteGoal = async (id: string) => {
    try {
      const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('تم حذف الهدف')
        setGoals(prev => prev.filter(g => g.id !== id))
      }
    } catch {
      toast.error('حدث خطأ أثناء الحذف')
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-white">الأهداف</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => {
          setFormTitle('')
          setFormDesc('')
          setFormCategory('personal')
          setFormDeadline('')
          setShowModal(true)
        }}>
          <Target className="w-4 h-4" />
          هدف جديد
        </button>
      </motion.div>

      {/* Goals List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass p-6 space-y-4">
              <div className="skeleton h-5 w-1/3" />
              <div className="skeleton h-4 w-2/3" />
              <div className="skeleton h-2 w-full" />
            </div>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <motion.div variants={itemVariants} className="glass p-12 text-center">
          <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">حدد أهدافك الأولى</h3>
          <p className="text-gray-500 text-sm mb-4">ابدأ بتتبع أهدافك وتحقيقها خطوة بخطوة</p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            إضافة هدف
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {goals.map((goal, index) => {
              const cat = CATEGORY_CONFIG[goal.category] || CATEGORY_CONFIG.personal
              const pColor = getProgressColor(goal.progress)
              const isComplete = goal.progress >= 100

              return (
                <motion.div
                  key={goal.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                  exit={{ opacity: 0, x: -40 }}
                  className={cn(
                    'glass glass-hover p-5 group relative',
                    isComplete && 'ring-1 ring-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Category + Title row */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={cn('badge', cat.badge)}>{cat.label}</span>
                        {isComplete && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <h3 className={cn(
                        'font-semibold text-white text-base',
                        isComplete && 'line-through text-gray-400'
                      )}>
                        {goal.title}
                      </h3>
                      {goal.description && (
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">{goal.description}</p>
                      )}

                      {/* Progress */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-gray-500">التقدم</span>
                          <span className={cn('text-xs font-bold', isComplete ? 'text-emerald-400' : 'text-gray-300')}>
                            {goal.progress}%
                          </span>
                        </div>
                        <div className="progress-bar">
                          <motion.div
                            className="progress-bar-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${goal.progress}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            style={{ backgroundColor: pColor }}
                          />
                        </div>
                      </div>

                      {/* Deadline */}
                      {goal.deadline && (
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-2">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(goal.deadline).toLocaleDateString('ar-SA')}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isComplete && (
                        <>
                          <button
                            className="btn-icon w-8 h-8"
                            onClick={() => updateProgress(goal.id, goal.progress + 10)}
                            title="زيادة 10%"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="btn-icon w-8 h-8"
                            onClick={() => updateProgress(goal.id, goal.progress - 10)}
                            title="تقليل 10%"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        className="btn-icon opacity-0 group-hover:opacity-100 transition-opacity text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        onClick={() => deleteGoal(goal.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add Goal Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <motion.div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-lg font-bold text-white mb-4">هدف جديد</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">العنوان</label>
                <input
                  className="input"
                  placeholder="اسم الهدف"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">الوصف</label>
                <textarea
                  className="textarea min-h-[70px]"
                  placeholder="وصف الهدف (اختياري)"
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">التصنيف</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      className={cn(
                        'badge text-xs cursor-pointer transition-all',
                        CATEGORY_CONFIG[cat].badge,
                        formCategory === cat && 'ring-2 ring-white/20'
                      )}
                      onClick={() => setFormCategory(cat)}
                    >
                      {CATEGORY_CONFIG[cat].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">الموعد النهائي</label>
                <input
                  type="date"
                  className="input"
                  value={formDeadline}
                  onChange={e => setFormDeadline(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                className="btn-primary flex-1"
                onClick={handleSubmit}
                disabled={!formTitle.trim() || submitting}
              >
                {submitting ? 'جارٍ الإضافة...' : 'إضافة الهدف'}
              </button>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
