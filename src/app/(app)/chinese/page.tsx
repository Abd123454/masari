'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Languages, Plus, ChevronLeft, ChevronRight, Trash2, Brain, BookOpen, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ChineseWord {
  id: string
  chinese: string
  pinyin: string
  arabic: string
  hskLevel: number
}

interface QuizQuestion {
  question: { id: string; chinese: string; pinyin: string; hskLevel: number }
  options: { id: string; text: string; isCorrect: boolean }[]
  message?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

export default function ChinesePage() {
  const [words, setWords] = useState<ChineseWord[]>([])
  const [loading, setLoading] = useState(true)
  const [hskFilter, setHskFilter] = useState<number | null>(null)
  const [mode, setMode] = useState<'browse' | 'quiz'>('browse')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showWordList, setShowWordList] = useState(false)

  // Add word modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [newWord, setNewWord] = useState({ chinese: '', pinyin: '', arabic: '', hskLevel: 1 })
  const [adding, setAdding] = useState(false)

  // Quiz state
  const [quiz, setQuiz] = useState<QuizQuestion | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [quizScore, setQuizScore] = useState({ correct: 0, wrong: 0 })
  const [answered, setAnswered] = useState(false)

  const filteredWords = hskFilter ? words.filter(w => w.hskLevel === hskFilter) : words

  const fetchWords = async () => {
    try {
      const url = hskFilter ? `/api/chinese/words?hskLevel=${hskFilter}` : '/api/chinese/words'
      const res = await fetch(url)
      if (res.ok) setWords(await res.json())
    } catch {}
  }

