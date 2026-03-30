import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function POST() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Delete all user data in order (respect foreign keys)
    await db.habitCompletion.deleteMany({ where: { userId: user.id } })
    await db.task.deleteMany({ where: { userId: user.id } })
    await db.habit.deleteMany({ where: { userId: user.id } })
    await db.note.deleteMany({ where: { userId: user.id } })
    await db.goal.deleteMany({ where: { userId: user.id } })
    await db.waterLog.deleteMany({ where: { userId: user.id } })
    await db.moodLog.deleteMany({ where: { userId: user.id } })
    await db.sleepLog.deleteMany({ where: { userId: user.id } })
    await db.journalEntry.deleteMany({ where: { userId: user.id } })
    await db.gratitudeEntry.deleteMany({ where: { userId: user.id } })
    await db.timeCapsule.deleteMany({ where: { userId: user.id } })
    await db.dayRating.deleteMany({ where: { userId: user.id } })
    await db.wishlistItem.deleteMany({ where: { userId: user.id } })
    await db.anniversary.deleteMany({ where: { userId: user.id } })
    await db.tawjihiSubject.deleteMany({ where: { userId: user.id } })
    await db.chineseSession.deleteMany({ where: { userId: user.id } })
    await db.chineseWord.deleteMany({ where: { userId: user.id } })
    await db.fitnessLog.deleteMany({ where: { userId: user.id } })
    await db.readingBook.deleteMany({ where: { userId: user.id } })
    await db.aIMemory.deleteMany({ where: { userId: user.id } })
    await db.userAchievement.deleteMany({ where: { userId: user.id } })
    await db.calendarEvent.deleteMany({ where: { userId: user.id } })
    await db.financeExpense.deleteMany({ where: { userId: user.id } })
    await db.financeDeposit.deleteMany({ where: { userId: user.id } })
    await db.financeBudget.deleteMany({ where: { userId: user.id } })
    await db.financeGoal.deleteMany({ where: { userId: user.id } })
    await db.studySession.deleteMany({ where: { userId: user.id } })
    await db.studySubject.deleteMany({ where: { userId: user.id } })
    await db.media.deleteMany({ where: { userId: user.id } })

    // Reset RPG if exists
    try {
      await db.userRPG.deleteMany({ where: { userId: user.id } })
    } catch {}

    // Reset settings
    try {
      const setting = await db.setting.findFirst({ where: { userId: user.id } })
      if (setting) {
        await db.setting.update({
          where: { id: setting.id },
          data: { theme: 'dark', language: 'ar' },
        })
      }
    } catch {}

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Clear user data error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في حذف البيانات' },
      { status: 500 }
    )
  }
}
