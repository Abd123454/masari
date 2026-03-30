import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const logs = await db.fitnessLog.findMany({
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(logs)
  } catch (error) {
    console.error('Fitness logs fetch error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب سجلات اللياقة' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const log = await db.fitnessLog.create({
      data: {
        exercise: body.exercise,
        sets: body.sets || 0,
        reps: body.reps || 0,
        duration: body.duration || 0,
        calories: body.calories || 0,
        date: body.date ? new Date(body.date) : new Date(),
      },
    })
    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error('Fitness log create error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء سجل اللياقة' },
      { status: 500 }
    )
  }
}
