'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Sparkles,
  RotateCw,
  Plus,
  Trash2,
  Check,
  Circle,
  Send,
  Heart,
  BookOpen,
} from 'lucide-react'

interface WishlistItem {
  id: string
  title: string
  completed: boolean
  createdAt: string
}

const QUOTES = [
  { text: 'لا تنتظر الفرصة المناسبة، بل اصنعها بنفسك', author: 'جورج برنارد شو' },
  { text: 'النجاح ليس نهائياً والفشل ليس قاتلاً، إنما الشجاعة للاستمرار هي ما يهم', author: 'ونستون تشرشل' },
  { text: 'كل خبير كان يوماً مبتدئاً', author: 'هيلين هايز' },
  { text: 'الطريقة الوحيدة للقيام بعمل رائع هي أن تحب ما تفعله', author: 'ستيف جوبز' },
  { text: 'لا تقارن نفسك بالآخرين، قارن نفسك بنفسك بالأمس', author: 'جوردان بيترسون' },
  { text: 'العلم نور والجهل ظلام', author: 'مثل عربي' },
  { text: 'من جد وجد ومن زرع حصد', author: 'مثل عربي' },
  { text: 'أطلب العلم من المهد إلى اللحد', author: 'حديث شريف' },
  { text: 'إن مع العسر يسراً، إن مع العسر يسراً', author: 'القرآن الكريم' },
  { text: 'لا يحزنك إنك فشلت، بل يحزنك إنك لم تحاول', author: 'ألبرت أينشتاين' },
  { text: 'كل يوم جديد هو فرصة جديدة لتغيير حياتك', author: 'مجهول' },
  { text: 'الصبر مفتاح الفرج', author: 'مثل عربي' },
  { text: 'إذا أردت شيئاً بشدة، فإن الكون كله يتآمر لمساعدتك', author: 'باولو كويلو' },
  { text: 'كن أنت التغيير الذي تريد أن تراه في العالم', author: 'غاندي' },
  { text: 'التعليم هو أقوى سلاح يمكنك استخدامه لتغيير العالم', author: 'نيلسون مانديلا' },
  { text: 'لا تكن شخصاً ينتظر الفرص، بل كن من يصنعها', author: 'أبراهام لينكون' },
  { text: 'الحياة要么勇敢面对،要么就躲起来哭泣', author: 'مجهول' },
  { text: 'ابدأ من حيث أنت، واستخدم ما لديك، وافعل ما تستطيع', author: 'آرثر آش' },
  { text: 'النجاح هو مجموع الجهود الصغيرة المتكررة يوماً بعد يوم', author: 'روبرت كولير' },
  { text: 'اقرأ كثيراً وتعلّم كل يوم، فالمعرفة سلاح لا ينكسر', author: 'مجهول' },
]

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

