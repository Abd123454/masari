'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  StickyNote,
  Pin,
  Pencil,
  Trash2,
  Loader2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

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

/* ─── Types ─── */
interface Note {
  id: string
  title: string
  content: string
  color: string
  isPinned: boolean
  updatedAt: string
  createdAt: string
}

/* ─── Color Presets ─── */
const colorPresets = [
  '#8B5CF6', // violet
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#F43F5E', // rose
  '#EC4899', // pink
]

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formColor, setFormColor] = useState('#8B5CF6')
  const [formPinned, setFormPinned] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/notes')
        const data = await res.json()
        if (!cancelled) setNotes(data || [])
      } catch {
        if (!cancelled) toast.error('حدث خطأ في جلب الملاحظات')
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/notes')
      const data = await res.json()
      setNotes(data || [])
    } catch {
      toast.error('حدث خطأ في جلب الملاحظات')
    }
  }

  /* ─── Filtered Notes ─── */
  const filtered = notes.filter(n => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
  })

  /* ─── Handlers ─── */
  const openCreateModal = () => {
    setEditingNote(null)
    setFormTitle('')
    setFormContent('')
    setFormColor('#8B5CF6')
    setFormPinned(false)
    setShowModal(true)
  }

  const openEditModal = (note: Note) => {
    setEditingNote(note)
    setFormTitle(note.title)
    setFormContent(note.content || '')
    setFormColor(note.color || '#8B5CF6')
    setFormPinned(note.isPinned)
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!formTitle.trim()) {
      toast.error('يرجى إدخال عنوان الملاحظة')
      return
    }
    setSubmitting(true)
    try {
      if (editingNote) {
        // Update
        const res = await fetch(`/api/notes/${editingNote.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle.trim(),
            content: formContent.trim(),
            color: formColor,
            isPinned: formPinned,
          }),
        })
        if (res.ok) {
          toast.success('تم تحديث الملاحظة')
          setShowModal(false)
          fetchNotes()
        } else {
          toast.error('حدث خطأ في التحديث')
        }
      } else {
        // Create
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle.trim(),
            content: formContent.trim(),
            color: formColor,
            isPinned: formPinned,
          }),
        })
        if (res.ok) {
          toast.success('تم إضافة الملاحظة')
          setShowModal(false)
          fetchNotes()
        } else {
          toast.error('حدث خطأ في إنشاء الملاحظة')
        }
      }
    } catch {
      toast.error('حدث خطأ في الاتصال')
    }
    setSubmitting(false)
  }

  const handleDelete = async (noteId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) return
    setNotes(ns => ns.filter(n => n.id !== noteId))
    try {
      await fetch(`/api/notes/${noteId}`, { method: 'DELETE' })
      toast.success('تم حذف الملاحظة')
    } catch {
      toast.error('حدث خطأ في الحذف')
      fetchNotes()
    }
  }

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">الملاحظات</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              className="input pr-9 w-full sm:w-56"
              placeholder="بحث..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            ملاحظة جديدة
          </button>
        </div>
      </motion.div>

      {/* Notes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="glass p-5">
              <div className="skeleton h-5 w-3/4 mb-3" />
              <div className="skeleton h-3 w-full mb-2" />
              <div className="skeleton h-3 w-2/3 mb-4" />
              <div className="skeleton h-3 w-20" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div variants={itemVariants} className="glass p-12 text-center">
          <StickyNote className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">
            {searchQuery ? 'لا توجد نتائج للبحث' : 'اكتب أول ملاحظة'}
          </p>
          {!searchQuery && (
            <button onClick={openCreateModal} className="btn-primary flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" />
              ملاحظة جديدة
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map(note => (
              <motion.div
                key={note.id}
                layout
                variants={itemVariants}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass glass-hover p-5 group relative cursor-pointer"
                style={{ borderTop: `4px solid ${note.color || '#8B5CF6'}` }}
                onClick={() => openEditModal(note)}
              >
                {/* Pin indicator */}
                {note.isPinned && (
                  <div className="absolute top-3 right-3">
                    <Pin className="w-4 h-4 text-violet-400 fill-violet-400" />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="absolute top-3 left-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={e => { e.stopPropagation(); openEditModal(note) }}
                    className="btn-icon w-8 h-8 text-gray-500 hover:text-white hover:bg-white/10"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(note.id) }}
                    className="btn-icon w-8 h-8 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Title */}
                <h3 className="text-sm font-semibold text-white mb-2 pr-6 line-clamp-1">
                  {note.title}
                </h3>

                {/* Content Preview */}
                <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                  {note.content || 'لا يوجد محتوى'}
                </p>

                {/* Date */}
                <p className="text-xs text-gray-600">
                  {formatDate(note.updatedAt || note.createdAt)}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ─── Add/Edit Note Modal ─── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <motion.div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">
                {editingNote ? 'تعديل الملاحظة' : 'ملاحظة جديدة'}
              </h2>
              <button onClick={() => setShowModal(false)} className="btn-icon">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">العنوان</label>
                <input
                  type="text"
                  className="input"
                  placeholder="عنوان الملاحظة..."
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Content */}
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">المحتوى</label>
                <textarea
                  className="textarea min-h-[120px]"
                  placeholder="اكتب ملاحظتك..."
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                />
              </div>

              {/* Color */}
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">اللون</label>
                <div className="flex gap-3">
                  {colorPresets.map(color => (
                    <button
                      key={color}
                      onClick={() => setFormColor(color)}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all',
                        formColor === color ? 'ring-2 ring-offset-2 ring-offset-gray-900 scale-110' : 'hover:scale-110'
                      )}
                      style={{ backgroundColor: color, ringColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Pin Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-400">تثبيت الملاحظة</label>
                <button
                  onClick={() => setFormPinned(!formPinned)}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors',
                    formPinned ? 'bg-violet-500' : 'bg-white/10'
                  )}
                >
                  <motion.div
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
                    animate={{ left: formPinned ? '22px' : '2px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingNote ? (
                  <Pencil className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {editingNote ? 'حفظ التعديلات' : 'إضافة الملاحظة'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
