import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const [
      tasks,
      habits,
      notes,
      goals,
      waterLogs,
      moodLogs,
      sleepLogs,
      journalEntries,
      gratitudeEntries,
      timeCapsules,
      tawjihiSubjects,
      chineseWords,
      chineseSessions,
      fitnessLogs,
      readingBooks,
      calendarEvents,
      financeExpenses,
      financeDeposits,
      studySessions,
      studySubjects,
      media,
      wishlistItems,
      anniversaries,
      dayRatings,
      aiMemories,
      userAchievements,
    ] = await Promise.all([
      db.task.findMany({ where: { userId: user.id } }),
      db.habit.findMany({ where: { userId: user.id }, include: { completions: true } }),
      db.note.findMany({ where: { userId: user.id } }),
      db.goal.findMany({ where: { userId: user.id } }),
      db.waterLog.findMany({ where: { userId: user.id } }),
      db.moodLog.findMany({ where: { userId: user.id } }),
      db.sleepLog.findMany({ where: { userId: user.id } }),
      db.journalEntry.findMany({ where: { userId: user.id } }),
      db.gratitudeEntry.findMany({ where: { userId: user.id } }),
      db.timeCapsule.findMany({ where: { userId: user.id } }),
      db.tawjihiSubject.findMany({ where: { userId: user.id } }),
      db.chineseWord.findMany({ where: { userId: user.id } }),
      db.chineseSession.findMany({ where: { userId: user.id } }),
      db.fitnessLog.findMany({ where: { userId: user.id } }),
      db.readingBook.findMany({ where: { userId: user.id } }),
      db.calendarEvent.findMany({ where: { userId: user.id } }),
      db.financeExpense.findMany({ where: { userId: user.id } }),
      db.financeDeposit.findMany({ where: { userId: user.id } }),
      db.studySession.findMany({ where: { userId: user.id } }),
      db.studySubject.findMany({ where: { userId: user.id } }),
      db.media.findMany({ where: { userId: user.id } }),
      db.wishlistItem.findMany({ where: { userId: user.id } }),
      db.anniversary.findMany({ where: { userId: user.id } }),
      db.dayRating.findMany({ where: { userId: user.id } }),
      db.aIMemory.findMany({ where: { userId: user.id } }),
      db.userAchievement.findMany({ where: { userId: user.id } }),
    ])

    const exportData = {
      app: 'مساري',
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name,
        createdAt: user.createdAt,
      },
      data: {
        tasks,
        habits,
        notes,
        goals,
        waterLogs,
        moodLogs,
        sleepLogs,
        journalEntries,
        gratitudeEntries,
        timeCapsules,
        tawjihiSubjects,
        chineseWords,
        chineseSessions,
        fitnessLogs,
        readingBooks,
        calendarEvents,
        financeExpenses,
        financeDeposits,
        studySessions,
        studySubjects,
        wishlistItems,
        anniversaries,
        dayRatings,
        aiMemories,
        userAchievements,
        media,
      },
    }

    return NextResponse.json(exportData)
  } catch (error) {
    console.error('Export user data error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تصدير البيانات' },
      { status: 500 }
    )
  }
}
