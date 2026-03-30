import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const capsules = await db.timeCapsule.findMany({
      orderBy: { openDate: 'asc' },
    })
    return NextResponse.json(capsules)
  } catch (error) {
    console.error('TimeCapsule fetch error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الكبسولات' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, message, mood, openDate } = body

    if (!title || !message || !openDate) {
      return NextResponse.json(
        { error: 'يرجى تعبئة جميع الحقول المطلوبة' },
        { status: 400 }
      )
    }

    const capsule = await db.timeCapsule.create({
      data: {
        title,
        message,
        mood: mood || null,
        openDate: new Date(openDate),
      },
    })

    return NextResponse.json(capsule, { status: 201 })
  } catch (error) {
    console.error('TimeCapsule create error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الكبسولة' },
      { status: 500 }
    )
  }
}
