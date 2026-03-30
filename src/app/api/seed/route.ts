import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)
const dayAfter = new Date(today)
dayAfter.setDate(dayAfter.getDate() + 2)

// Helper to set time to start of day
function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function POST(req: NextRequest) {
  try {
    const existingUsers = await db.user.findMany({ take: 1 })
    if (existingUsers.length > 0) {
      // Force re-seed: update existing habits icons and add missing data
      const existingUser = existingUsers[0]
      
      // Update habit icons from emoji to Lucide names
      const habitIconMap: Record<string, string> = {
        'الصلاة': 'Moon',
        'قراءة القرآن': 'BookOpen',
        'رياضة': 'Dumbbell',
        'قراءة كتاب': 'BookMarked',
        'مراجعة صينية': 'Languages',
      }
      for (const [name, icon] of Object.entries(habitIconMap)) {
        await db.habit.updateMany({ where: { userId: existingUser.id, name }, data: { icon } })
      }

      // Update achievement icons from emoji to Lucide names
      const achieveIconMap: Record<string, string> = {
        'المهمة الأولى': 'Star',
        'مثابر': 'Flame',
        'كاتب': 'BookOpen',
        'قارئ نهم': 'BookMarked',
        'رياضي': 'Dumbbell',
      }
      for (const [name, icon] of Object.entries(achieveIconMap)) {
        await db.achievement.updateMany({ where: { name }, data: { icon } })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Icons updated successfully',
        userId: existingUser.id
      })
    }

    // Create demo user
    const user = await db.user.create({
      data: {
        name: 'عبدالعزيز',
        avatar: null,
        authProvider: 'email'
      }
    })

    await db.account.create({
      data: {
        email: 'abdelas845@gmail.com',
        passwordHash: hashPassword('123456'),
        userId: user.id,
        authProvider: 'email'
      }
    })

    await db.setting.create({
      data: {
        userId: user.id,
        language: 'ar',
        theme: 'dark'
      }
    })

    const userId = user.id

    // === Habits (delete existing first for re-seeding) ===
    await db.habit.deleteMany({ where: { userId: user.id } })
    await db.habit.createMany({
      data: [
        { name: 'الصلاة', icon: 'Moon', color: '#10B981', frequency: 'daily', userId },
        { name: 'قراءة القرآن', icon: 'BookOpen', color: '#8B5CF6', frequency: 'daily', userId },
        { name: 'رياضة', icon: 'Dumbbell', color: '#F59E0B', frequency: 'daily', userId },
        { name: 'قراءة كتاب', icon: 'BookMarked', color: '#3B82F6', frequency: 'daily', userId },
        { name: 'مراجعة صينية', icon: 'Languages', color: '#F43F5E', frequency: 'daily', userId }
      ]
    })

    // === Tasks ===
    await db.task.createMany({
      data: [
        { title: 'دراسة الرياضيات', priority: 'high', category: 'study', dueTime: '10:00', status: 'pending', userId },
        { title: 'مراجعة صينية HSK3', priority: 'medium', category: 'study', dueTime: '14:00', status: 'pending', userId },
        { title: 'تمارين رياضية', priority: 'low', category: 'fitness', dueTime: '17:00', status: 'completed', userId },
        { title: 'قراءة 30 صفحة', priority: 'medium', category: 'reading', dueTime: '21:00', status: 'pending', userId },
        { title: 'مراجعة ملاحظات التوجيهي', priority: 'high', category: 'study', status: 'pending', userId },
      ]
    })

    // === Goals ===
    await db.goal.createMany({
      data: [
        { title: 'توفير للصين', description: 'توفير مبلغ كافي للسفر', category: 'finance', progress: 35, userId },
        { title: 'HSK 4', description: 'الوصول لمستوى HSK 4 في اللغة الصينية', category: 'education', progress: 45, userId },
        { title: 'التوجيهي 95+', description: 'الحصول على 95+ في امتحان التوجيهي', category: 'education', progress: 60, userId },
      ]
    })

    // === Notes ===
    await db.note.createMany({
      data: [
        { title: 'أهداف 2026', content: '1. التوفير للصين\n2. التوجيهي\n3. HSK 4', color: '#1a1a3e', isPinned: true, userId },
        { title: 'ملاحظات دراسة', content: 'الرياضيات: التركيز على التكامل\nالفيزياء: مراجعة القوانين', color: '#1a2e1a', userId },
        { title: 'كلمات صينية جديدة', content: '朋友 - صديق\n工作 - عمل\n大学 - جامعة', color: '#2e1a1a', userId },
      ]
    })

    // === Finance ===
    await db.financeExpense.createMany({
      data: [
        { title: 'قهوة', amount: 5, category: 'food', date: startOfDay(today), userId },
        { title: 'كتاب صيني', amount: 25, category: 'education', date: startOfDay(today), userId },
        { title: 'اشتراك جيم', amount: 15, category: 'health', date: startOfDay(today), userId },
      ]
    })

    await db.financeDeposit.create({
      data: {
        title: 'راتب',
        amount: 3000,
        source: 'salary',
        date: startOfDay(today),
        userId
      }
    })

    // === Journal ===
    await db.journalEntry.create({
      data: {
        content: 'اليوم كان يوماً جيداً، درست الصينية وحللت تمارين الرياضيات. شعرت بالإنجاز بعد إتمام كل المهام.',
        date: startOfDay(today),
        userId
      }
    })

    // === Gratitude ===
    await db.gratitudeEntry.create({
      data: {
        item1: 'أنا ممتن للصحة',
        item2: 'للعائلة',
        item3: 'للفرص',
        date: startOfDay(today),
        userId
      }
    })

    // === Water Log ===
    await db.waterLog.create({
      data: {
        glasses: 6,
        date: startOfDay(today),
        userId
      }
    })

    // === Mood Log ===
    await db.moodLog.create({
      data: {
        mood: 'happy',
        note: 'يوم ممتاز',
        date: startOfDay(today),
        userId
      }
    })

    // === Study ===
    await db.studySession.create({
      data: {
        subjectName: 'الرياضيات',
        duration: 45,
        pomodoros: 2,
        date: startOfDay(today),
        userId
      }
    })

    await db.studySubject.create({
      data: {
        name: 'الرياضيات',
        color: '#8B5CF6',
        targetHours: 100,
        userId
      }
    })

    // === Chinese ===
    await db.chineseWord.createMany({
      data: [
        { chinese: '你好', pinyin: 'nǐ hǎo', arabic: 'مرحبا', hskLevel: 1, userId },
        { chinese: '谢谢', pinyin: 'xiè xiè', arabic: 'شكراً', hskLevel: 1, userId },
        { chinese: '学习', pinyin: 'xué xí', arabic: 'دراسة', hskLevel: 1, userId },
        { chinese: '中国', pinyin: 'zhōng guó', arabic: 'الصين', hskLevel: 1, userId },
        { chinese: '大学', pinyin: 'dà xué', arabic: 'جامعة', hskLevel: 1, userId },
        { chinese: '朋友', pinyin: 'péng yǒu', arabic: 'صديق', hskLevel: 1, userId },
        { chinese: '工作', pinyin: 'gōng zuò', arabic: 'عمل', hskLevel: 2, userId },
        { chinese: '喜欢', pinyin: 'xǐ huān', arabic: 'يحب', hskLevel: 2, userId },
      ]
    })

    await db.chineseSession.create({
      data: {
        date: startOfDay(today),
        userId
      }
    })

    // === RPG ===
    await db.userRPG.create({
      data: {
        userId,
        level: 5,
        xp: 450,
        className: 'Mage',
        maxHp: 120,
        currentHp: 100,
        strength: 8,
        intelligence: 18,
        wisdom: 14
      }
    })

    // === Reading ===
    await db.readingBook.create({
      data: {
        title: 'أسرار العقل البشري',
        author: 'مالكوم جلادويل',
        status: 'reading',
        progress: 45,
        totalPages: 320,
        userId
      }
    })

    // === Motivation / Wishlist ===
    await db.wishlistItem.create({
      data: {
        title: 'سفر إلى الصين',
        completed: false,
        userId
      }
    })

    // === Calendar Events ===
    await db.calendarEvent.createMany({
      data: [
        { title: 'اختبار الرياضيات', description: 'الفصل الثالث - الوحدة 5', date: startOfDay(tomorrow), time: '09:00', color: '#EF4444', userId },
        { title: 'اجتماع الفريق', description: 'مناقشة مشروع التخرج', date: startOfDay(dayAfter), time: '14:00', color: '#3B82F6', userId }
      ]
    })

    // === Fitness ===
    await db.fitnessLog.create({
      data: {
        exercise: 'جري',
        sets: 3,
        reps: 0,
        duration: 30,
        calories: 200,
        date: startOfDay(today),
        userId
      }
    })

    // === Achievements ===
    await db.achievement.createMany({
      data: [
        { name: 'المهمة الأولى', description: 'أكمل أول مهمة', icon: 'Star', category: 'tasks', isHidden: false },
        { name: 'مثابر', description: 'أكمل عادة 7 أيام متتالية', icon: 'Flame', category: 'habits', isHidden: false },
        { name: 'كاتب', description: 'اكتب 10 يوميات', icon: 'BookOpen', category: 'journal', isHidden: false },
        { name: 'قارئ نهم', description: 'أكمل 3 كتب', icon: 'BookMarked', category: 'reading', isHidden: false },
        { name: 'رياضي', description: 'سجل 10 تمارين', icon: 'Dumbbell', category: 'fitness', isHidden: false },
        { name: 'متعلم صيني', description: 'احفظ 100 كلمة صينية', icon: 'Languages', category: 'chinese', isHidden: true },
      ]
    })

    // Link achievements to user
    const createdAchievements = await db.achievement.findMany()
    for (const achievement of createdAchievements) {
      await db.userAchievement.create({
        data: {
          achievementId: achievement.id,
          userId
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Demo data seeded successfully',
      userId: user.id
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء البيانات التجريبية' },
      { status: 500 }
    )
  }
}
