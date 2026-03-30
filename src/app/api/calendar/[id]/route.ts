import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// DELETE /api/calendar/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { id } = await params

    const event = await db.calendarEvent.findFirst({
      where: { id, userId: user.id },
    })

    if (!event) {
      return NextResponse.json({ error: 'الحدث غير موجود' }, { status: 404 })
    }

    await db.calendarEvent.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Calendar DELETE error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
