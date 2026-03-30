import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const tasks = await db.task.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Tasks fetch error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المهام' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const task = await db.task.create({
      data: {
        title: body.title,
        description: body.description || null,
        priority: body.priority || 'medium',
        category: body.category || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        dueTime: body.dueTime || null,
        userId: body.userId,
      },
    })
    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Task create error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء المهمة' },
      { status: 500 }
    )
  }
}