  const loadQuiz = async () => {
    setQuizLoading(true)
    setAnswered(false)
    setSelectedAnswer(null)
    try {
      const url = hskFilter ? `/api/chinese/quiz?hskLevel=${hskFilter}` : '/api/chinese/quiz'
      const res = await fetch(url)
      const data = await res.json()
      if (data.message) {
        toast.info(data.message)
        setMode('browse')
        return
      }
      setQuiz(data)
    } catch {}
    setQuizLoading(false)
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const url = hskFilter ? `/api/chinese/words?hskLevel=${hskFilter}` : '/api/chinese/words'
        const res = await fetch(url)
        if (res.ok && mounted) setWords(await res.json())
      } catch {}
      if (mounted) setLoading(false)
    })()
    return () => { mounted = false }
  }, [hskFilter])

  // Reset index when hsk filter changes (handled in onClick)
  const handleHskChange = (level: number | null) => {
    setHskFilter(level)
    setCurrentIndex(0)
  }

  useEffect(() => {
    if (mode === 'quiz') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadQuiz()
    }
  }, [mode, hskFilter])

  const handleAddWord = async () => {
    if (!newWord.chinese.trim() || !newWord.arabic.trim()) {
      toast.error('يرجى ملء الحقول المطلوبة')
      return
    }
    setAdding(true)
    try {
      const res = await fetch('/api/chinese/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWord),
      })
      if (res.ok) {
        toast.success('تمت إضافة الكلمة')
        setNewWord({ chinese: '', pinyin: '', arabic: '', hskLevel: 1 })
        setShowAddModal(false)
        fetchWords()
      }
    } catch {}
    setAdding(false)
  }

  const handleDeleteWord = async (id: string) => {
    try {
      await fetch(`/api/chinese/words?id=${id}`, { method: 'DELETE' })
      toast.success('تم حذف الكلمة')
      fetchWords()
    } catch {}
  }

  const handleAnswer = (optionId: string) => {
    if (answered) return
    setSelectedAnswer(optionId)
    setAnswered(true)
    const isCorrect = quiz?.options.find(o => o.id === optionId)?.isCorrect
    if (isCorrect) {
      setQuizScore(s => ({ ...s, correct: s.correct + 1 }))
    } else {
      setQuizScore(s => ({ ...s, wrong: s.wrong + 1 }))
    }
  }

  const hskTabs = [
    { label: 'الكل', value: null },
    { label: 'HSK 1', value: 1 },
    { label: 'HSK 2', value: 2 },
    { label: 'HSK 3', value: 3 },
  ]

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Languages className="w-7 h-7 text-violet-400" />
          الصينية
        </h1>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          كلمة جديدة
        </button>
      </motion.div>

      {/* HSK Level Tabs */}
      <motion.div variants={itemVariants} className="flex gap-2">
        {hskTabs.map(tab => (
          <button
            key={String(tab.value)}
            onClick={() => handleHskChange(tab.value)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
              hskFilter === tab.value
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
            )}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Mode Toggle */}
      <motion.div variants={itemVariants} className="flex gap-2">
        <button
          onClick={() => setMode('browse')}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2',
            mode === 'browse'
              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
              : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
          )}
        >
          <BookOpen className="w-4 h-4" />
          استعراض
        </button>
        <button
          onClick={() => setMode('quiz')}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2',
            mode === 'quiz'
              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
              : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
          )}
        >
          <Brain className="w-4 h-4" />
          اختبار
        </button>
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass p-6">
              <div className="skeleton h-20 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : filteredWords.length === 0 ? (
        <motion.div variants={itemVariants} className="glass p-12 text-center">
          <Languages className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">لا توجد كلمات محفوظة بعد</p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            أضف كلمة
          </button>
        </motion.div>
      ) : mode === 'browse' ? (
        <>
          {/* Browse Mode - Main Card */}
          <motion.div variants={itemVariants} className="glass-accent p-8 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={filteredWords[currentIndex]?.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-7xl font-bold text-white mb-3">
                  {filteredWords[currentIndex]?.chinese}
                </div>
                <div className="text-xl text-gray-400">
                  {filteredWords[currentIndex]?.pinyin}
                </div>
                <div className="text-2xl text-white mt-3">
                  {filteredWords[currentIndex]?.arabic}
                </div>
                <div className="mt-3">
                  <span className="badge badge-violet">HSK {filteredWords[currentIndex]?.hskLevel}</span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <span className="text-gray-500 text-sm">
                {currentIndex + 1} / {filteredWords.length}
              </span>
            </div>
            <div className="flex items-center justify-center gap-4 mt-3">
              <button
                onClick={() => setCurrentIndex(i => (i > 0 ? i - 1 : filteredWords.length - 1))}
                className="btn-icon"
                disabled={filteredWords.length <= 1}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentIndex(i => (i < filteredWords.length - 1 ? i + 1 : 0))}
                className="btn-icon"
                disabled={filteredWords.length <= 1}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          {/* Word List Toggle */}
          <motion.div variants={itemVariants}>
            <button
              onClick={() => setShowWordList(!showWordList)}
              className="text-gray-400 text-sm hover:text-white transition-colors flex items-center gap-2"
            >
              <ChevronLeft className={cn('w-4 h-4 transition-transform', showWordList && 'rotate-90')} />
              {showWordList ? 'إخفاء القائمة' : 'عرض جميع الكلمات'}
            </button>

            <AnimatePresence>
              {showWordList && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
                    <AnimatePresence>
                      {filteredWords.map(word => (
                        <motion.div
                          key={word.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="glass glass-hover p-3 rounded-xl cursor-pointer relative group"
                          onClick={() => {
                            const idx = filteredWords.findIndex(w => w.id === word.id)
                            if (idx >= 0) setCurrentIndex(idx)
                          }}
                        >
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              handleDeleteWord(word.id)
                            }}
                            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity btn-icon w-7 h-7"
                          >
                            <Trash2 className="w-3 h-3 text-rose-400" />
                          </button>
                          <div className="text-lg font-bold text-white">{word.chinese}</div>
                          <div className="text-xs text-gray-500">{word.pinyin}</div>
                          <div className="text-sm text-gray-300 mt-1">{word.arabic}</div>
                          <span className="badge badge-violet text-[10px] mt-2">HSK {word.hskLevel}</span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      ) : (
        /* Quiz Mode */
        <motion.div variants={itemVariants} className="space-y-4">
          {/* Score */}
          <div className="flex items-center justify-center gap-4">
            <span className="badge badge-emerald">صحيح: {quizScore.correct}</span>
            <span className="badge badge-rose">خطأ: {quizScore.wrong}</span>
          </div>

          {quizLoading ? (
            <div className="glass p-8 text-center">
              <div className="skeleton h-20 w-40 mx-auto rounded-lg" />
              <div className="skeleton h-6 w-24 mx-auto rounded-lg mt-4" />
            </div>
          ) : quiz?.question ? (
            <>
              <div className="glass-accent p-8 text-center">
                <div className="text-7xl font-bold text-white">{quiz.question.chinese}</div>
                <div className="text-xl text-gray-400 mt-2">{quiz.question.pinyin}</div>
                <span className="badge badge-violet mt-3 inline-block">HSK {quiz.question.hskLevel}</span>
                <p className="text-gray-400 mt-3">ما هي الترجمة؟</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quiz.options.map(option => {
                  const isSelected = selectedAnswer === option.id
                  const isCorrect = option.isCorrect
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleAnswer(option.id)}
                      disabled={answered}
                      className={cn(
                        'glass p-4 rounded-xl text-center text-lg font-semibold transition-all',
                        !answered && 'hover:bg-white/10 cursor-pointer',
                        answered && isCorrect && 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
                        answered && isSelected && !isCorrect && 'bg-rose-500/15 border-rose-500/40 text-rose-300',
                      )}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {answered && isCorrect && <Check className="w-5 h-5" />}
                        {option.text}
                      </span>
                    </button>
                  )
                })}
              </div>

              {answered && (
                <div className="text-center">
                  <button
                    onClick={loadQuiz}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    سؤال التالي
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="glass p-8 text-center">
              <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">لا يمكن إنشاء اختبار الآن</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Add Word Modal */}
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
                <h2 className="text-lg font-bold text-white">كلمة جديدة</h2>
                <button onClick={() => setShowAddModal(false)} className="btn-icon">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">الكلمة بالصينية</label>
                  <input
                    type="text"
                    value={newWord.chinese}
                    onChange={e => setNewWord(w => ({ ...w, chinese: e.target.value }))}
                    className="input"
                    dir="ltr"
                    placeholder="你好"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">النطق (Pinyin)</label>
                  <input
                    type="text"
                    value={newWord.pinyin}
                    onChange={e => setNewWord(w => ({ ...w, pinyin: e.target.value }))}
                    className="input"
                    dir="ltr"
                    placeholder="nǐ hǎo"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">الترجمة بالعربية</label>
                  <input
                    type="text"
                    value={newWord.arabic}
                    onChange={e => setNewWord(w => ({ ...w, arabic: e.target.value }))}
                    className="input"
                    placeholder="مرحبا"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">مستوى HSK</label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(level => (
                      <button
                        key={level}
                        onClick={() => setNewWord(w => ({ ...w, hskLevel: level }))}
                        className={cn(
                          'px-4 py-2 rounded-xl text-sm font-semibold transition-all flex-1',
                          newWord.hskLevel === level
                            ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                            : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
                        )}
                      >
                        HSK {level}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleAddWord}
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
