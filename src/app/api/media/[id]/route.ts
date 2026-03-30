import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { id } = await params

    const media = await db.media.findFirst({
      where: { id, userId: user.id },
    })

    if (!media) {
      return NextResponse.json(
        { error: 'الوسائط غير موجودة' },
        { status: 404 }
      )
    }

    await db.media.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete media error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في حذف الوسائط' },
      { status: 500 }
    )
  }
}
