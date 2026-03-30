'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, BookOpen, Clock, Timer, Target, Play, Pause, RotateCcw, Coffee, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface StudySession {
  id: string
  subjectName: string
  duration: number
  pomodoros: number
  date: string
}

interface StudySubject {
  id: string
  name: string
  color: string
  targetHours: number
}

const FOCUS_DURATION = 25 * 60 // 25 minutes in seconds
const BREAK_DURATION = 5 * 60  // 5 minutes in seconds

const SUBJECT_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#F43F5E', '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6']

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 }
}

export default function StudyPage() {
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [subjects, setSubjects] = useState<StudySubject[]>([])
  const [loading, setLoading] = useState(true)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [showSubjectModal, setShowSubjectModal] = useState(false)
  const [showSubjects, setShowSubjects] = useState(false)

  // Session form
  const [sessionSubject, setSessionSubject] = useState('')
  const [sessionDuration, setSessionDuration] = useState('')
  const [sessionPomodoros, setSessionPomodoros] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Subject form
  const [subjectName, setSubjectName] = useState('')
  const [subjectColor, setSubjectColor] = useState(SUBJECT_COLORS[0])
  const [subjectTargetHours, setSubjectTargetHours] = useState('')

  // Timer state
  const [timerState, setTimerState] = useState<'idle' | 'focus' | 'break'>('idle')
  const [timerSeconds, setTimerSeconds] = useState(FOCUS_DURATION)
  const [selectedSubject, setSelectedSubject] = useState('')
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/study/sessions')
      if (res.ok) setSessions(await res.json())
    } catch { /* silently fail */ }
  }, [])

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await fetch('/api/study/subjects')
      if (res.ok) setSubjects(await res.json())
    } catch { /* silently fail */ }
  }, [])

  useEffect(() => {
    Promise.all([fetchSessions(), fetchSubjects()]).finally(() => setLoading(false))
  }, [fetchSessions, fetchSubjects])

  // Timer effect
  useEffect(() => {
    if (timerState === 'idle') {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          intervalRef.current = null

          if (timerState === 'focus') {
            setCompletedPomodoros(p => p + 1)
            toast.success('انتهى وقت التركيز! خذ استراحة')
            setTimerState('break')
            return BREAK_DURATION
          } else {
            toast.success('انتهت الاستراحة!')
            setTimerState('idle')
            return FOCUS_DURATION
          }
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [timerState])

  // Summary calculations
  const today = new Date().toISOString().split('T')[0]
  const todayStartOfWeek = useMemo(() => {
    const d = new Date()
    const day = d.getDay()
    const diff = day === 0 ? 6 : day - 1 // Monday=0
    const monday = new Date(d)
    monday.setDate(d.getDate() - diff)
    return monday.toISOString().split('T')[0]
  }, [])

  const todaySessions = useMemo(() =>
    sessions.filter(s => s.date && s.date.startsWith(today)),
    [sessions, today]
  )

  const weekSessions = useMemo(() =>
    sessions.filter(s => {
      if (!s.date) return false
      const sessionDate = new Date(s.date)
      const monday = new Date(todayStartOfWeek)
      return sessionDate >= monday && sessionDate <= new Date()
    }),
    [sessions, todayStartOfWeek]
  )

  const todayHours = useMemo(() =>
    todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60,
    [todaySessions]
  )

  const weekHours = useMemo(() =>
    weekSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60,
    [weekSessions]
  )

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const totalTime = timerState === 'focus' ? FOCUS_DURATION : timerState === 'break' ? BREAK_DURATION : FOCUS_DURATION
  const progress = ((totalTime - timerSeconds) / totalTime) * 100
  const circumference = 2 * Math.PI * 95
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const startTimer = () => {
    if (!selectedSubject && subjects.length > 0) {
      setSelectedSubject(subjects[0].name)
    }
    setTimerState('focus')
  }

  const pauseTimer = () => setTimerState('idle')
  const resetTimer = () => {
    setTimerState('idle')
    setTimerSeconds(FOCUS_DURATION)
  }

  const startBreak = () => {
    setTimerState('break')
    setTimerSeconds(BREAK_DURATION)
  }

  const saveSession = async () => {
    if (completedPomodoros === 0) return
    try {
      const totalMinutes = completedPomodoros * 25
      await fetch('/api/study/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: selectedSubject || 'بدون مادة',
          duration: totalMinutes,
          pomodoros: completedPomodoros,
        }),
      })
      toast.success(`تم حفظ ${completedPomodoros} جلسة بومودورو`)
      setCompletedPomodoros(0)
      fetchSessions()
    } catch {
      toast.error('حدث خطأ أثناء الحفظ')
    }
  }

  // Add session modal submit
  const handleAddSession = async () => {
    if (!sessionSubject.trim() || !sessionDuration) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/study/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: sessionSubject.trim(),
          duration: parseInt(sessionDuration) || 0,
          pomodoros: parseInt(sessionPomodoros) || 0,
        }),
      })
      if (res.ok) {
        toast.success('تم إضافة الجلسة')
        setShowSessionModal(false)
        setSessionSubject('')
        setSessionDuration('')
        setSessionPomodoros('')
        fetchSessions()
      }
    } catch {
      toast.error('حدث خطأ')
    } finally {
      setSubmitting(false)
    }
  }

  // Subject management
  const handleAddSubject = async () => {
    if (!subjectName.trim()) return
    try {
      const res = await fetch('/api/study/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: subjectName.trim(),
          color: subjectColor,
          targetHours: parseInt(subjectTargetHours) || 0,
        }),
      })
      if (res.ok) {
        toast.success('تم إضافة المادة')
        setShowSubjectModal(false)
        setSubjectName('')
        setSubjectTargetHours('')
        fetchSubjects()
      }
    } catch {
      toast.error('حدث خطأ')
    }
  }

  const deleteSubject = async (id: string) => {
    try {
      await fetch(`/api/study/subjects?id=${id}`, { method: 'DELETE' })
      toast.success('تم حذف المادة')
      setSubjects(prev => prev.filter(s => s.id !== id))
    } catch {
      toast.error('حدث خطأ')
    }
  }

  // Subject hours from sessions
  const subjectHours = useMemo(() => {
    const map: Record<string, number> = {}
    sessions.forEach(s => {
      if (s.subjectName) {
        map[s.subjectName] = (map[s.subjectName] || 0) + (s.duration || 0) / 60
      }
    })
    return map
  }, [sessions])

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-white">الدراسة</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => {
          setSessionSubject('')
          setSessionDuration('')
          setSessionPomodoros('')
          setShowSessionModal(true)
        }}>
          <Plus className="w-4 h-4" />
          جلسة جديدة
        </button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-violet-400" />
            </div>
            <p className="text-xs text-gray-500">ساعات اليوم</p>
          </div>
          <p className="text-2xl font-bold text-white">{todayHours.toFixed(1)} <span className="text-sm text-gray-500">ساعة</span></p>
        </div>
        <div className="glass p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Timer className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-xs text-gray-500">ساعات الأسبوع</p>
          </div>
          <p className="text-2xl font-bold text-white">{weekHours.toFixed(1)} <span className="text-sm text-gray-500">ساعة</span></p>
        </div>
        <div className="glass p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs text-gray-500">جلسات اليوم</p>
          </div>
          <p className="text-2xl font-bold text-white">{todaySessions.length} <span className="text-sm text-gray-500">جلسة</span></p>
        </div>
      </motion.div>

      {/* Pomodoro Timer */}
      <motion.div variants={itemVariants} className="glass-accent p-6">
        {/* Subject selector */}
        <div className="mb-5">
          <select
            className="input"
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
          >
            <option value="">اختر مادة...</option>
            {subjects.map(s => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
            <option value="أخرى">أخرى</option>
          </select>
        </div>

        {/* Timer Ring */}
        <div className="flex flex-col items-center">
          <div className="relative w-52 h-52 mb-5">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              {/* Background ring */}
              <circle
                cx="100" cy="100" r="95"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="8"
              />
              {/* Progress ring */}
              <circle
                cx="100" cy="100" r="95"
                fill="none"
                stroke={timerState === 'break' ? '#10B981' : '#8B5CF6'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            {/* Timer text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn(
                'text-5xl font-mono font-bold',
                timerState === 'break' ? 'text-emerald-400' : 'text-white'
              )}>
                {formatTime(timerSeconds)}
              </span>
              <span className="text-xs text-gray-500 mt-1">
                {timerState === 'idle' ? 'جاهز' : timerState === 'focus' ? 'تركيز' : 'استراحة'}
              </span>
            </div>
          </div>

          {/* Completed Pomodoros */}
          {completedPomodoros > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-gray-400">{completedPomodoros} جلسة مكتملة</span>
              <button
                className="btn-primary text-xs py-1.5 px-3"
                onClick={saveSession}
              >
                حفظ
              </button>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button className="btn-icon" onClick={resetTimer} title="إعادة">
              <RotateCcw className="w-4 h-4" />
            </button>

            {timerState === 'idle' ? (
              <button className="btn-primary flex items-center gap-2 px-8" onClick={startTimer}>
                <Play className="w-4 h-4" />
                ابدأ
              </button>
            ) : (
              <button className="btn-secondary flex items-center gap-2 px-8" onClick={pauseTimer}>
                <Pause className="w-4 h-4" />
                إيقاف مؤقت
              </button>
            )}

            {timerState === 'focus' && (
              <button className="btn-secondary flex items-center gap-2" onClick={startBreak}>
                <Coffee className="w-4 h-4" />
                استراحة
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Today's Sessions */}
      <motion.div variants={itemVariants} className="glass p-5">
        <h3 className="text-base font-semibold text-white mb-4">جلسات اليوم</h3>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
        ) : todaySessions.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">لا توجد جلسات دراسية اليوم</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {todaySessions.map((session, i) => {
              const sub = subjects.find(s => s.name === session.subjectName)
              const color = sub?.color || '#8B5CF6'
              const hours = Math.floor(session.duration / 60)
              const mins = session.duration % 60
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: i * 0.05 } }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors"
                  style={{ borderRight: `3px solid ${color}` }}
                >
                  <div className="flex-1">
                    <span className="text-sm font-medium text-white">{session.subjectName}</span>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {hours > 0 ? `${hours}س ${mins > 0 ? `${mins}د` : ''}` : `${mins}د`}
                      </span>
                      {session.pomodoros > 0 && (
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {session.pomodoros} بومودورو
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Subjects Management */}
      <motion.div variants={itemVariants} className="glass p-5">
        <button
          className="flex items-center justify-between w-full"
          onClick={() => setShowSubjects(!showSubjects)}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gray-400" />
            <h3 className="text-base font-semibold text-white">إدارة المواد</h3>
            <span className="badge badge-violet">{subjects.length}</span>
          </div>
          {showSubjects
            ? <ChevronUp className="w-4 h-4 text-gray-500" />
            : <ChevronDown className="w-4 h-4 text-gray-500" />
          }
        </button>

        <AnimatePresence>
          {showSubjects && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3">
                {subjects.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">لا توجد مواد بعد</p>
                ) : (
                  subjects.map(sub => {
                    const hours = subjectHours[sub.name] || 0
                    const pct = sub.targetHours > 0 ? Math.min(100, (hours / sub.targetHours) * 100) : 0
                    return (
                      <div key={sub.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors group">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-white truncate">{sub.name}</span>
                            <span className="text-xs text-gray-500">{hours.toFixed(1)} / {sub.targetHours} ساعة</span>
                          </div>
                          {sub.targetHours > 0 && (
                            <div className="progress-bar">
                              <motion.div
                                className="progress-bar-fill"
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.5 }}
                                style={{ backgroundColor: sub.color }}
                              />
                            </div>
                          )}
                        </div>
                        <button
                          className="btn-icon opacity-0 group-hover:opacity-100 transition-opacity text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 shrink-0 w-8 h-8"
                          onClick={() => deleteSubject(sub.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  })
                )}

                <button
                  className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
                  onClick={() => {
                    setSubjectName('')
                    setSubjectTargetHours('')
                    setSubjectColor(SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)])
                    setShowSubjectModal(true)
                  }}
                >
                  <Plus className="w-4 h-4" />
                  إضافة مادة
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Add Session Modal */}
      {showSessionModal && (
        <div className="modal-overlay" onClick={() => setShowSessionModal(false)}>
          <motion.div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-lg font-bold text-white mb-4">جلسة جديدة</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">اسم المادة</label>
                <input
                  className="input"
                  placeholder="مثال: الرياضيات"
                  value={sessionSubject}
                  onChange={e => setSessionSubject(e.target.value)}
                  autoFocus
                  list="subjects-list"
                />
                <datalist id="subjects-list">
                  {subjects.map(s => (
                    <option key={s.id} value={s.name} />
                  ))}
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">المدة (دقائق)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="0"
                    value={sessionDuration}
                    onChange={e => setSessionDuration(e.target.value)}
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">عدد البومودورو</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="0"
                    value={sessionPomodoros}
                    onChange={e => setSessionPomodoros(e.target.value)}
                    min="0"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                className="btn-primary flex-1"
                onClick={handleAddSession}
                disabled={!sessionSubject.trim() || submitting}
              >
                {submitting ? 'جارٍ الإضافة...' : 'إضافة الجلسة'}
              </button>
              <button className="btn-secondary" onClick={() => setShowSessionModal(false)}>إلغاء</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showSubjectModal && (
        <div className="modal-overlay" onClick={() => setShowSubjectModal(false)}>
          <motion.div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-lg font-bold text-white mb-4">مادة جديدة</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">اسم المادة</label>
                <input
                  className="input"
                  placeholder="مثال: الفيزياء"
                  value={subjectName}
                  onChange={e => setSubjectName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">اللون</label>
                <div className="flex flex-wrap gap-2">
                  {SUBJECT_COLORS.map(c => (
                    <button
                      key={c}
                      className={cn(
                        'w-7 h-7 rounded-full transition-all',
                        subjectColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110' : 'hover:scale-110'
                      )}
                      style={{ backgroundColor: c }}
                      onClick={() => setSubjectColor(c)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">الهدف (ساعات)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="0"
                  value={subjectTargetHours}
                  onChange={e => setSubjectTargetHours(e.target.value)}
                  min="0"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                className="btn-primary flex-1"
                onClick={handleAddSubject}
                disabled={!subjectName.trim()}
              >
                إضافة المادة
              </button>
              <button className="btn-secondary" onClick={() => setShowSubjectModal(false)}>إلغاء</button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
