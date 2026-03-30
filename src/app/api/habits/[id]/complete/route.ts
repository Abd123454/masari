import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { completed } = body

    if (completed) {
      // Check if already completed today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const existing = await db.habitCompletion.findFirst({
        where: {
          habitId: id,
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
      })

      if (!existing) {
        await db.habitCompletion.create({
          data: {
            habitId: id,
            date: new Date(),
          },
        })
      }
    } else {
      // Remove today's completion
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      await db.habitCompletion.deleteMany({
        where: {
          habitId: id,
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Habit completion error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث العادة' },
      { status: 500 }
    )
  }
}
