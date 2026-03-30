'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Droplets, Plus, Minus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface WaterLog {
  id: string
  glasses: number
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
const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

function formatDateArabic(date: Date) {
  const dayName = arabicDays[date.getDay()]
  const day = date.getDate()
  const month = arabicMonths[date.getMonth()]
  const year = date.getFullYear()
  return `${dayName}، ${day} ${month} ${year}`
}

export default function WaterPage() {
  const [logs, setLogs] = useState<WaterLog[]>([])
  const [glasses, setGlasses] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/water')
      if (res.ok) {
        const data = await res.json()
        setLogs(data)
        // Find today's log
        const todayStr = new Date().toISOString().split('T')[0]
        const todayLog = data.find((l: WaterLog) => l.date.startsWith(todayStr))
        if (todayLog) setGlasses(todayLog.glasses)
      }
    } catch {}
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/water')
        if (res.ok) {
          const data = await res.json()
          if (mounted) setLogs(data)
          const todayStr = new Date().toISOString().split('T')[0]
          const todayLog = data.find((l: WaterLog) => l.date.startsWith(todayStr))
          if (todayLog && mounted) setGlasses(todayLog.glasses)
        }
      } catch {}
      if (mounted) setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const saveGlasses = async (count: number) => {
    setSaving(true)
    try {
      const res = await fetch('/api/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ glasses: count }),
      })
      if (res.ok) {
        fetchLogs()
        if (count >= 8) {
          toast.success('أحسنت! حققت هدفك اليومي')
        }
      }
    } catch {}
    setSaving(false)
  }

  const handleIncrement = () => {
    const newCount = Math.min(glasses + 1, 20)
    setGlasses(newCount)
    saveGlasses(newCount)
  }

  const handleDecrement = () => {
    const newCount = Math.max(glasses - 1, 0)
    setGlasses(newCount)
    saveGlasses(newCount)
  }

  // Weekly history
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
      const log = logs.find(l => l.date.startsWith(dateStr))
      return {
        day: arabicDays[i],
        count: log?.glasses || 0,
        isToday: i === dayOfWeek,
      }
    })
  }, [logs])

  if (loading) {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        {[1, 2].map(i => (
          <div key={i} className="glass-accent p-8">
            <div className="skeleton h-16 w-32 mx-auto rounded-lg" />
            <div className="skeleton h-4 w-24 mx-auto rounded-lg mt-4" />
          </div>
        ))}
      </motion.div>
    )
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Droplets className="w-7 h-7 text-blue-400" />
          تتبع الماء
        </h1>
      </motion.div>

      {/* Main Display */}
      <motion.div variants={itemVariants} className="glass-accent p-8 text-center">
        <p className="text-gray-500 text-sm mb-4">{formatDateArabic(new Date())}</p>

        <motion.div
          key={glasses}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="text-6xl font-bold text-white mb-1"
        >
          {glasses}
        </motion.div>
        <p className="text-gray-400 text-lg mb-6">/8 أكواب</p>

        {/* Water drop icons */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {Array.from({ length: 8 }, (_, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{
                opacity: i < glasses ? 1 : 0.2,
                scale: i < glasses ? 1 : 0.85,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Droplets
                className={cn(
                  'w-6 h-6',
                  i < glasses ? 'text-blue-400 fill-blue-400' : 'text-gray-600'
                )}
              />
            </motion.div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="progress-bar mb-6 max-w-xs mx-auto">
          <motion.div
            className="progress-bar-fill bg-gradient-to-l from-blue-500 to-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((glasses / 8) * 100, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleIncrement}
            disabled={saving}
            className="btn-primary w-14 h-14 rounded-2xl flex items-center justify-center p-0"
          >
            <Plus className="w-6 h-6" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleDecrement}
            disabled={glasses <= 0 || saving}
            className={cn(
              'btn-secondary w-14 h-14 rounded-2xl flex items-center justify-center p-0',
              glasses <= 0 && 'opacity-40 cursor-not-allowed'
            )}
          >
            <Minus className="w-6 h-6" />
          </motion.button>
        </div>
      </motion.div>

      {/* Weekly History */}
      <motion.div variants={itemVariants} className="glass p-4">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-400" />
          سجل الأسبوع
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {weeklyData.map(day => (
            <div
              key={day.day}
              className={cn(
                'text-center p-2 rounded-xl transition-colors',
                day.isToday
                  ? 'bg-violet-500/10 border border-violet-500/20'
                  : 'bg-white/[0.02]'
              )}
            >
              <div className={cn(
                'text-xs mb-1',
                day.isToday ? 'text-violet-400 font-semibold' : 'text-gray-500'
              )}>
                {day.day}
              </div>
              <div className={cn(
                'text-lg font-bold',
                day.isToday ? 'text-white' : 'text-gray-400'
              )}>
                {day.count}
              </div>
              <div className="flex justify-center mt-1">
                {day.count > 0 && (
                  <Droplets className="w-3 h-3 text-blue-400 fill-blue-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
