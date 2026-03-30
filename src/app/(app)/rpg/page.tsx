'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Shield,
  Sword,
  Wand2,
  Heart,
  Zap,
  Lock,
  Star,
  Loader2,
} from 'lucide-react'

interface RPGProfile {
  id: string
  level: number
  xp: number
  className: string
  maxHp: number
  currentHp: number
  strength: number
  intelligence: number
  wisdom: number
  xpNeeded: number
}

const CLASS_MAP: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  Warrior: { label: 'محارب', icon: Sword, color: 'text-rose-400' },
  Mage: { label: 'ساحر', icon: Wand2, color: 'text-violet-400' },
  Healer: { label: 'طبيب', icon: Heart, color: 'text-emerald-400' },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function RPGPage() {
  const [profile, setProfile] = useState<RPGProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [xpLoading, setXpLoading] = useState(false)
  const [classLoading, setClassLoading] = useState(false)
  const [showLevelUp, setShowLevelUp] = useState(false)

  const fetchProfile = () => {
    fetch('/api/rpg/profile')
      .then((r) => r.json())
      .then((data) => {
        setProfile(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const addXP = async () => {
    setXpLoading(true)
    try {
      const res = await fetch('/api/rpg/profile/xp', { method: 'POST' })
      const data = await res.json()
      setProfile(data)
      if (data.leveledUp) {
        setShowLevelUp(true)
        toast.success(`مستوى جديد! المستوى ${data.level}`)
        setTimeout(() => setShowLevelUp(false), 3000)
      } else {
        toast.success(`+${data.xpAdded} خبرة`)
      }
    } catch {
      toast.error('حدث خطأ')
    } finally {
      setXpLoading(false)
    }
  }

  const changeClass = async () => {
    setClassLoading(true)
    try {
      const res = await fetch('/api/rpg/profile/class', { method: 'POST' })
      const data = await res.json()
      setProfile(data)
      const cls = CLASS_MAP[data.className]
      toast.success(`تم التغيير إلى ${cls?.label || data.className}`)
    } catch {
      toast.error('حدث خطأ')
    } finally {
      setClassLoading(false)
    }
  }

  const classInfo = profile ? CLASS_MAP[profile.className] || CLASS_MAP.Warrior : CLASS_MAP.Warrior
  const ClassIcon = classInfo.icon
  const xpProgress = profile ? (profile.xp / profile.xpNeeded) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Level Up Overlay */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLevelUp(false)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className="glass-accent p-8 text-center max-w-sm mx-4"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                <Star className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-2">ترقية!</h2>
              <p className="text-xl text-violet-400 font-bold mb-1">المستوى {profile?.level}</p>
              <p className="text-gray-400 text-sm">تهانينا! لقد وصلت إلى مستوى جديد</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-violet-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">الشخصية</h1>
      </motion.div>

      {loading ? (
        <div className="space-y-6">
          <div className="skeleton h-72 rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          {/* Character Card */}
          <motion.div variants={itemVariants} className="glass-accent p-8 flex flex-col items-center">
            {/* Avatar */}
            <motion.div
              className="w-28 h-28 rounded-full flex items-center justify-center mb-4 bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-500 shadow-lg shadow-violet-500/20"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <ClassIcon className="w-14 h-14 text-white" />
            </motion.div>

            {/* Name */}
            <h2 className="text-xl font-bold text-white mb-2">البطل</h2>

            {/* Level Badge */}
            <div className="badge badge-violet text-sm mb-4">
              المستوى {profile?.level || 1}
            </div>

            {/* XP Bar */}
            <div className="w-full max-w-xs mb-2">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>خبرة</span>
                <span>{profile?.xp?.toLocaleString() || 0} / {profile?.xpNeeded?.toLocaleString() || 0} XP</span>
              </div>
              <div className="progress-bar h-2">
                <motion.div
                  className="progress-bar-fill bg-gradient-to-l from-violet-500 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Class Badge */}
            <div className={`flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10`}>
              <ClassIcon className={`w-5 h-5 ${classInfo.color}`} />
              <span className={`font-semibold ${classInfo.color}`}>{classInfo.label}</span>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* HP */}
            <motion.div variants={itemVariants} className="glass p-4">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-rose-400" />
                <span className="text-sm text-gray-400">HP</span>
              </div>
              <p className="text-lg font-bold text-white mb-2">{profile?.currentHp || 0} / {profile?.maxHp || 0}</p>
              <div className="progress-bar h-1.5">
                <motion.div
                  className="progress-bar-fill bg-gradient-to-l from-rose-500 to-red-500"
                  initial={{ width: 0 }}
                  animate={{ width: profile ? (profile.currentHp / profile.maxHp) * 100 : 0 }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </motion.div>

            {/* STR */}
            <motion.div variants={itemVariants} className="glass p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sword className="w-4 h-4 text-rose-400" />
                <span className="text-sm text-gray-400">القوة</span>
              </div>
              <p className="text-lg font-bold text-white">{profile?.strength || 0}</p>
              <p className="text-xs text-gray-500">STR</p>
            </motion.div>

            {/* INT */}
            <motion.div variants={itemVariants} className="glass p-4">
              <div className="flex items-center gap-2 mb-3">
                <Wand2 className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-400">الذكاء</span>
              </div>
              <p className="text-lg font-bold text-white">{profile?.intelligence || 0}</p>
              <p className="text-xs text-gray-500">INT</p>
            </motion.div>

            {/* WIS */}
            <motion.div variants={itemVariants} className="glass p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-gray-400">الحكمة</span>
              </div>
              <p className="text-lg font-bold text-white">{profile?.wisdom || 0}</p>
              <p className="text-xs text-gray-500">WIS</p>
            </motion.div>
          </div>

          {/* Actions */}
          <motion.div variants={itemVariants} className="glass p-6">
            <h2 className="text-lg font-bold text-white mb-4">إجراءات</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={changeClass}
                disabled={classLoading}
                className="btn-secondary flex items-center gap-2"
              >
                {classLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 text-amber-400" />
                )}
                تغيير الفئة
              </button>
              <button
                onClick={addXP}
                disabled={xpLoading}
                className="btn-primary flex items-center gap-2"
              >
                {xpLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Star className="w-4 h-4" />
                )}
                كسب خبرة
              </button>
            </div>
          </motion.div>

          {/* Quests */}
          <motion.div variants={itemVariants} className="glass p-6">
            <h2 className="text-lg font-bold text-white mb-4">المهام</h2>
            <div className="space-y-3">
              {[
                { title: 'أكمل 10 مهام', reward: '100 XP', icon: CheckSquareIcon },
                { title: 'ادرس لمدة 5 ساعات', reward: '150 XP', icon: BookOpenIcon },
                { title: 'أكمل عاداتك لمدة أسبوع', reward: '200 XP', icon: RepeatIcon },
              ].map((quest, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-400 text-sm">{quest.title}</p>
                    <p className="text-gray-500 text-xs">المكافأة: {quest.reward}</p>
                  </div>
                  <span className="text-gray-600 text-xs">قريباً</span>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-500 text-sm mt-4">المهام المتاحة قريباً</p>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

// Placeholder icon components for quests
function CheckSquareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function BookOpenIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

function RepeatIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  )
}
