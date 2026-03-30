import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 6)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Tasks
    const tasksCompleted = await db.task.count({
      where: { userId: user.id, status: 'completed' },
    })
    const tasksCompletedThisMonth = await db.task.count({
      where: {
        userId: user.id,
        status: 'completed',
        createdAt: { gte: monthStart },
      },
    })
    const tasksPending = await db.task.count({
      where: { userId: user.id, status: 'pending' },
    })
    const tasksByCategory = await db.task.groupBy({
      by: ['category'],
      where: { userId: user.id },
      _count: true,
    })

    // Habits
    const habits = await db.habit.findMany({
      where: { userId: user.id },
      include: { completions: true },
    })
    const totalHabitCompletions = await db.habitCompletion.count({
      where: { userId: user.id },
    })
    const habitCompletionRate =
      habits.length > 0
        ? Math.round(
            (habits.reduce((sum, h) => {
              const last7 = h.completions.filter(
                (c) => new Date(c.date) >= weekStart
              ).length
              return sum + Math.min(last7 / 7, 1)
            }, 0) /
              habits.length) *
              100
          )
        : 0

    // Top habits ranked by completion rate (last 7 days)
    const topHabits = habits
      .map((h) => {
        const weekCompletions = h.completions.filter(
          (c) => new Date(c.date) >= weekStart
        ).length
        const rate = Math.min(Math.round((weekCompletions / 7) * 100), 100)
        return { name: h.name, icon: h.icon, color: h.color, rate, completions: weekCompletions }
      })
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5)

    // Study sessions
    const studyAgg = await db.studySession.aggregate({
      where: { userId: user.id },
      _sum: { duration: true },
    })
    const totalStudyMinutes = studyAgg._sum.duration || 0
    const totalStudyHours = Math.round(totalStudyMinutes / 60)
    const studyThisMonth = await db.studySession.aggregate({
      where: { userId: user.id, date: { gte: monthStart } },
      _sum: { duration: true },
    })
    const studyThisMonthHours = Math.round((studyThisMonth._sum.duration || 0) / 60)

    // Reading
    const booksCompleted = await db.readingBook.count({
      where: { userId: user.id, status: 'completed' },
    })
    const booksReading = await db.readingBook.count({
      where: { userId: user.id, status: 'reading' },
    })

    // Water
    const waterLogs = await db.waterLog.findMany({
      where: { userId: user.id, date: { gte: weekStart } },
      orderBy: { date: 'asc' },
    })
    const totalGlasses = waterLogs.reduce((sum, w) => sum + w.glasses, 0)

    // Fitness
    const fitnessCaloriesAgg = await db.fitnessLog.aggregate({
      where: { userId: user.id, date: { gte: monthStart } },
      _sum: { calories: true, duration: true },
    })

    // Sleep
    const sleepLogs = await db.sleepLog.findMany({
      where: { userId: user.id, date: { gte: weekStart } },
      orderBy: { date: 'asc' },
    })
    const avgSleepHours =
      sleepLogs.length > 0
        ? Math.round(
            (sleepLogs.reduce((sum, s) => {
              const hours =
                (new Date(s.wakeTime).getTime() - new Date(s.sleepTime).getTime()) /
                (1000 * 60 * 60)
              return sum + hours
            }, 0) /
              sleepLogs.length) *
              10
          ) / 10
        : 0

    // Weekly activity data (last 7 days)
    const weekDays: { day: string; score: number; tasks: number; habits: number; study: number }[] = []
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date(todayStart)
      dayDate.setDate(dayDate.getDate() - i)
      const nextDay = new Date(dayDate)
      nextDay.setDate(nextDay.getDate() + 1)

      const dayTasks = await db.task.count({
        where: {
          userId: user.id,
          status: 'completed',
          createdAt: { gte: dayDate, lt: nextDay },
        },
      })
      const dayHabits = await db.habitCompletion.count({
        where: {
          userId: user.id,
          date: { gte: dayDate, lt: nextDay },
        },
      })
      const dayStudyAgg = await db.studySession.aggregate({
        where: {
          userId: user.id,
          date: { gte: dayDate, lt: nextDay },
        },
        _sum: { duration: true },
      })
      const dayStudy = Math.round((dayStudyAgg._sum.duration || 0) / 60)

      const score = dayTasks * 2 + dayHabits * 3 + dayStudy * 2

      weekDays.push({
        day: dayNames[dayDate.getDay()],
        score,
        tasks: dayTasks,
        habits: dayHabits,
        study: dayStudy,
      })
    }

    // Monthly summary
    const journalEntries = await db.journalEntry.count({
      where: { userId: user.id, date: { gte: monthStart } },
    })
    const goalsCompleted = await db.goal.count({
      where: { userId: user.id, progress: 100 },
    })

    return NextResponse.json({
      tasksCompleted,
      tasksCompletedThisMonth,
      tasksPending,
      tasksByCategory: tasksByCategory
        .filter((t) => t.category)
        .map((t) => ({ category: t.category || 'أخرى', count: t._count })),
      habitsCount: habits.length,
      habitCompletionRate,
      totalHabitCompletions,
      topHabits,
      totalStudyHours,
      studyThisMonthHours,
      booksCompleted,
      booksReading,
      totalGlasses,
      fitnessCaloriesThisMonth: fitnessCaloriesAgg._sum.calories || 0,
      fitnessMinutesThisMonth: fitnessCaloriesAgg._sum.duration || 0,
      avgSleepHours,
      weeklyActivity: weekDays,
      monthlySummary: {
        tasksCompleted: tasksCompletedThisMonth,
        studyHours: studyThisMonthHours,
        journalEntries,
        fitnessMinutes: fitnessCaloriesAgg._sum.duration || 0,
        goalsCompleted,
      },
    })
  } catch (error) {
    console.error('Stats fetch error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الإحصائيات' },
      { status: 500 }
    )
  }
}
