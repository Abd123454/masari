import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const sessions = await db.studySession.findMany({
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Study sessions fetch error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب جلسات الدراسة' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const session = await db.studySession.create({
      data: {
        subjectName: body.subjectName,
        duration: body.duration || 0,
        pomodoros: body.pomodoros || 0,
        date: body.date ? new Date(body.date) : new Date(),
      },
    })
    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('Study session create error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء جلسة الدراسة' },
      { status: 500 }
    )
  }
}
