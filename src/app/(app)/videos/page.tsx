'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, Film, Play, Trash2, Plus, X, Clock, Info, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface MediaItem {
  id: string
  type: string
  url: string
  title: string | null
  createdAt: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}`
  return `0:${String(m).padStart(2, '0')}`
}

const durationOptions = [
  { label: '0:30', value: 0.5 },
  { label: '1:00', value: 1 },
  { label: '2:00', value: 2 },
  { label: '5:00', value: 5 },
  { label: '10:00', value: 10 },
]

export default function VideosPage() {
  const [videos, setVideos] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addTitle, setAddTitle] = useState('')
  const [addDuration, setAddDuration] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<MediaItem | null>(null)

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch('/api/media?mediaType=video')
      if (res.ok) {
        const data = await res.json()
        setVideos(data)
      }
    } catch {
      toast.error('حدث خطأ في جلب الفيديوهات')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  const handleAddVideo = async () => {
    if (!addTitle.trim()) {
      toast.error('يرجى إدخال عنوان الفيديو')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'video',
          url: '',
          title: addTitle.trim(),
          duration: addDuration,
        }),
      })

      if (res.ok) {
        toast.success('تم إضافة الفيديو بنجاح')
        setShowAddModal(false)
        setAddTitle('')
        setAddDuration(1)
        fetchVideos()
      } else {
        toast.error('حدث خطأ في إضافة الفيديو')
      }
    } catch {
      toast.error('حدث خطأ في إضافة الفيديو')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setVideos((prev) => prev.filter((v) => v.id !== id))
        if (selectedVideo?.id === id) setSelectedVideo(null)
        toast.success('تم حذف الفيديو')
      }
    } catch {
      toast.error('حدث خطأ في حذف الفيديو')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20">
            <Video className="h-5 w-5 text-violet-400" />
          </div>
          <h1 className="text-xl font-bold text-white">الفيديوهات</h1>
          {videos.length > 0 && (
            <span className="badge badge-violet">{videos.length}</span>
          )}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          رفع فيديو
        </button>
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-accent p-4 flex items-start gap-3"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
          <Info className="h-4 w-4 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-amber-300">
            رفع الفيديوهات متاح
          </p>
          <p className="text-xs text-gray-400 mt-1">
            يتم حفظ البيانات الوصفية للفيديوهات (العنوان والمدة)
          </p>
        </div>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-4 flex items-center gap-4">
              <div className="skeleton w-24 h-16 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-48" />
                <div className="skeleton h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && videos.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass flex flex-col items-center justify-center py-16 gap-4"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <Video className="h-8 w-8 text-gray-500" />
          </div>
          <p className="text-gray-400">لا توجد فيديوهات</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            إضافة فيديو
          </button>
        </motion.div>
      )}

      {/* Video List */}
      {!loading && videos.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {videos.map((video) => (
            <motion.div
              key={video.id}
              variants={itemVariants}
              layout
              className="glass glass-hover rounded-2xl p-4 flex items-center gap-4 cursor-pointer"
              onClick={() => setSelectedVideo(video)}
            >
              {/* Thumbnail Placeholder */}
              <div className="relative w-24 h-16 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center shrink-0 overflow-hidden group">
                <Film className="h-6 w-6 text-gray-500" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                  <Play className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white truncate">
                  {video.title || 'بدون عنوان'}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-500">
                    {formatDate(video.createdAt)}
                  </span>
                </div>
              </div>

              {/* Duration Badge */}
              <span className="badge badge-blue">
                <Clock className="h-3 w-3 ml-1" />
                {formatDuration(1)}
              </span>

              {/* Delete Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(video.id)
                }}
                className="btn-icon opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20"
              >
                <Trash2 className="h-4 w-4" />
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Add Video Modal */}
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-violet-400" />
                  <h2 className="text-lg font-bold text-white">إضافة فيديو</h2>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="btn-icon"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Info Notice */}
              <div className="glass-accent p-3 flex items-start gap-2 mb-4 rounded-xl">
                <Info className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-400">
                  يتم حفظ البيانات الوصفية فقط (العنوان والمدة). لا يتم رفع ملفات الفيديو.
                </p>
              </div>

              {/* Title Input */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  عنوان الفيديو
                </label>
                <input
                  type="text"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  placeholder="أدخل عنوان الفيديو"
                  className="input"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddVideo()}
                  autoFocus
                />
              </div>

              {/* Duration Selection */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  المدة (بالدقائق)
                </label>
                <div className="flex flex-wrap gap-2">
                  {durationOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setAddDuration(opt.value)}
                      className={cn(
                        'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                        addDuration === opt.value
                          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleAddVideo}
                disabled={submitting || !addTitle.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                إضافة الفيديو
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Detail Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-violet-400" />
                  <h2 className="text-lg font-bold text-white">تفاصيل الفيديو</h2>
                </div>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="btn-icon"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Video Preview Area */}
              <div className="w-full aspect-video rounded-xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 flex flex-col items-center justify-center gap-3 mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
                  <Film className="h-8 w-8 text-gray-500" />
                </div>
                <p className="text-sm text-gray-500">لا يوجد ملف فيديو مرفق</p>
              </div>

              {/* Info */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500">العنوان</label>
                  <p className="text-sm font-medium text-white">
                    {selectedVideo.title || 'بدون عنوان'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <label className="text-xs text-gray-500">التاريخ</label>
                    <p className="text-sm text-gray-300">
                      {formatDate(selectedVideo.createdAt)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">النوع</label>
                    <span className="badge badge-blue">فيديو</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
