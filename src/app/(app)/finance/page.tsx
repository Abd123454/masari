'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Wallet, TrendingUp, TrendingDown, Trash2, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'

const ARABIC_DAYS_SHORT = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت']

const EXPENSE_CATEGORIES = ['طعام', 'نقل', 'ترفيه', 'تعليم', 'تسوق', 'صحة', 'فواتير', 'أخرى']
const DEPOSIT_SOURCES = ['راتب', 'هدية', 'استثمار', 'عمل حر', 'أخرى']

interface Expense {
  id: string
  title: string
  amount: number
  category: string
  date: string
  type: 'expense'
}

interface Deposit {
  id: string
  title: string
  amount: number
  source: string
  date: string
  type: 'deposit'
}

type Transaction = Expense | Deposit

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 }
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass px-3 py-2 text-sm">
      <p className="text-gray-400 mb-0.5">{label}</p>
      <p className="text-white font-bold">{payload[0].value} ر.س</p>
    </div>
  )
}

function formatCurrency(n: number): string {
  return n.toLocaleString('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export default function FinancePage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // Form state
  const [formType, setFormType] = useState<'expense' | 'deposit'>('expense')
  const [formTitle, setFormTitle] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formCategory, setFormCategory] = useState('طعام')
  const [formSource, setFormSource] = useState('راتب')
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/finance')
      if (res.ok) {
        const data = await res.json()
        setExpenses(data.expenses)
        setDeposits(data.deposits)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Monthly calculations
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const monthlyExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    }).reduce((sum, e) => sum + e.amount, 0)
  }, [expenses, currentMonth, currentYear])

  const monthlyDeposits = useMemo(() => {
    return deposits.filter(d => {
      const dt = new Date(d.date)
      return dt.getMonth() === currentMonth && dt.getFullYear() === currentYear
    }).reduce((sum, d) => sum + d.amount, 0)
  }, [deposits, currentMonth, currentYear])

  const balance = monthlyDeposits - monthlyExpenses

  // Weekly chart data
  const weeklyData = useMemo(() => {
    const days: { name: string; amount: number }[] = []
    const today = new Date()
    const dayOfWeek = today.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + mondayOffset + i)
      const dateStr = d.toISOString().split('T')[0]
      const dayExpenses = expenses.filter(e => e.date.startsWith(dateStr))
        .reduce((sum, e) => sum + e.amount, 0)
      days.push({
        name: ARABIC_DAYS_SHORT[i],
        amount: dayExpenses,
      })
    }
    return days
  }, [expenses])

  // Recent transactions (combined, last 10)
  const recentTransactions = useMemo(() => {
    const all: Transaction[] = [
      ...expenses.map(e => ({ ...e, type: 'expense' as const })),
      ...deposits.map(d => ({ ...d, type: 'deposit' as const })),
    ]
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
  }, [expenses, deposits])

  const handleSubmit = async () => {
    if (!formTitle.trim() || !formAmount || parseFloat(formAmount) <= 0) return
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        type: formType,
        title: formTitle.trim(),
        amount: parseFloat(formAmount),
        date: formDate,
      }
      if (formType === 'expense') body.category = formCategory
      else body.source = formSource

      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast.success(formType === 'expense' ? 'تم إضافة المصروف' : 'تم إضافة الإيراد')
        setShowModal(false)
        fetchData()
      } else {
        toast.error('حدث خطأ أثناء الإضافة')
      }
    } catch {
      toast.error('حدث خطأ في الاتصال')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteTransaction = async (id: string) => {
    try {
      const res = await fetch(`/api/finance/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('تم حذف المعاملة')
        fetchData()
      }
    } catch {
      toast.error('حدث خطأ أثناء الحذف')
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-white">المالية</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => {
          setFormType('expense')
          setFormTitle('')
          setFormAmount('')
          setFormCategory('طعام')
          setFormSource('راتب')
          setFormDate(new Date().toISOString().split('T')[0])
          setShowModal(true)
        }}>
          <Wallet className="w-4 h-4" />
          معاملة جديدة
        </button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Expenses */}
        <div className="glass p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">المصاريف</p>
              <p className="text-sm text-gray-500">هذا الشهر</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-400">{formatCurrency(monthlyExpenses)} <span className="text-sm font-normal text-gray-500">ر.س</span></p>
        </div>

        {/* Deposits */}
        <div className="glass p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">الإيرادات</p>
              <p className="text-sm text-gray-500">هذا الشهر</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(monthlyDeposits)} <span className="text-sm font-normal text-gray-500">ر.س</span></p>
        </div>

        {/* Balance */}
        <div className="glass p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              balance >= 0 ? 'bg-blue-500/10' : 'bg-rose-500/10'
            )}>
              <Wallet className={cn('w-5 h-5', balance >= 0 ? 'text-blue-400' : 'text-rose-400')} />
            </div>
            <div>
              <p className="text-xs text-gray-500">الرصيد</p>
              <p className="text-sm text-gray-500">هذا الشهر</p>
            </div>
          </div>
          <p className={cn(
            'text-2xl font-bold',
            balance >= 0 ? 'gradient-text' : 'text-rose-400'
          )}>
            {balance >= 0 ? '+' : ''}{formatCurrency(balance)} <span className="text-sm font-normal text-gray-500">ر.س</span>
          </p>
        </div>
      </motion.div>

      {/* Weekly Chart */}
      <motion.div variants={itemVariants} className="glass p-5">
        <h3 className="text-base font-semibold text-white mb-4">المصاريف الأسبوعية</h3>
        {loading ? (
          <div className="skeleton h-[200px] w-full" />
        ) : (
          <div dir="ltr">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="amount" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* Recent Transactions */}
      <motion.div variants={itemVariants} className="glass p-5">
        <h3 className="text-base font-semibold text-white mb-4">المعاملات الأخيرة</h3>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton w-9 h-9 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-4 w-1/3" />
                  <div className="skeleton h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="text-center py-10">
            <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">لا توجد معاملات بعد</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {recentTransactions.map(tx => {
                const isExpense = tx.type === 'expense'
                return (
                  <motion.div
                    key={tx.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors group"
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                      isExpense ? 'bg-rose-500/10' : 'bg-emerald-500/10'
                    )}>
                      {isExpense
                        ? <ArrowDownRight className="w-4 h-4 text-rose-400" />
                        : <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">{tx.title}</span>
                        <span className={cn('badge text-[10px]', isExpense ? 'badge-rose' : 'badge-emerald')}>
                          {isExpense ? 'مصروف' : 'إيراد'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(tx.date).toLocaleDateString('ar-SA')}
                        {' — '}
                        {isExpense ? (tx as Expense).category : (tx as Deposit).source}
                      </p>
                    </div>

                    <span className={cn(
                      'text-sm font-bold shrink-0',
                      isExpense ? 'text-rose-400' : 'text-emerald-400'
                    )}>
                      {isExpense ? '-' : '+'}{formatCurrency(tx.amount)}
                    </span>

                    <button
                      className="btn-icon opacity-0 group-hover:opacity-100 transition-opacity text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 shrink-0 w-8 h-8"
                      onClick={() => deleteTransaction(tx.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <motion.div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-lg font-bold text-white mb-4">معاملة جديدة</h3>

            <div className="space-y-4">
              {/* Type Toggle */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">النوع</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className={cn(
                      'py-2.5 px-4 rounded-xl text-sm font-medium transition-all',
                      formType === 'expense'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-white/5 text-gray-400 border border-white/5'
                    )}
                    onClick={() => setFormType('expense')}
                  >
                    مصروف
                  </button>
                  <button
                    className={cn(
                      'py-2.5 px-4 rounded-xl text-sm font-medium transition-all',
                      formType === 'deposit'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/5 text-gray-400 border border-white/5'
                    )}
                    onClick={() => setFormType('deposit')}
                  >
                    إيراد
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">العنوان</label>
                <input
                  className="input"
                  placeholder="عنوان المعاملة"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">المبلغ (ر.س)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="0"
                  dir="ltr"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Category pills */}
              {formType === 'expense' ? (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">التصنيف</label>
                  <div className="flex flex-wrap gap-2">
                    {EXPENSE_CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        className={cn(
                          'badge cursor-pointer transition-all',
                          formCategory === cat
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
                        )}
                        onClick={() => setFormCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">المصدر</label>
                  <div className="flex flex-wrap gap-2">
                    {DEPOSIT_SOURCES.map(src => (
                      <button
                        key={src}
                        className={cn(
                          'badge cursor-pointer transition-all',
                          formSource === src
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
                        )}
                        onClick={() => setFormSource(src)}
                      >
                        {src}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">التاريخ</label>
                <input
                  type="date"
                  className="input"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                className={cn(
                  'flex-1 py-2.5 rounded-xl font-medium text-white transition-all',
                  formType === 'expense'
                    ? 'bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30'
                    : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30'
                )}
                onClick={handleSubmit}
                disabled={!formTitle.trim() || !formAmount || submitting}
              >
                {submitting ? 'جارٍ الإضافة...' : 'إضافة المعاملة'}
              </button>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
