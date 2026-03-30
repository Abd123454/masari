'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Trophy,
  Lock,
  CheckCircle2,
  HelpCircle,
  Target,
  Flame,
  BookOpen,
  Star,
  Zap,
  Crown,
  Shield,
  Heart,
  Brain,
  GraduationCap,
  Award,
  Loader2,
} from 'lucide-react'

interface AchievementData {
  id: string
  name: string
  description: string
  icon: string
  category: string
  isHidden: boolean
  unlocked: boolean
  unlockedAt: string | null
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  tasks: CheckCircle2,
  habits: Repeat,
  study: BookOpen,
  reading: BookOpen,
  general: Star,
  special: Crown,
}

const ICON_MAP: Record<string, React.ElementType> = {
  '🏆': Trophy,
  '🎯': Target,
  '🔥': Flame,
  '📚': BookOpen,
  '⭐': Star,
  '⚡': Zap,
  '👑': Crown,
  '🛡️': Shield,
  '❤️': Heart,
  '🧠': Brain,
  '🎓': GraduationCap,
  '🏅': Award,
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  tasks: { bg: 'bg-violet-500/10', border: 'border-violet-500/15', text: 'text-violet-400' },
  habits: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/15', text: 'text-emerald-400' },
  study: { bg: 'bg-blue-500/10', border: 'border-blue-500/15', text: 'text-blue-400' },
  reading: { bg: 'bg-amber-500/10', border: 'border-amber-500/15', text: 'text-amber-400' },
  general: { bg: 'bg-violet-500/10', border: 'border-violet-500/15', text: 'text-violet-400' },
  special: { bg: 'bg-amber-500/10', border: 'border-amber-500/15', text: 'text-amber-400' },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

function Repeat(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  )
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/achievements')
      .then((r) => r.json())
      .then((data) => {
        setAchievements(data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const totalCount = achievements.filter((a) => !a.isHidden).length
  const progress = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">الإنجازات</h1>
      </motion.div>

      {/* Progress Bar */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">
              {unlockedCount} من {totalCount} إنجاز مفتوح
            </span>
            <span className="text-sm font-bold text-violet-400">{progress}%</span>
          </div>
          <div className="progress-bar h-2">
            <motion.div
              className="progress-bar-fill bg-gradient-to-l from-violet-500 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
        </motion.div>
      )}

      {/* Achievement Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-36 rounded-2xl" />
          ))}
        </div>
      ) : achievements.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass p-12 text-center"
        >
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg font-semibold mb-1">ابدأ بإنجاز إنجازاتك</p>
          <p className="text-gray-500 text-sm">استخدم التطبيق لفتح الإنجازات</p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
        >
          {achievements.map((achievement) => {
            const colors = CATEGORY_COLORS[achievement.category] || CATEGORY_COLORS.general
            const LucideIcon = ICON_MAP[achievement.icon] || Star

            // Hidden achievement
            if (achievement.isHidden && !achievement.unlocked) {
              return (
                <motion.div
                  key={achievement.id}
                  variants={itemVariants}
                  className="glass p-5 opacity-30 relative"
                >
                  <div className="absolute top-3 left-3">
                    <Lock className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gray-500/10 flex items-center justify-center mb-3">
                    <HelpCircle className="w-6 h-6 text-gray-600" />
                  </div>
                  <p className="text-gray-500 font-semibold text-sm">إنجاز مخفي</p>
                  <p className="text-gray-600 text-xs mt-1">????</p>
                </motion.div>
              )
            }

            // Locked achievement
            if (!achievement.unlocked) {
              return (
                <motion.div
                  key={achievement.id}
                  variants={itemVariants}
                  className="glass p-5 opacity-50 relative"
                >
                  <div className="absolute top-3 left-3">
                    <Lock className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gray-500/10 flex items-center justify-center mb-3">
                    <LucideIcon className="w-6 h-6 text-gray-500" />
                  </div>
                  <p className="text-gray-400 font-semibold text-sm">{achievement.name}</p>
                  <p className="text-gray-500 text-xs mt-1">{achievement.description}</p>
                </motion.div>
              )
            }

            // Unlocked achievement
            return (
              <motion.div
                key={achievement.id}
                variants={itemVariants}
                className="glass glass-hover p-5 relative"
              >
                <div className="absolute top-3 left-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center mb-3 border ${colors.border}`}>
                  <LucideIcon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <p className="text-white font-semibold text-sm">{achievement.name}</p>
                <p className="text-gray-400 text-xs mt-1">{achievement.description}</p>
                {achievement.unlockedAt && (
                  <p className="text-emerald-500/60 text-[10px] mt-2">
                    تم الفتح: {formatDate(achievement.unlockedAt)}
                  </p>
                )}
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
