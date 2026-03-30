'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings,
  User,
  Palette,
  Database,
  Info,
  Check,
  Download,
  Trash2,
  Loader2,
  Save,
  Moon,
  Sun,
  Globe,
  Shield,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface UserData {
  id: string
  name: string
  email: string | null
  avatar: string | null
  createdAt: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [showClearModal, setShowClearModal] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [exporting, setExporting] = useState(false)

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/user')
      if (res.ok) {
        const data = await res.json()
        setUser(data)
        setName(data.name || '')
      }
    } catch {
      toast.error('حدث خطأ في جلب بيانات المستخدم')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const handleSaveName = async () => {
    if (!name.trim()) {
      toast.error('يرجى إدخال الاسم')
      return
    }

    setSavingName(true)
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (res.ok) {
        toast.success('تم حفظ الاسم بنجاح')
        setUser((prev) => (prev ? { ...prev, name: name.trim() } : prev))
      } else {
        toast.error('حدث خطأ في تحديث الاسم')
      }
    } catch {
      toast.error('حدث خطأ في تحديث الاسم')
    } finally {
      setSavingName(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/user/export')
      if (res.ok) {
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `masari-backup-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('تم تصدير البيانات بنجاح')
      } else {
        toast.error('حدث خطأ في تصدير البيانات')
      }
    } catch {
      toast.error('حدث خطأ في تصدير البيانات')
    } finally {
      setExporting(false)
    }
  }

  const handleClearData = async () => {
    setClearing(true)
    try {
      const res = await fetch('/api/user/clear', { method: 'POST' })
      if (res.ok) {
        toast.success('تم حذف جميع البيانات')
        setTimeout(() => {
          window.location.href = '/login'
        }, 1000)
      } else {
        toast.error('حدث خطأ في حذف البيانات')
        setClearing(false)
      }
    } catch {
      toast.error('حدث خطأ في حذف البيانات')
      setClearing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-6">
            <div className="skeleton h-6 w-48 mb-4" />
            <div className="skeleton h-10 w-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Section 1: Account */}
        <motion.div variants={itemVariants} className="glass p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20">
              <User className="h-5 w-5 text-violet-400" />
            </div>
            <h2 className="text-lg font-bold text-white">الحساب</h2>
          </div>

          <div className="space-y-4">
            {/* User Name */}
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">
                الاسم
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input flex-1"
                  placeholder="أدخل اسمك"
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingName || name === user?.name || !name.trim()}
                  className="btn-primary flex items-center gap-2 shrink-0"
                >
                  {savingName ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  حفظ
                </button>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="input opacity-60 cursor-not-allowed"
              />
            </div>

            {/* Created Date */}
            {user?.createdAt && (
              <div className="flex items-center gap-2 pt-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5">
                  <Shield className="h-3.5 w-3.5 text-gray-500" />
                </div>
                <span className="text-sm text-gray-500">
                  عضو منذ: {formatDate(user.createdAt)}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Section 2: Appearance */}
        <motion.div variants={itemVariants} className="glass p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20">
              <Palette className="h-5 w-5 text-violet-400" />
            </div>
            <h2 className="text-lg font-bold text-white">المظهر</h2>
          </div>

          <div className="space-y-6">
            {/* Theme Toggle */}
            <div>
              <label className="text-sm font-medium text-gray-400 mb-3 block">
                السمة
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Dark Theme */}
                <div
                  className={cn(
                    'relative p-4 rounded-xl cursor-pointer transition-all duration-200',
                    'bg-violet-500/10 border-2 border-violet-500/40'
                  )}
                >
                  <div className="absolute top-2 left-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  {/* Preview */}
                  <div className="bg-gray-900 rounded-lg p-3 mb-2">
                    <div className="flex gap-1 mb-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-gray-700" />
                      <div className="h-1.5 w-1.5 rounded-full bg-gray-700" />
                      <div className="h-1.5 w-1.5 rounded-full bg-gray-700" />
                    </div>
                    <div className="h-2 w-16 bg-gray-700 rounded mb-1.5" />
                    <div className="h-2 w-24 bg-gray-700 rounded mb-1.5" />
                    <div className="h-2 w-12 bg-gray-700 rounded" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-violet-400" />
                    <span className="text-sm font-medium text-white">داكن</span>
                  </div>
                </div>

                {/* Light Theme (Coming Soon) */}
                <div
                  className={cn(
                    'relative p-4 rounded-xl cursor-not-allowed transition-all duration-200',
                    'bg-white/3 border-2 border-white/10 opacity-50'
                  )}
                >
                  {/* Preview */}
                  <div className="bg-gray-200 rounded-lg p-3 mb-2">
                    <div className="flex gap-1 mb-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                      <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                      <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                    </div>
                    <div className="h-2 w-16 bg-gray-300 rounded mb-1.5" />
                    <div className="h-2 w-24 bg-gray-300 rounded mb-1.5" />
                    <div className="h-2 w-12 bg-gray-300 rounded" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-500">فاتح</span>
                    <span className="badge badge-violet text-[10px] mr-auto">قريباً</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="text-sm font-medium text-gray-400 mb-3 block">
                اللغة
              </label>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/10">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <Globe className="h-4 w-4 text-blue-400" />
                </div>
                <span className="text-sm font-medium text-white">العربية</span>
                <span className="badge badge-blue mr-auto">الافتراضية</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section 3: Data */}
        <motion.div variants={itemVariants} className="glass p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20">
              <Database className="h-5 w-5 text-violet-400" />
            </div>
            <h2 className="text-lg font-bold text-white">البيانات</h2>
          </div>

          <div className="space-y-3">
            {/* Export */}
            <button
              onClick={handleExport}
              disabled={exporting}
              className="btn-secondary w-full flex items-center justify-center gap-2 py-3"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              تصدير البيانات
            </button>

            <p className="text-xs text-gray-500 text-center">
              تصدير جميع بياناتك كملف JSON
            </p>

            {/* Clear Data */}
            <div className="pt-4 border-t border-white/6">
              <button
                onClick={() => setShowClearModal(true)}
                className="btn-danger w-full flex items-center justify-center gap-2 py-3"
              >
                <Trash2 className="h-4 w-4" />
                حذف جميع البيانات
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                سيتم حذف جميع بياناتك نهائياً
              </p>
            </div>
          </div>
        </motion.div>

        {/* Section 4: About */}
        <motion.div variants={itemVariants} className="glass p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20">
              <Info className="h-5 w-5 text-violet-400" />
            </div>
            <h2 className="text-lg font-bold text-white">حول التطبيق</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-sm text-gray-400">التطبيق</span>
              <span className="text-sm font-bold gradient-text">مساري</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-sm text-gray-400">الإصدار</span>
              <span className="badge badge-violet">1.0.0</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-sm text-gray-400">المطور</span>
              <span className="text-sm font-medium text-white">عبدالعزيز</span>
            </div>
            <div className="py-2">
              <span className="text-sm text-gray-400 block mb-1">الوصف</span>
              <p className="text-sm text-gray-300">
                نظام متكامل لإدارة حياتك اليومية
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <p className="text-xs text-gray-500">صنع بحب لمساري</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Clear Data Confirmation Modal */}
      <AnimatePresence>
        {showClearModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowClearModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Warning Icon */}
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10">
                  <Trash2 className="h-8 w-8 text-rose-400" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-white text-center mb-2">
                هل أنت متأكد؟
              </h3>
              <p className="text-sm text-gray-400 text-center mb-6">
                سيتم حذف جميع بياناتك نهائياً. لا يمكن التراجع عن هذا الإجراء.
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearModal(false)}
                  disabled={clearing}
                  className="btn-secondary flex-1 py-2.5"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleClearData}
                  disabled={clearing}
                  className="btn-danger flex-1 py-2.5 flex items-center justify-center gap-2"
                >
                  {clearing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  حذف الكل
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
