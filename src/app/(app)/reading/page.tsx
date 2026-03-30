'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Library, Plus, Trash2, X, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ReadingBook {
  id: string
  title: string
  author: string
  status: string
  progress: number
  totalPages: number
  rating: number
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

const statusTabs = [
  { label: 'أقرأ حالياً', value: 'reading' },
  { label: 'مكتملة', value: 'completed' },
  { label: 'قادمة', value: 'planned' },
]

const statusBadgeClass: Record<string, string> = {
  reading: 'badge badge-blue',
  completed: 'badge badge-emerald',
  planned: 'badge',
}

const statusLabel: Record<string, string> = {
  reading: 'أقرأ حالياً',
  completed: 'مكتملة',
  planned: 'قادمة',
}

export default function ReadingPage() {
  const [books, setBooks] = useState<ReadingBook[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('reading')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newBook, setNewBook] = useState({ title: '', author: '', status: 'reading', totalPages: 300 })
  const [adding, setAdding] = useState(false)

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/reading')
      if (res.ok) setBooks(await res.json())
    } catch {}
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/reading')
        if (res.ok && mounted) setBooks(await res.json())
      } catch {}
      if (mounted) setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const filteredBooks = books.filter(b => b.status === activeTab)

  const handleAddBook = async () => {
    if (!newBook.title.trim()) {
      toast.error('يرجى إدخال عنوان الكتاب')
      return
    }
    setAdding(true)
    try {
      const res = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook),
      })
      if (res.ok) {
        toast.success('تمت إضافة الكتاب')
        setNewBook({ title: '', author: '', status: 'reading', totalPages: 300 })
        setShowAddModal(false)
        fetchBooks()
      }
    } catch {}
    setAdding(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/reading/${id}`, { method: 'DELETE' })
      toast.success('تم حذف الكتاب')
      fetchBooks()
    } catch {}
  }

  const handleUpdateProgress = async (book: ReadingBook, delta: number) => {
    const newProgress = Math.max(0, Math.min(book.totalPages || 9999, book.progress + delta))
    try {
      const res = await fetch(`/api/reading/${book.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: newProgress }),
      })
      if (res.ok) {
        setBooks(prev => prev.map(b => b.id === book.id ? { ...b, progress: newProgress } : b))
      }
    } catch {}
  }

  const handleRate = async (book: ReadingBook, rating: number) => {
    const newRating = book.rating === rating ? 0 : rating
    try {
      const res = await fetch(`/api/reading/${book.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: newRating }),
      })
      if (res.ok) {
        setBooks(prev => prev.map(b => b.id === book.id ? { ...b, rating: newRating } : b))
      }
    } catch {}
  }

  const getBookProgress = (book: ReadingBook) => {
    if (book.totalPages > 0) return Math.round((book.progress / book.totalPages) * 100)
    return 0
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Library className="w-7 h-7 text-violet-400" />
          القراءة
        </h1>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          كتاب جديد
        </button>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants} className="flex gap-2">
        {statusTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
              activeTab === tab.value
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
            )}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass p-4">
              <div className="skeleton h-5 w-1/3 rounded-lg mb-2" />
              <div className="skeleton h-3 w-1/4 rounded-lg" />
            </div>
          ))}
        </div>
      ) : filteredBooks.length === 0 ? (
        <motion.div variants={itemVariants} className="glass p-12 text-center">
          <Library className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">أضف كتابك الأول</p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            كتاب جديد
          </button>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="space-y-3">
          <AnimatePresence>
            {filteredBooks.map(book => {
              const progressPct = getBookProgress(book)
              return (
                <motion.div
                  key={book.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass glass-hover p-4 relative group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Library className="w-5 h-5 text-violet-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white">{book.title}</span>
                          <span className={statusBadgeClass[book.status] || 'badge'}>
                            {statusLabel[book.status] || book.status}
                          </span>
                        </div>
                        {book.author && (
                          <p className="text-gray-500 text-sm mt-0.5">{book.author}</p>
                        )}

                        {/* Progress bar for reading books */}
                        {book.status === 'reading' && book.totalPages > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-500">{book.progress} / {book.totalPages} صفحة</span>
                              <span className="text-xs text-gray-400">{progressPct}%</span>
                            </div>
                            <div className="progress-bar">
                              <motion.div
                                className="progress-bar-fill bg-gradient-to-l from-blue-500 to-violet-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPct}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                            <div className="flex items-center gap-1 mt-2">
                              <button
                                onClick={() => handleUpdateProgress(book, -5)}
                                className="btn-icon w-6 h-6 rounded-lg text-xs"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </button>
                              <span className="text-xs text-gray-500">5 صفحات</span>
                              <button
                                onClick={() => handleUpdateProgress(book, 5)}
                                className="btn-icon w-6 h-6 rounded-lg text-xs"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Star rating for completed books */}
                        {book.status === 'completed' && (
                          <div className="flex items-center gap-1 mt-2">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                onClick={() => handleRate(book, star)}
                                className="transition-transform hover:scale-110"
                              >
                                <Star
                                  className={cn(
                                    'w-4 h-4',
                                    book.rating >= star
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-gray-600'
                                  )}
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(book.id)}
                      className="btn-icon w-7 h-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Add Book Modal */}
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
                <h2 className="text-lg font-bold text-white">كتاب جديد</h2>
                <button onClick={() => setShowAddModal(false)} className="btn-icon">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">عنوان الكتاب</label>
                  <input
                    type="text"
                    value={newBook.title}
                    onChange={e => setNewBook(b => ({ ...b, title: e.target.value }))}
                    className="input"
                    placeholder="اسم الكتاب"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">المؤلف</label>
                  <input
                    type="text"
                    value={newBook.author}
                    onChange={e => setNewBook(b => ({ ...b, author: e.target.value }))}
                    className="input"
                    placeholder="اسم المؤلف"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">الحالة</label>
                  <div className="flex gap-2">
                    {statusTabs.map(tab => (
                      <button
                        key={tab.value}
                        onClick={() => setNewBook(b => ({ ...b, status: tab.value }))}
                        className={cn(
                          'px-3 py-2 rounded-xl text-xs font-semibold transition-all flex-1',
                          newBook.status === tab.value
                            ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                            : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">عدد الصفحات</label>
                  <input
                    type="number"
                    value={newBook.totalPages}
                    onChange={e => setNewBook(b => ({ ...b, totalPages: parseInt(e.target.value) || 0 }))}
                    className="input"
                    dir="ltr"
                    min={1}
                  />
                </div>

                <button
                  onClick={handleAddBook}
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
