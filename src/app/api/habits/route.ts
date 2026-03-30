import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const habits = await db.habit.findMany({
      include: {
        completions: true,
      },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(habits)
  } catch (error) {
    console.error('Habits fetch error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب العادات' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const habit = await db.habit.create({
      data: {
        name: body.name,
        icon: body.icon || '✅',
        color: body.color || '#388BFD',
        frequency: body.frequency || 'daily',
        userId: body.userId,
      },
    })
    return NextResponse.json(habit, { status: 201 })
  } catch (error) {
    console.error('Habit create error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء العادة' },
      { status: 500 }
    )
  }
}
