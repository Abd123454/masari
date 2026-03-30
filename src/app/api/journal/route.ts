import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const entries = await db.journalEntry.findMany({
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(entries)
  } catch (error) {
    console.error('Journal fetch error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب اليوميات' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, entryId } = body

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (entryId) {
      const updated = await db.journalEntry.update({
        where: { id: entryId },
        data: { content },
      })
      return NextResponse.json(updated)
    }

    const existing = await db.journalEntry.findFirst({
      where: {
        date: { gte: today, lt: tomorrow },
      },
    })

    if (existing) {
      const updated = await db.journalEntry.update({
        where: { id: existing.id },
        data: { content },
      })
      return NextResponse.json(updated)
    }

    const created = await db.journalEntry.create({
      data: {
        content: content || '',
        date: new Date(),
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Journal create error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في حفظ اليومية' },
      { status: 500 }
    )
  }
}
