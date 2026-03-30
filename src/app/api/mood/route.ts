import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const logs = await db.moodLog.findMany({
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(logs)
  } catch (error) {
    console.error('Mood fetch error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب سجل المزاج' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Upsert today's mood
    const existing = await db.moodLog.findFirst({
      where: {
        date: { gte: today, lt: tomorrow },
      },
    })

    if (existing) {
      const updated = await db.moodLog.update({
        where: { id: existing.id },
        data: { mood: body.mood, note: body.note ?? existing.note },
      })
      return NextResponse.json(updated)
    } else {
      const created = await db.moodLog.create({
        data: {
          mood: body.mood,
          note: body.note || null,
          date: new Date(),
        },
      })
      return NextResponse.json(created, { status: 201 })
    }
  } catch (error) {
    console.error('Mood log error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تسجيل المزاج' },
      { status: 500 }
    )
  }
}
