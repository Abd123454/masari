import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const logs = await db.waterLog.findMany({
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(logs)
  } catch (error) {
    console.error('Water fetch error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب سجل المياه' },
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

    const existing = await db.waterLog.findFirst({
      where: {
        date: { gte: today, lt: tomorrow },
      },
    })

    if (existing) {
      const updated = await db.waterLog.update({
        where: { id: existing.id },
        data: { glasses: body.glasses ?? existing.glasses + 1 },
      })
      return NextResponse.json(updated)
    } else {
      const created = await db.waterLog.create({
        data: {
          glasses: body.glasses ?? 1,
          date: new Date(),
        },
      })
      return NextResponse.json(created, { status: 201 })
    }
  } catch (error) {
    console.error('Water log error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تسجيل المياه' },
      { status: 500 }
    )
  }
}
