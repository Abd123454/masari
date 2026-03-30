import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const task = await db.task.findUnique({ where: { id } })
    if (!task) {
      return NextResponse.json(
        { error: 'المهمة غير موجودة' },
        { status: 404 }
      )
    }
    return NextResponse.json(task)
  } catch (error) {
    console.error('Task fetch error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المهمة' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const task = await db.task.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description !== undefined ? body.description : undefined,
        priority: body.priority,
        category: body.category !== undefined ? body.category : undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        dueTime: body.dueTime !== undefined ? body.dueTime : undefined,
        status: body.status,
      },
    })
    return NextResponse.json(task)
  } catch (error) {
    console.error('Task update error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث المهمة' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.task.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Task delete error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في حذف المهمة' },
      { status: 500 }
    )
  }
}
