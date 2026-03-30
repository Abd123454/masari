import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const achievements = await db.achievement.findMany({
      orderBy: { createdAt: 'asc' },
    })

    const userAchievements = await db.userAchievement.findMany({
      where: { userId: user.id },
    })

    const unlockedMap = new Map(userAchievements.map((ua) => [ua.achievementId, ua]))

    const result = achievements.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon,
      category: a.category,
      isHidden: a.isHidden,
      unlocked: unlockedMap.has(a.id),
      unlockedAt: unlockedMap.get(a.id)?.unlockedAt || null,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Achievements fetch error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الإنجازات' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const body = await request.json()
    if (body.action === 'check') {
      // Check and unlock new achievements based on user activity
      const newlyUnlocked: string[] = []

      const tasksCompleted = await db.task.count({
        where: { userId: user.id, status: 'completed' },
      })

      const habitsCount = await db.habit.count({
        where: { userId: user.id },
      })

      const habitCompletions = await db.habitCompletion.count({
        where: { userId: user.id },
      })

      const booksCompleted = await db.readingBook.count({
        where: { userId: user.id, status: 'completed' },
      })

      const notesCount = await db.note.count({
        where: { userId: user.id },
      })

      const studyHours = await db.studySession.aggregate({
        where: { userId: user.id },
        _sum: { duration: true },
      })

      const totalStudyHours = studyHours._sum.duration || 0

      const existingAchievements = await db.userAchievement.findMany({
        where: { userId: user.id },
      })
      const existingIds = new Set(existingAchievements.map((a) => a.achievementId))

      const allAchievements = await db.achievement.findMany()
      const achievementMap = new Map(allAchievements.map((a) => [a.name, a]))

      // Define achievement conditions
      const checks: { name: string; condition: boolean }[] = [
        { name: 'المهمة الأولى', condition: tasksCompleted >= 1 },
        { name: 'منجز مهام', condition: tasksCompleted >= 10 },
        { name: 'محارب المهام', condition: tasksCompleted >= 50 },
        { name: 'صاحب العادات', condition: habitsCount >= 1 },
        { name: 'منتظم', condition: habitCompletions >= 7 },
        { name: 'قارئ نهم', condition: booksCompleted >= 1 },
        { name: 'كاتب', condition: notesCount >= 1 },
        { name: 'متعلم', condition: totalStudyHours >= 60 },
        { name: 'بداية الرحلة', condition: true },
      ]

      for (const check of checks) {
        if (check.condition && !existingIds.has(achievementMap.get(check.name)?.id || '')) {
          const achievement = achievementMap.get(check.name)
          if (achievement) {
            await db.userAchievement.create({
              data: {
                achievementId: achievement.id,
                userId: user.id,
              },
            })
            newlyUnlocked.push(achievement.name)
          }
        }
      }

      return NextResponse.json({ newlyUnlocked })
    }

    return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 })
  } catch (error) {
    console.error('Achievements check error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في فحص الإنجازات' },
      { status: 500 }
    )
  }
}
