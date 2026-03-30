import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
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

    const newStatus = task.status === 'completed' ? 'pending' : 'completed'

    const updated = await db.task.update({
      where: { id },
      data: { status: newStatus },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Task complete toggle error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث المهمة' },
      { status: 500 }
    )
  }
}
