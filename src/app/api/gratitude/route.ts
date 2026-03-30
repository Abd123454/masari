import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const entries = await db.gratitudeEntry.findMany({
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(entries)
  } catch (error) {
    console.error('Gratitude fetch error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب سجلات الامتنان' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { item1, item2, item3 } = body

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existing = await db.gratitudeEntry.findFirst({
      where: {
        date: { gte: today, lt: tomorrow },
      },
    })

    if (existing) {
      const updated = await db.gratitudeEntry.update({
        where: { id: existing.id },
        data: {
          item1: item1 ?? existing.item1,
          item2: item2 ?? existing.item2,
          item3: item3 ?? existing.item3,
        },
      })
      return NextResponse.json(updated)
    }

    const created = await db.gratitudeEntry.create({
      data: {
        item1: item1 || '',
        item2: item2 || '',
        item3: item3 || '',
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Gratitude create error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في حفظ الامتنان' },
      { status: 500 }
    )
  }
}
