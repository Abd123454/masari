'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  CheckSquare,
  Repeat,
  Droplets,
  BookOpen,
  Clock,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Circle,
  CheckCircle2,
  Loader2,
  Flame,
  Heart,
  Dumbbell,
  Star,
  Moon,
  Sun,
  BookMarked,
  Languages,
  Smile,
  SmilePlus,
  Meh,
  Frown,
  Angry,
} from 'lucide-react'

/* ─── Habit Icon Map ─── */
const habitIconMap: Record<string, React.ElementType> = {
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
}

/* ─── Mood Options ─── */
const moodOptions = [
  { key: 'happy', label: 'سعيد', icon: Smile, color: '#10B981', bgClass: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' },
  { key: 'good', label: 'جيد', icon: SmilePlus, color: '#3B82F6', bgClass: 'bg-blue-500/15 border-blue-500/30 text-blue-400' },
  { key: 'neutral', label: 'عادي', icon: Meh, color: '#F59E0B', bgClass: 'bg-amber-500/15 border-amber-500/30 text-amber-400' },
  { key: 'sad', label: 'حزين', icon: Frown, color: '#F97316', bgClass: 'bg-orange-500/15 border-orange-500/30 text-orange-400' },
  { key: 'terrible', label: 'سيء', icon: Angry, color: '#EF4444', bgClass: 'bg-rose-500/15 border-rose-500/30 text-rose-400' },
]
import { cn } from '@/lib/utils'

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

/* ─── Arabic Helpers ─── */
const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'صباح الخير'
  if (h < 17) return 'مساء الخير'
  return 'مساء الخير'
}

function getFormattedDate(): string {
  const d = new Date()
  return `${dayNames[d.getDay()]}، ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`
}

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const today = new Date()
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
}

function isThisWeek(dateStr: string | null): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 7)
  return d >= startOfWeek && d < endOfWeek
}

function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/* ─── Types ─── */
interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  dueTime: string | null
}

interface Habit {
  id: string
  name: string
  icon: string
  color: string
  completions: { id: string; date: string }[]
}

interface ChineseWord {
  id: string
  chinese: string
  pinyin: string
  arabic: string
  hskLevel: number
}

interface WaterLog {
  id: string
  glasses: number
  date: string
}

interface StudySession {
  id: string
  subjectName: string
  duration: number
  date: string
}

interface FinanceData {
  expenses: { id: string; amount: number; date: string; title: string }[]
  deposits: { id: string; amount: number; date: string; title: string }[]
}

/* ─── Motivational Quotes ─── */
const quotes = [
  { text: 'النجاح ليس نهائياً، والفشل ليس قاتلاً، لكن الشجاعة للاستمرار هي ما يهم', author: 'ونستون تشرشل' },
  { text: 'لا تنتظر الفرصة، بل اصنعها', author: 'جورج برنارد شو' },
  { text: 'الطريقة الوحيدة لعمل عظيم هي أن تحب ما تفعله', author: 'ستيف جوبز' },
  { text: 'ابدأ من حيث أنت. استخدم ما لديك. افعل ما يمكنك', author: 'آرثر آش' },
  { text: 'كل إنجاز عظيم كان في يوم من الأيام مستحيلاً', author: 'مجهول' },
  { text: 'التعليم هو أقوى سلاح يمكنك استخدامه لتغيير العالم', author: 'نيلسون مانديلا' },
  { text: 'لا تقارن نفسك بالآخرين، قارن نفسك بما كنت عليه بالأمس', author: 'جوردن بيترسون' },
  { text: 'العلم نور والجهل ظلام', author: 'مثل عربي' },
  { text: 'من جدّ وجد، ومن زرع حصد', author: 'مثل عربي' },
  { text: 'الصبر مفتاح الفرج', author: 'مثل عربي' },
  { text: 'إنما العلم بالتعلم وإنما الحلم بالتحلم', author: 'حديث شريف' },
  { text: 'لا يضيع جهد مهما كان صغيراً', author: 'مجهول' },
  { text: 'الطريق إلى الألف ميل يبدأ بخطوة واحدة', author: 'لاو تزو' },
  { text: 'كن أنت التغيير الذي تريد أن تراه في العالم', author: 'غاندي' },
  { text: 'المستقبل ملك لمن يؤمن بجمال أحلامهم', author: 'إليانور روزفلت' },
  { text: 'ليس المهم أن تبدأ بخطوة كبيرة، المهم أن تبدأ', author: 'مجهول' },
]

