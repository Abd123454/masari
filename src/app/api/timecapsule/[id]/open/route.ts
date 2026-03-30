import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const capsule = await db.timeCapsule.findUnique({
      where: { id },
    })

    if (!capsule) {
      return NextResponse.json(
        { error: 'الكبسولة غير موجودة' },
        { status: 404 }
      )
    }

    if (capsule.isOpened) {
      return NextResponse.json(
        { error: 'تم فتح هذه الكبسولة بالفعل' },
        { status: 400 }
      )
    }

    const updated = await db.timeCapsule.update({
      where: { id },
      data: { isOpened: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('TimeCapsule open error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في فتح الكبسولة' },
      { status: 500 }
    )
  }
}
