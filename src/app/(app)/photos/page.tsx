'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Trash2, X, ChevronLeft, ChevronRight, Upload, Loader2 } from 'lucide-react'
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
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3 } },
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch('/api/media?mediaType=image')
      if (res.ok) {
        const data = await res.json()
        setPhotos(data)
      }
    } catch {
      toast.error('حدث خطأ في جلب الصور')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يتجاوز 5 ميجابايت')
      return
    }

    setUploading(true)
    setUploadProgress(10)

    try {
      // Read file as base64
      const reader = new FileReader()
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 60) + 10
          setUploadProgress(pct)
        }
      }
      reader.onload = async () => {
        setUploadProgress(70)
        const base64 = reader.result as string

        try {
          const res = await fetch('/api/media/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'image',
              url: base64,
              title: file.name.replace(/\.[^/.]+$/, ''),
            }),
          })

          setUploadProgress(90)

          if (res.ok) {
            setUploadProgress(100)
            toast.success('تم رفع الصورة بنجاح')
            fetchPhotos()
          } else {
            toast.error('حدث خطأ في رفع الصورة')
          }
        } catch {
          toast.error('حدث خطأ في رفع الصورة')
        } finally {
          setTimeout(() => {
            setUploading(false)
            setUploadProgress(0)
          }, 500)
        }
      }
      reader.onerror = () => {
        toast.error('حدث خطأ في قراءة الملف')
        setUploading(false)
        setUploadProgress(0)
      }
      reader.readAsDataURL(file)
    } catch {
      toast.error('حدث خطأ في رفع الصورة')
      setUploading(false)
      setUploadProgress(0)
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== id))
        if (lightboxIndex !== null) {
          const newPhotos = photos.filter((p) => p.id !== id)
          if (newPhotos.length === 0) {
            setLightboxIndex(null)
          } else if (lightboxIndex >= newPhotos.length) {
            setLightboxIndex(newPhotos.length - 1)
          }
        }
        toast.success('تم حذف الصورة')
      }
    } catch {
      toast.error('حدث خطأ في حذف الصورة')
    }
  }

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (lightboxIndex === null) return
    if (direction === 'prev') {
      setLightboxIndex(lightboxIndex > 0 ? lightboxIndex - 1 : photos.length - 1)
    } else {
      setLightboxIndex(lightboxIndex < photos.length - 1 ? lightboxIndex + 1 : 0)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20">
            <Camera className="h-5 w-5 text-violet-400" />
          </div>
          <h1 className="text-xl font-bold text-white">الصور</h1>
          {photos.length > 0 && (
            <span className="badge badge-violet">{photos.length}</span>
          )}
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-primary flex items-center gap-2"
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          رفع صورة
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Upload Progress */}
      <AnimatePresence>
        {uploading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-accent p-4"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">جاري الرفع...</p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-l from-violet-500 to-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
              <span className="text-xs text-gray-400">{uploadProgress}%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden">
              <div className="skeleton aspect-square" />
              <div className="skeleton h-4 w-24 mt-2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && photos.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass flex flex-col items-center justify-center py-16 gap-4"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <Camera className="h-8 w-8 text-gray-500" />
          </div>
          <p className="text-gray-400">لا توجد صور بعد</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            ارفع أول صورة
          </button>
        </motion.div>
      )}

      {/* Photo Grid */}
      {!loading && photos.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
        >
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              variants={itemVariants}
              layout
              className="group glass glass-hover rounded-2xl overflow-hidden cursor-pointer"
              onClick={() => setLightboxIndex(index)}
            >
              {/* Image */}
              <div className="relative aspect-square">
                <img
                  src={photo.url}
                  alt={photo.title || 'صورة'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-end justify-between">
                  {/* Delete button - top right */}
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={(e) => handleDelete(photo.id, e)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity btn-icon bg-black/40 backdrop-blur-sm border-none text-white hover:bg-rose-500/60 hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </motion.button>
                  {/* Title - bottom */}
                  {photo.title && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      className="absolute bottom-0 inset-x-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/80 to-transparent p-3 pt-8"
                    >
                      <p className="text-sm font-medium text-white truncate">
                        {photo.title}
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
              {/* Date */}
              <div className="p-3">
                <p className="text-xs text-gray-500">{formatDate(photo.createdAt)}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && photos[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay bg-black/90"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Close button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setLightboxIndex(null)}
              className="absolute top-4 right-4 z-10 btn-icon bg-black/40 backdrop-blur-sm border-none text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </motion.button>

            {/* Counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-sm text-white/70 font-medium">
              {lightboxIndex + 1} / {photos.length}
            </div>

            {/* Previous button - RTL: right side is prev */}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={(e) => {
                e.stopPropagation()
                navigateLightbox('prev')
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 btn-icon bg-black/40 backdrop-blur-sm border-none text-white hover:bg-white/20 h-12 w-12 rounded-full"
            >
              <ChevronRight className="h-6 w-6" />
            </motion.button>

            {/* Next button - RTL: left side is next */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={(e) => {
                e.stopPropagation()
                navigateLightbox('next')
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 btn-icon bg-black/40 backdrop-blur-sm border-none text-white hover:bg-white/20 h-12 w-12 rounded-full"
            >
              <ChevronLeft className="h-6 w-6" />
            </motion.button>

            {/* Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={photos[lightboxIndex].url}
                alt={photos[lightboxIndex].title || 'صورة'}
                className="max-w-full max-h-[85vh] object-contain rounded-xl"
              />
            </motion.div>

            {/* Title */}
            {photos[lightboxIndex].title && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium">
                {photos[lightboxIndex].title}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
