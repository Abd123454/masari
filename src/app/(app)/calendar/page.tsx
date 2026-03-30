'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Clock, Trash2, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
]

const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

const COLOR_PRESETS = ['#3B82F6', '#8B5CF6', '#10B981', '#F43F5E', '#F59E0B', '#EC4899']

interface CalendarEvent {
  id: string
  title: string
  description: string | null
  date: string
  time: string | null
  color: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 }
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Convert to Monday=0 ... Sunday=6
}

function formatDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formTime, setFormTime] = useState('')
  const [formColor, setFormColor] = useState(COLOR_PRESETS[0])
  const [submitting, setSubmitting] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const fetchEvents = useCallback(async () => {
    try {
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
      const res = await fetch(`/api/calendar?month=${monthStr}`)
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    const today = new Date()
    setFormDate(formatDateStr(today.getFullYear(), today.getMonth(), today.getDate()))
  }, [])

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const prevMonthDays = getDaysInMonth(year, month - 1)
  const todayStr = formatDateStr(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())

  // Build calendar grid
  const calendarDays: Array<{ day: number; isCurrentMonth: boolean; dateStr: string }> = []

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i
    const prevM = month === 0 ? 11 : month - 1
    const prevY = month === 0 ? year - 1 : year
    calendarDays.push({ day: d, isCurrentMonth: false, dateStr: formatDateStr(prevY, prevM, d) })
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({ day: d, isCurrentMonth: true, dateStr: formatDateStr(year, month, d) })
  }

  // Next month leading days
  const remaining = 42 - calendarDays.length
  for (let d = 1; d <= remaining; d++) {
    const nextM = month === 11 ? 0 : month + 1
    const nextY = month === 11 ? year + 1 : year
    calendarDays.push({ day: d, isCurrentMonth: false, dateStr: formatDateStr(nextY, nextM, d) })
  }

  // Events map by date
  const eventsByDate: Record<string, CalendarEvent[]> = {}
  events.forEach(ev => {
    const d = new Date(ev.date)
    const key = formatDateStr(d.getFullYear(), d.getMonth(), d.getDate())
    if (!eventsByDate[key]) eventsByDate[key] = []
    eventsByDate[key].push(ev)
  })

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : []

  const openAddModal = (dateStr?: string) => {
    setFormTitle('')
    setFormDesc('')
    setFormTime('')
    setFormColor(COLOR_PRESETS[0])
    if (dateStr) setFormDate(dateStr)
    else {
      const d = selectedDate || todayStr
      setFormDate(d)
    }
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!formTitle.trim() || !formDate) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDesc.trim() || null,
          date: formDate,
          time: formTime || null,
          color: formColor,
        }),
      })
      if (res.ok) {
        toast.success('تم إضافة الحدث بنجاح')
        setShowModal(false)
        fetchEvents()
      } else {
        toast.error('حدث خطأ أثناء إضافة الحدث')
      }
    } catch {
      toast.error('حدث خطأ في الاتصال')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteEvent = async (id: string) => {
    try {
      const res = await fetch(`/api/calendar/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('تم حذف الحدث')
        fetchEvents()
      }
    } catch {
      toast.error('حدث خطأ أثناء الحذف')
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-white">التقويم</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => openAddModal()}>
          <Plus className="w-4 h-4" />
          حدث جديد
        </button>
      </motion.div>

      {/* Month Navigation */}
      <motion.div variants={itemVariants} className="glass p-4">
        <div className="flex items-center justify-between mb-6">
          <button className="btn-icon" onClick={nextMonth}>
            <ChevronRight className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-white">
            {ARABIC_MONTHS[month]} {year}
          </h2>
          <button className="btn-icon" onClick={prevMonth}>
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {ARABIC_DAYS.map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day.slice(0, 3)}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 42 }).map((_, i) => (
              <div key={i} className="skeleton h-12 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cd, i) => {
              const isToday = cd.dateStr === todayStr
              const isSelected = cd.dateStr === selectedDate
              const dayEvents = eventsByDate[cd.dateStr] || []

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(cd.dateStr)}
                  className={cn(
                    'relative h-12 rounded-xl text-sm font-medium transition-all duration-200 flex flex-col items-center justify-center',
                    !cd.isCurrentMonth && 'text-gray-600',
                    cd.isCurrentMonth && !isToday && !isSelected && 'text-gray-300 hover:bg-white/5',
                    isToday && !isSelected && 'ring-2 ring-violet-500/50 bg-violet-500/10 text-white',
                    isSelected && 'bg-violet-500 text-white hover:bg-violet-600',
                  )}
                >
                  {cd.day}
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayEvents.slice(0, 3).map((ev, j) => (
                        <div
                          key={j}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : ev.color }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Selected Day Events */}
      <motion.div variants={itemVariants} className="glass p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            {selectedDate
              ? `أحداث ${new Date(selectedDate).getDate()} ${ARABIC_MONTHS[new Date(selectedDate).getMonth()]}`
              : 'اختر يوماً لعرض الأحداث'}
          </h3>
          {selectedDate && (
            <button className="btn-icon" onClick={() => openAddModal(selectedDate)}>
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {selectedDate && selectedEvents.length === 0 && (
          <div className="text-center py-10">
            <CalendarDays className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">لا توجد أحداث في هذا اليوم</p>
            <button
              className="btn-secondary mt-3 text-sm"
              onClick={() => openAddModal(selectedDate)}
            >
              إضافة حدث
            </button>
          </div>
        )}

        <div className="space-y-3 max-h-96 overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {selectedEvents.map(ev => (
              <motion.div
                key={ev.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass glass-hover p-4 group"
                style={{ borderRight: `4px solid ${ev.color}` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white">{ev.title}</h4>
                    {ev.time && (
                      <div className="flex items-center gap-1.5 text-gray-400 text-sm mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        {ev.time}
                      </div>
                    )}
                    {ev.description && (
                      <p className="text-gray-500 text-sm mt-1 line-clamp-2">{ev.description}</p>
                    )}
                  </div>
                  <button
                    className="btn-icon opacity-0 group-hover:opacity-100 transition-opacity text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 shrink-0 ml-2"
                    onClick={() => deleteEvent(ev.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Add Event Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <motion.div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-lg font-bold text-white mb-4">حدث جديد</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">العنوان</label>
                <input
                  className="input"
                  placeholder="عنوان الحدث"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">الوصف</label>
                <textarea
                  className="textarea min-h-[80px]"
                  placeholder="وصف الحدث (اختياري)"
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">التاريخ</label>
                  <input
                    type="date"
                    className="input"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">الوقت</label>
                  <input
                    type="time"
                    className="input"
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">اللون</label>
                <div className="flex gap-2">
                  {COLOR_PRESETS.map(c => (
                    <button
                      key={c}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all',
                        formColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110' : 'hover:scale-110'
                      )}
                      style={{ backgroundColor: c }}
                      onClick={() => setFormColor(c)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                className="btn-primary flex-1"
                onClick={handleSubmit}
                disabled={!formTitle.trim() || submitting}
              >
                {submitting ? 'جارٍ الإضافة...' : 'إضافة الحدث'}
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