/* ─── Priority Helpers ─── */
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

export default function DashboardPage() {
  /* ─── State ─── */
  const [user, setUser] = useState<{ name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [chineseWord, setChineseWord] = useState<ChineseWord | null>(null)
  const [waterGlasses, setWaterGlasses] = useState(0)
  const [studyMinutes, setStudyMinutes] = useState(0)
  const [finance, setFinance] = useState<FinanceData>({ expenses: [], deposits: [] })
  const [chineseLoading, setChineseLoading] = useState(false)
  const [todayMood, setTodayMood] = useState<string | null>(null)

  const today = getTodayStr()
  const quoteIndex = new Date().getDate() % quotes.length
  const quote = quotes[quoteIndex]

  /* ─── Fetch Data ─── */
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const results = await Promise.allSettled([
        fetch('/api/user').then(r => r.json()),
        fetch('/api/tasks').then(r => r.json()),
        fetch('/api/habits').then(r => r.json()),
        fetch('/api/chinese/words?random=true').then(r => r.json()),
        fetch('/api/water').then(r => r.json()),
        fetch('/api/study/sessions').then(r => r.json()),
        fetch('/api/finance').then(r => r.json()),
        fetch('/api/mood').then(r => r.json()),
      ])

      if (cancelled) return

      if (results[0].status === 'fulfilled') {
        const u = results[0].value
        if (u.name) setUser({ name: u.name })
      }
      if (results[1].status === 'fulfilled') setTasks(results[1].value || [])
      if (results[2].status === 'fulfilled') setHabits(results[2].value || [])
      if (results[3].status === 'fulfilled') setChineseWord(results[3].value)
      if (results[4].status === 'fulfilled') {
        const waterLogs: WaterLog[] = results[4].value || []
        const todayLog = waterLogs.find(l => isToday(l.date))
        setWaterGlasses(todayLog?.glasses || 0)
      }
      if (results[5].status === 'fulfilled') {
        const sessions: StudySession[] = results[5].value || []
        const todaySessions = sessions.filter(s => isToday(s.date))
        setStudyMinutes(todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0))
      }
      if (results[6].status === 'fulfilled') setFinance(results[6].value || { expenses: [], deposits: [] })
      if (results[7].status === 'fulfilled') {
        const moodLogs = results[7].value || []
        const todayLog = moodLogs.find((l: { date: string; mood: string }) => isToday(l.date))
        setTodayMood(todayLog?.mood || null)
      }

      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  /* ─── Computed ─── */
  const pendingTasks = tasks.filter(t => t.status === 'pending')
  const todayTasks = pendingTasks.filter(t => isToday(t.dueDate) || isThisWeek(t.dueDate)).slice(0, 5)
  const todayCompletedHabits = habits.filter(h =>
    h.completions?.some(c => isToday(c.date))
  ).length
  const totalHabits = habits.length || 1

  // Finance for current month
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const monthExpenses = (finance.expenses || []).filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  }).reduce((s, e) => s + e.amount, 0)
  const monthDeposits = (finance.deposits || []).filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  }).reduce((s, e) => s + e.amount, 0)

  /* ─── Handlers ─── */
  const toggleTaskComplete = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    try {
      await fetch(`/api/tasks/${taskId}/complete`, { method: 'POST' })
    } catch {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: currentStatus } : t))
    }
  }

  const toggleHabitComplete = async (habitId: string, isCompleted: boolean) => {
    const newHabits = habits.map(h => {
      if (h.id !== habitId) return h
      const newCompletions = isCompleted
        ? h.completions.filter(c => !isToday(c.date))
        : [...h.completions, { id: `temp-${Date.now()}`, date: new Date().toISOString() }]
      return { ...h, completions: newCompletions }
    })
    setHabits(newHabits)
    try {
      await fetch(`/api/habits/${habitId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !isCompleted }),
      })
    } catch {
      setHabits(habits)
    }
  }

  const fetchNewChineseWord = async () => {
    setChineseLoading(true)
    try {
      const res = await fetch('/api/chinese/words?random=true')
      const data = await res.json()
      setChineseWord(data)
    } catch { /* ignore */ }
    setChineseLoading(false)
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* ─── Greeting ─── */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          {getGreeting()}،{' '}
          <span className="gradient-text">{user?.name || 'عبدالعزيز'}</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">{getFormattedDate()}</p>
      </motion.div>

      {/* ─── Stat Cards ─── */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="skeleton w-11 h-11 rounded-xl" />
                  <div className="flex-1">
                    <div className="skeleton h-7 w-12 mb-1" />
                    <div className="skeleton h-3 w-16" />
                  </div>
                </div>
                <div className="h-1 rounded-full bg-white/10">
                  <div className="skeleton h-1 w-full rounded-full" />
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {/* المهام */}
            <div className="card-glow bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:-translate-y-1 transition-all duration-200 cursor-default"
              style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <CheckSquare className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{pendingTasks.length}</p>
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider">المهام</p>
                </div>
              </div>
              <div className="h-1 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-violet-500 to-blue-500 transition-all duration-600"
                  style={{ width: `${Math.min(100, (pendingTasks.length / Math.max(tasks.length, 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* العادات */}
            <div className="card-glow bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:-translate-y-1 transition-all duration-200 cursor-default"
              style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Repeat className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{todayCompletedHabits}/{totalHabits}</p>
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider">العادات</p>
                </div>
              </div>
              <div className="h-1 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-teal-500 transition-all duration-600"
                  style={{ width: `${(todayCompletedHabits / totalHabits) * 100}%` }}
                />
              </div>
            </div>

            {/* الماء */}
            <div className="card-glow bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:-translate-y-1 transition-all duration-200 cursor-default"
              style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{waterGlasses}/8</p>
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider">الماء</p>
                </div>
              </div>
              <div className="h-1 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-blue-500 to-cyan-500 transition-all duration-600"
                  style={{ width: `${Math.min(100, (waterGlasses / 8) * 100)}%` }}
                />
              </div>
            </div>

            {/* الدراسة */}
            <div className="card-glow bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:-translate-y-1 transition-all duration-200 cursor-default"
              style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{studyMinutes}</p>
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider">دقائق الدراسة</p>
                </div>
              </div>
              <div className="h-1 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-amber-500 to-orange-500 transition-all duration-600"
                  style={{ width: `${Math.min(100, (studyMinutes / 120) * 100)}%` }}
                />
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* ─── Tasks + Habits Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <motion.div variants={itemVariants} className="card-glow glass p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-violet-400" />
              <h2 className="text-lg font-bold text-white">مهام اليوم</h2>
              {!loading && (
                <span className="badge badge-violet">{todayTasks.length}</span>
              )}
            </div>
            <Link
              href="/tasks"
              className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              عرض الكل
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="skeleton w-5 h-5 rounded-full shrink-0" />
                  <div className="flex-1">
                    <div className="skeleton h-4 w-3/4 mb-1" />
                    <div className="skeleton h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : todayTasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckSquare className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">لا توجد مهام لليوم</p>
            </div>
          ) : (
            <div className="space-y-1">
              {todayTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-white/[0.03] transition-colors group"
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTaskComplete(task.id, task.status)}
                    className="shrink-0"
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
                      'text-sm font-medium truncate',
                      task.status === 'completed' ? 'text-gray-500 line-through' : 'text-white'
                    )}>
                      {task.title}
                    </p>
                    {task.dueTime && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {task.dueTime}
                      </p>
                    )}
                  </div>

                  {/* Priority Badge */}
                  {task.priority && (
                    <span className={cn('badge', priorityBadgeClass[task.priority] || 'badge-violet')}>
                      {priorityLabels[task.priority] || task.priority}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Today's Habits */}
        <motion.div variants={itemVariants} className="card-glow glass p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Repeat className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">عادات اليوم</h2>
            </div>
            <Link
              href="/habits"
              className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              عرض الكل
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton w-8 h-8 rounded-lg" />
                  <div className="flex-1">
                    <div className="skeleton h-4 w-24 mb-1" />
                    <div className="flex gap-1">
                      {[1,2,3,4,5,6,7].map(j => (
                        <div key={j} className="skeleton w-2.5 h-2.5 rounded-full" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : habits.length === 0 ? (
            <div className="text-center py-8">
              <Repeat className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">لا توجد عادات بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {habits.map(habit => {
                const isCompletedToday = habit.completions?.some(c => isToday(c.date))
                // 7-day dots
                const weekDots = Array.from({ length: 7 }, (_, i) => {
                  const d = new Date()
                  d.setDate(d.getDate() - (6 - i))
                  const dateStr = d.toISOString().split('T')[0]
                  return habit.completions?.some(c =>
                    new Date(c.date).toISOString().split('T')[0] === dateStr
                  )
                })

                return (
                  <div
                    key={habit.id}
                    className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-white/[0.03] transition-colors"
                  >
                    {/* Icon */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                      style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
                    >
                      {(() => {
                        const HabitIcon = habitIconMap[habit.icon] || Flame
                        return <HabitIcon className="w-4 h-4" />
                      })()}
                    </div>

                    {/* Name + Dots */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-medium',
                        isCompletedToday ? 'text-gray-500 line-through' : 'text-white'
                      )}>
                        {habit.name}
                      </p>
                      <div className="flex gap-1.5 mt-1">
                        {weekDots.map((completed, i) => (
                          <div
                            key={i}
                            className={cn(
                              'w-2.5 h-2.5 rounded-full transition-colors',
                              completed ? 'bg-emerald-400' : 'bg-white/10'
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Toggle Button */}
                    <button
                      onClick={() => toggleHabitComplete(habit.id, !!isCompletedToday)}
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0',
                        isCompletedToday
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'border border-white/10 text-gray-500 hover:border-emerald-400/50 hover:text-emerald-400'
                      )}
                    >
                      {isCompletedToday ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* ─── Chinese Word + Finance Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chinese Word */}
        <motion.div variants={itemVariants} className="card-glow glass-accent p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-400">كلمة صينية</h3>
            <button
              onClick={fetchNewChineseWord}
              className="btn-icon"
              disabled={chineseLoading}
            >
              <RefreshCw className={cn('w-4 h-4', chineseLoading && 'animate-spin')} />
            </button>
          </div>

          {chineseLoading && !chineseWord ? (
            <div className="flex flex-col items-center py-6">
              <div className="skeleton w-20 h-20 rounded-xl mb-3" />
              <div className="skeleton h-4 w-24 mb-1" />
              <div className="skeleton h-4 w-32" />
            </div>
          ) : chineseWord ? (
            <div className="flex flex-col items-center py-2">
              <span className="text-5xl font-bold text-white mb-2">{chineseWord.chinese}</span>
              <span className="text-gray-400 text-sm mb-1">{chineseWord.pinyin}</span>
              <span className="text-white font-medium">{chineseWord.arabic}</span>
              {chineseWord.hskLevel && (
                <span className="badge badge-blue mt-2">HSK {chineseWord.hskLevel}</span>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <BookOpen className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">لا توجد كلمات محفوظة بعد</p>
            </div>
          )}
        </motion.div>

        {/* Finance Quick View */}
        <motion.div variants={itemVariants} className="card-glow glass p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-gray-400">نظرة مالية</h3>
            <Link
              href="/finance"
              className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              التفاصيل
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="skeleton h-12 w-full rounded-xl" />
              <div className="skeleton h-12 w-full rounded-xl" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Expenses */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">مصاريف الشهر</p>
                    <p className="text-lg font-bold text-rose-400">{monthExpenses.toFixed(0)} ر.س</p>
                  </div>
                </div>
              </div>

              {/* Deposits */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">إيرادات الشهر</p>
                    <p className="text-lg font-bold text-emerald-400">{monthDeposits.toFixed(0)} ر.س</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ─── Mood Section ─── */}
      <motion.div variants={itemVariants} className="card-glow glass p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Smile className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">المزاج</h2>
          </div>
          <Link
            href="/mood"
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            عرض الكل
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex items-center justify-center gap-3 sm:gap-4 py-2">
          {moodOptions.map(opt => {
            const MoodIcon = opt.icon
            const isSelected = todayMood === opt.key
            return (
              <button
                key={opt.key}
                onClick={async () => {
                  setTodayMood(opt.key)
                  try {
                    await fetch('/api/mood', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ mood: opt.key }),
                    })
                  } catch {
                    setTodayMood(todayMood)
                  }
                }}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all',
                  isSelected
                    ? `${opt.bgClass} scale-110 border`
                    : 'border-white/10 text-gray-500 hover:bg-white/5 hover:scale-105'
                )}
              >
                <MoodIcon className="w-6 h-6" />
                <span className="text-[10px] font-medium">{opt.label}</span>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* ─── Motivational Quote ─── */}
      <motion.div variants={itemVariants} className="card-glow glass-accent p-6">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-white text-lg font-medium leading-relaxed">
              &ldquo;{quote.text}&rdquo;
            </p>
            <p className="text-gray-400 text-sm mt-2">— {quote.author}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