export default function MotivationPage() {
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [rotating, setRotating] = useState(false)
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [newItem, setNewItem] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [futureMessage, setFutureMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [messageSaved, setMessageSaved] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setQuoteIndex(Math.floor(Math.random() * QUOTES.length))
  }, [])

  useEffect(() => {
    fetch('/api/motivation')
      .then((r) => r.json())
      .then((data) => {
        setWishlist(data.wishlist || [])
        setFutureMessage(data.futureMessage || '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showInput])

  const rotateQuote = () => {
    if (rotating) return
    setRotating(true)
    setTimeout(() => {
      let newIndex: number
      do {
        newIndex = Math.floor(Math.random() * QUOTES.length)
      } while (newIndex === quoteIndex && QUOTES.length > 1)
      setQuoteIndex(newIndex)
      setRotating(false)
    }, 400)
  }

  const addWishlistItem = async () => {
    if (!newItem.trim()) return
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newItem.trim() }),
      })
      const item = await res.json()
      setWishlist((prev) => [item, ...prev])
      setNewItem('')
      setShowInput(false)
      toast.success('تمت الإضافة')
    } catch {
      toast.error('حدث خطأ')
    }
  }

  const toggleWishlistItem = async (id: string) => {
    try {
      const res = await fetch(`/api/wishlist/${id}`, { method: 'PATCH' })
      const updated = await res.json()
      setWishlist((prev) => prev.map((w) => (w.id === id ? updated : w)))
    } catch {
      toast.error('حدث خطأ')
    }
  }

  const deleteWishlistItem = async (id: string) => {
    try {
      await fetch(`/api/wishlist/${id}`, { method: 'DELETE' })
      setWishlist((prev) => prev.filter((w) => w.id !== id))
      toast.success('تم الحذف')
    } catch {
      toast.error('حدث خطأ')
    }
  }

  const saveFutureMessage = async () => {
    if (!futureMessage.trim()) return
    setSaving(true)
    setMessageSaved(false)
    try {
      await fetch('/api/motivation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ futureMessage: futureMessage.trim() }),
      })
      setMessageSaved(true)
      toast.success('تم حفظ الرسالة')
      setTimeout(() => setMessageSaved(false), 3000)
    } catch {
      toast.error('حدث خطأ في الحفظ')
    } finally {
      setSaving(false)
    }
  }

  const currentQuote = QUOTES[quoteIndex]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">التحفيز</h1>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Daily Quote */}
        <motion.div variants={itemVariants} className="glass-accent p-8">
          <div className="flex items-start justify-between mb-4">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <button onClick={rotateQuote} className="btn-icon" disabled={rotating}>
              <RotateCw className={`w-4 h-4 ${rotating ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <motion.div
            key={quoteIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-xl text-white leading-relaxed mb-4 font-medium">
              &ldquo;{currentQuote.text}&rdquo;
            </p>
            <p className="text-violet-400 text-sm font-semibold">— {currentQuote.author}</p>
          </motion.div>
        </motion.div>

        {/* Wishlist / Dream Goals */}
        <motion.div variants={itemVariants} className="glass p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-400" />
              أهداف الأحلام
            </h2>
            <button
              onClick={() => setShowInput(!showInput)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              إضافة
            </button>
          </div>

          {/* Add Input */}
          <AnimatePresence>
            {showInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addWishlistItem()}
                    placeholder="أضف حلم جديد..."
                    className="input flex-1"
                  />
                  <button onClick={addWishlistItem} className="btn-primary px-4">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Wishlist Items */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-10 rounded-xl" />
              ))}
            </div>
          ) : wishlist.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {wishlist.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  className={`group flex items-center gap-3 p-3 rounded-xl transition-all ${
                    item.completed
                      ? 'bg-emerald-500/5 opacity-70'
                      : 'bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  <button
                    onClick={() => toggleWishlistItem(item.id)}
                    className="flex-shrink-0"
                  >
                    {item.completed ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                    ) : (
                      <Circle className="w-6 h-6 text-gray-500 hover:text-violet-400 transition-colors" />
                    )}
                  </button>
                  <span
                    className={`flex-1 text-sm ${
                      item.completed ? 'line-through text-gray-500' : 'text-gray-300'
                    }`}
                  >
                    {item.title}
                  </span>
                  <button
                    onClick={() => deleteWishlistItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity btn-icon !w-8 !h-8"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Heart className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">أضف أحلامك وأهدافك هنا</p>
            </div>
          )}
        </motion.div>

        {/* Future Message */}
        <motion.div variants={itemVariants} className="glass p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            رسالة لنفسك
          </h2>
          <p className="text-gray-400 text-sm mb-4">احفظ رسالة لنفسك في المستقبل</p>
          <textarea
            value={futureMessage}
            onChange={(e) => {
              setFutureMessage(e.target.value)
              setMessageSaved(false)
            }}
            placeholder="اكتب رسالة لنفسك المستقبلية..."
            className="textarea min-h-[120px]"
            rows={4}
          />
          <div className="flex items-center justify-between mt-3">
            {messageSaved && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-emerald-400 text-xs flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                تم الحفظ
              </motion.span>
            )}
            <button
              onClick={saveFutureMessage}
              disabled={saving || !futureMessage.trim()}
              className="btn-primary flex items-center gap-2 mr-auto"
            >
              <Send className="w-4 h-4" />
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
