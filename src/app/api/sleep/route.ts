import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const logs = await db.sleepLog.findMany({
      orderBy: { date: 'desc' },
      take: 30,
    })
    return NextResponse.json(logs)
  } catch (error) {
    console.error('Sleep fetch error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب سجلات النوم' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sleepTime, wakeTime, quality, note } = body

    if (!sleepTime || !wakeTime) {
      return NextResponse.json(
        { error: 'يرجى تحديد وقت النوم والاستيقاظ' },
        { status: 400 }
      )
    }

    const log = await db.sleepLog.create({
      data: {
        sleepTime: new Date(sleepTime),
        wakeTime: new Date(wakeTime),
        quality: quality || 'good',
        note: note || null,
      },
    })

    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error('Sleep create error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تسجيل النوم' },
      { status: 500 }
    )
  }
}
