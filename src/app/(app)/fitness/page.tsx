'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dumbbell, Plus, Trash2, X, Flame, Timer } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface FitnessLog {
  id: string
  exercise: string
  sets: number
  reps: number
  duration: number
  calories: number
  date: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

export default function FitnessPage() {
  const [logs, setLogs] = useState<FitnessLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newExercise, setNewExercise] = useState({
    exercise: '', sets: 3, reps: 10, duration: 30, calories: 100,
  })
  const [adding, setAdding] = useState(false)

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/fitness')
      if (res.ok) setLogs(await res.json())
    } catch {}
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/fitness')
        if (res.ok && mounted) setLogs(await res.json())
      } catch {}
      if (mounted) setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const todayStr = new Date().toISOString().split('T')[0]
  const todayLogs = useMemo(() => logs.filter(l => l.date.startsWith(todayStr)), [logs, todayStr])
  const todayExercises = todayLogs.length
  const todayCalories = todayLogs.reduce((a, l) => a + l.calories, 0)
  const todayDuration = todayLogs.reduce((a, l) => a + l.duration, 0)

  // Weekly chart data
  const weeklyData = useMemo(() => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - dayOfWeek)
    startOfWeek.setHours(0, 0, 0, 0)

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const dayLogs = logs.filter(l => l.date.startsWith(dateStr))
      return {
        day: arabicDays[i],
        calories: dayLogs.reduce((a, l) => a + l.calories, 0),
        isToday: i === dayOfWeek,
      }
    })
  }, [logs])

  const handleAdd = async () => {
    if (!newExercise.exercise.trim()) {
      toast.error('يرجى إدخال اسم التمرين')
      return
    }
    setAdding(true)
    try {
      const res = await fetch('/api/fitness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExercise),
      })
      if (res.ok) {
        toast.success('تمت إضافة التمرين')
        setNewExercise({ exercise: '', sets: 3, reps: 10, duration: 30, calories: 100 })
        setShowAddModal(false)
        fetchLogs()
      }
    } catch {}
    setAdding(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/fitness/${id}`, { method: 'DELETE' })
      toast.success('تم حذف التمرين')
      fetchLogs()
    } catch {}
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Dumbbell className="w-7 h-7 text-violet-400" />
          اللياقة
        </h1>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          تمرين جديد
        </button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
        <div className="glass p-4 text-center">
          <Dumbbell className="w-5 h-5 text-orange-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{todayExercises}</div>
          <div className="text-xs text-gray-500">تمارين اليوم</div>
        </div>
        <div className="glass p-4 text-center">
          <Flame className="w-5 h-5 text-rose-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{todayCalories}</div>
          <div className="text-xs text-gray-500">سعرات اليوم (kcal)</div>
        </div>
        <div className="glass p-4 text-center">
          <Timer className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{todayDuration}</div>
          <div className="text-xs text-gray-500">مدة اليوم (min)</div>
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass p-4">
              <div className="skeleton h-5 w-1/3 rounded-lg mb-2" />
              <div className="skeleton h-3 w-1/4 rounded-lg" />
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <motion.div variants={itemVariants} className="glass p-12 text-center">
          <Dumbbell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">لا توجد سجلات لياقة بعد</p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            تمرين جديد
          </button>
        </motion.div>
      ) : (
        <>
          {/* Exercise Log */}
          <motion.div variants={itemVariants} className="glass p-4">
            <h3 className="text-white font-semibold mb-3">سجل التمارين</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {logs.map(log => (
                  <motion.div
                    key={log.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Dumbbell className="w-4 h-4 text-orange-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-sm">{log.exercise}</div>
                        <div className="text-xs text-gray-500">
                          {log.sets} × {log.reps}
                          {log.duration > 0 && ` | ${log.duration} دقيقة`}
                        </div>
                      </div>
                      <span className="badge badge-rose shrink-0">{log.calories} kcal</span>
                    </div>
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="btn-icon w-7 h-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mr-2"
                    >
                      <Trash2 className="w-3 h-3 text-rose-400" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Weekly Chart */}
          <motion.div variants={itemVariants} className="glass p-4">
            <h3 className="text-white font-semibold mb-4">السعرات هذا الأسبوع</h3>
            <div className="h-48" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1F2937',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                    cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Bar dataKey="calories" radius={[6, 6, 0, 0]}>
                    {weeklyData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.isToday ? '#8B5CF6' : '#8B5CF640'}
                        stroke={entry.isToday ? '#A78BFA' : 'none'}
                        strokeWidth={entry.isToday ? 2 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </>
      )}

      {/* Add Exercise Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-orange-400" />
                  تمرين جديد
                </h2>
                <button onClick={() => setShowAddModal(false)} className="btn-icon">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">اسم التمرين</label>
                  <input
                    type="text"
                    value={newExercise.exercise}
                    onChange={e => setNewExercise(x => ({ ...x, exercise: e.target.value }))}
                    className="input"
                    placeholder="رفع الأثقال"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">المجموعات</label>
                    <input
                      type="number"
                      value={newExercise.sets}
                      onChange={e => setNewExercise(x => ({ ...x, sets: parseInt(e.target.value) || 0 }))}
                      className="input"
                      dir="ltr"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">التكرارات</label>
                    <input
                      type="number"
                      value={newExercise.reps}
                      onChange={e => setNewExercise(x => ({ ...x, reps: parseInt(e.target.value) || 0 }))}
                      className="input"
                      dir="ltr"
                      min={0}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">المدة (دقيقة)</label>
                    <input
                      type="number"
                      value={newExercise.duration}
                      onChange={e => setNewExercise(x => ({ ...x, duration: parseInt(e.target.value) || 0 }))}
                      className="input"
                      dir="ltr"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">السعرات (kcal)</label>
                    <input
                      type="number"
                      value={newExercise.calories}
                      onChange={e => setNewExercise(x => ({ ...x, calories: parseInt(e.target.value) || 0 }))}
                      className="input"
                      dir="ltr"
                      min={0}
                    />
                  </div>
                </div>

                <button
                  onClick={handleAdd}
                  disabled={adding}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {adding ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                  إضافة
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
