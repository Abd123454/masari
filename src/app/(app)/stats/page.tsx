'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CheckSquare,
  Repeat,
  BookOpen,
  Library,
  TrendingUp,
  Flame,
  Brain,
  Target,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'

interface StatsData {
  tasksCompleted: number
  tasksCompletedThisMonth: number
  tasksPending: number
  habitCompletionRate: number
  totalStudyHours: number
  booksCompleted: number
  weeklyActivity: { day: string; score: number; tasks: number; habits: number; study: number }[]
  topHabits: { name: string; icon: string; color: string; rate: number; completions: number }[]
  monthlySummary: {
    tasksCompleted: number
    studyHours: number
    journalEntries: number
    fitnessMinutes: number
    goalsCompleted: number
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-white text-sm font-semibold mb-1">{label}</p>
      <p className="text-violet-400 text-sm">النشاط: {payload[0].value}</p>
    </div>
  )
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data) => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const summaryCards = [
    {
      label: 'مهام مكتملة',
      value: stats?.tasksCompleted || 0,
      icon: CheckSquare,
      color: 'violet',
      bg: 'bg-violet-500/10',
      iconColor: 'text-violet-400',
      border: 'border-violet-500/15',
    },
    {
      label: 'معدل العادات',
      value: `${stats?.habitCompletionRate || 0}%`,
      icon: Repeat,
      color: 'emerald',
      bg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
      border: 'border-emerald-500/15',
    },
    {
      label: 'ساعات الدراسة',
      value: stats?.totalStudyHours || 0,
      icon: BookOpen,
      color: 'amber',
      bg: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
      border: 'border-amber-500/15',
    },
    {
      label: 'كتب مكتملة',
      value: stats?.booksCompleted || 0,
      icon: Library,
      color: 'blue',
      bg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      border: 'border-blue-500/15',
    },
  ]

  const monthlyItems = [
    { label: 'مهام مكتملة', value: stats?.monthlySummary?.tasksCompleted || 0, icon: CheckSquare, color: 'text-violet-400' },
    { label: 'ساعات دراسة', value: stats?.monthlySummary?.studyHours || 0, icon: BookOpen, color: 'text-amber-400' },
    { label: 'مقالات يوميات', value: stats?.monthlySummary?.journalEntries || 0, icon: Brain, color: 'text-blue-400' },
    { label: 'دقائق لياقة', value: stats?.monthlySummary?.fitnessMinutes || 0, icon: Flame, color: 'text-rose-400' },
    { label: 'أهداف مكتملة', value: stats?.monthlySummary?.goalsCompleted || 0, icon: Target, color: 'text-emerald-400' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-violet-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">الإحصائيات</h1>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, i) => {
            const Icon = card.icon
            return (
              <motion.div key={i} variants={itemVariants} className="glass p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{loading ? '--' : card.value}</p>
                <p className="text-sm text-gray-400 mt-1">{card.label}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Weekly Activity Chart */}
        <motion.div variants={itemVariants} className="glass p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-400" />
            النشاط الأسبوعي
          </h2>
          {loading ? (
            <div className="h-[250px] flex items-center justify-center">
              <div className="w-full max-w-md space-y-3">
                <div className="skeleton h-4 w-3/4 mx-auto" />
                <div className="skeleton h-[200px] w-full" />
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={stats?.weeklyActivity || []}>
                <defs>
                  <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  fill="url(#activityGradient)"
                  dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 2, stroke: '#1a1a2e' }}
                  activeDot={{ r: 6, fill: '#8B5CF6', strokeWidth: 2, stroke: '#8B5CF6' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Two Column: Top Habits + Monthly Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Habits */}
          <motion.div variants={itemVariants} className="glass p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              أفضل العادات
            </h2>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="skeleton h-4 w-24" />
                    <div className="flex-1 skeleton h-2" />
                    <div className="skeleton h-5 w-12" />
                  </div>
                ))}
              </div>
            ) : stats?.topHabits && stats.topHabits.length > 0 ? (
              <div className="space-y-4">
                {stats.topHabits.map((habit, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-24 truncate text-sm text-gray-300">
                      <span className="text-gray-500 ml-1">{habit.icon}</span>
                      {habit.name}
                    </div>
                    <div className="flex-1 progress-bar">
                      <motion.div
                        className="progress-bar-fill bg-gradient-to-l from-violet-500 to-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${habit.rate}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                      />
                    </div>
                    <span className="badge badge-violet text-xs min-w-[40px] text-center">
                      {habit.rate}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Repeat className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">لا توجد عادات بعد</p>
              </div>
            )}
          </motion.div>

          {/* Monthly Summary */}
          <motion.div variants={itemVariants} className="glass p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              الملخص الشهري
            </h2>
            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="skeleton h-16 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {monthlyItems.map((item, i) => {
                  const Icon = item.icon
                  return (
                    <motion.div
                      key={i}
                      variants={itemVariants}
                      className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.04]"
                    >
                      <Icon className={`w-5 h-5 ${item.color} mb-2`} />
                      <p className="text-xl font-bold text-white">{item.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
