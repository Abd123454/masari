'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Plus, Trash2, X, Play, Pause, RotateCcw, Lightbulb, Clock, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TawjihiSubject {
  id: string
  name: string
  targetHours: number
  studiedHours: number
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

const studyTips = [
  'ابدأ بالمواد الصعبة',
  'خذ استراحة كل 45 دقيقة',
  'لخص الدروس بكلماتك',
  'حل أسئلة سابقة',
  'نم جيداً قبل الاختبار',
]

const tipColors = ['text-violet-400', 'text-blue-400', 'text-emerald-400', 'text-amber-400', 'text-rose-400']

export default function TawjihiPage() {
  const [subjects, setSubjects] = useState<TawjihiSubject[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newSubject, setNewSubject] = useState({ name: '', targetHours: 20 })
  const [adding, setAdding] = useState(false)

  // Timer
  const [timerMinutes, setTimerMinutes] = useState(25)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerTotalSeconds, setTimerTotalSeconds] = useState(25 * 60)

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/tawjihi/subjects')
      if (res.ok) setSubjects(await res.json())
    } catch {}
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/tawjihi/subjects')
        if (res.ok && mounted) setSubjects(await res.json())
      } catch {}
      if (mounted) setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  // Timer countdown
  useEffect(() => {
    if (!timerRunning) return
    const interval = setInterval(() => {
      setTimerSeconds(s => {
        if (s === 0) {
          setTimerMinutes(m => {
            if (m === 0) {
              setTimerRunning(false)
              toast.success('انتهى الوقت!')
              return 0
            }
            return m - 1
          })
          return 59
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timerRunning])

  const currentSeconds = timerMinutes * 60 + timerSeconds
  const timerProgress = timerTotalSeconds > 0 ? ((timerTotalSeconds - currentSeconds) / timerTotalSeconds) * 100 : 0

  const setTimer = (mins: number) => {
    setTimerRunning(false)
    setTimerMinutes(mins)
    setTimerSeconds(0)
    setTimerTotalSeconds(mins * 60)
  }

  const handleAddSubject = async () => {
    if (!newSubject.name.trim()) {
      toast.error('يرجى إدخال اسم المادة')
      return
    }
    setAdding(true)
    try {
      const res = await fetch('/api/tawjihi/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubject),
      })
      if (res.ok) {
        toast.success('تمت إضافة المادة')
        setNewSubject({ name: '', targetHours: 20 })
        setShowAddModal(false)
        fetchSubjects()
      }
    } catch {}
    setAdding(false)
  }

  const handleDeleteSubject = async (id: string) => {
    try {
      await fetch(`/api/tawjihi/subjects?id=${id}`, { method: 'DELETE' })
      toast.success('تم حذف المادة')
      fetchSubjects()
    } catch {}
  }

  const handleAddHour = async (subject: TawjihiSubject) => {
    try {
      const res = await fetch(`/api/tawjihi/subjects/${subject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studiedHours: subject.studiedHours + 1 }),
      })
      if (res.ok) {
        setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, studiedHours: s.studiedHours + 1 } : s))
      }
    } catch {}
  }

  const totalTarget = subjects.reduce((a, s) => a + s.targetHours, 0)
  const totalStudied = subjects.reduce((a, s) => a + s.studiedHours, 0)
  const overallProgress = totalTarget > 0 ? Math.round((totalStudied / totalTarget) * 100) : 0

  const formatTime = (m: number, s: number) =>
    `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <GraduationCap className="w-7 h-7 text-violet-400" />
          التوجيهي
        </h1>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          إضافة مادة
        </button>
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass p-6">
              <div className="skeleton h-6 w-1/3 rounded-lg mb-3" />
              <div className="skeleton h-3 w-2/3 rounded-lg" />
            </div>
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <motion.div variants={itemVariants} className="glass p-12 text-center">
          <GraduationCap className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">لا توجد مواد بعد</p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            أضف مادة
          </button>
        </motion.div>
      ) : (
        <>
          {/* Overall Progress */}
          <motion.div variants={itemVariants} className="glass-accent p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">التقدم الكلي</span>
              <span className="text-white font-bold">{overallProgress}%</span>
            </div>
            <div className="progress-bar">
              <motion.div
                className="progress-bar-fill bg-gradient-to-l from-violet-500 to-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(overallProgress, 100)}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <p className="text-gray-500 text-xs mt-2">{overallProgress}% من الخطة الدراسية</p>
          </motion.div>

          {/* Subjects Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence>
              {subjects.map(subject => {
                const progress = subject.targetHours > 0
                  ? Math.round((subject.studiedHours / subject.targetHours) * 100)
                  : 0
                return (
                  <motion.div
                    key={subject.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass glass-hover p-4 relative group"
                  >
                    <button
                      onClick={() => handleDeleteSubject(subject.id)}
                      className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity btn-icon w-7 h-7"
                    >
                      <Trash2 className="w-3 h-3 text-rose-400" />
                    </button>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-violet-500" />
                      <span className="font-semibold text-white">{subject.name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{subject.targetHours} ساعة</span>
                      <span className="text-gray-600">|</span>
                      <span className="text-emerald-400">{subject.studiedHours} مدروسة</span>
                    </div>

                    <div className="progress-bar mb-2">
                      <motion.div
                        className="progress-bar-fill bg-gradient-to-l from-emerald-500 to-emerald-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{progress}%</span>
                      <button
                        onClick={() => handleAddHour(subject)}
                        className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-semibold"
                      >
                        +ساعة
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>

          {/* Quick Timer */}
          <motion.div variants={itemVariants} className="glass p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-400" />
              مؤقت الدراسة
            </h3>

            <div className="flex gap-2 mb-4">
              {[25, 45, 60].map(mins => (
                <button
                  key={mins}
                  onClick={() => setTimer(mins)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                    timerTotalSeconds === mins * 60 && !timerRunning
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                      : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
                  )}
                >
                  {mins} دقيقة
                </button>
              ))}
            </div>

            <div className="text-center mb-4">
              <span className="text-5xl font-bold font-mono text-white tracking-wider">
                {formatTime(timerMinutes, timerSeconds)}
              </span>
            </div>

            <div className="progress-bar mb-4">
              <div
                className="progress-bar-fill bg-gradient-to-l from-violet-500 to-blue-500"
                style={{ width: `${timerProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setTimer(timerTotalSeconds / 60)}
                className="btn-icon"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className="btn-primary w-12 h-12 rounded-xl flex items-center justify-center p-0"
              >
                {timerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            </div>
          </motion.div>

          {/* Study Tips */}
          <motion.div variants={itemVariants} className="glass p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              نصائح الدراسة
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {studyTips.map((tip, i) => (
                <div key={i} className="glass p-3 rounded-xl flex items-start gap-3">
                  <Lightbulb className={cn('w-4 h-4 mt-0.5 shrink-0', tipColors[i])} />
                  <span className="text-gray-300 text-sm">{tip}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}

      {/* Add Subject Modal */}
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
                  <BookOpen className="w-5 h-5 text-violet-400" />
                  إضافة مادة
                </h2>
                <button onClick={() => setShowAddModal(false)} className="btn-icon">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">اسم المادة</label>
                  <input
                    type="text"
                    value={newSubject.name}
                    onChange={e => setNewSubject(s => ({ ...s, name: e.target.value }))}
                    className="input"
                    placeholder="الرياضيات"
                    onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">ساعات المستهدف (ساعة)</label>
                  <input
                    type="number"
                    value={newSubject.targetHours}
                    onChange={e => setNewSubject(s => ({ ...s, targetHours: parseInt(e.target.value) || 0 }))}
                    className="input"
                    dir="ltr"
                    min={1}
                  />
                </div>

                <button
                  onClick={handleAddSubject}
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
