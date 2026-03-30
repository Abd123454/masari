import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { id } = await params
    const subject = await db.tawjihiSubject.findFirst({
      where: { id, userId: user.id },
    })

    if (!subject) {
      return NextResponse.json({ error: 'المادة غير موجودة' }, { status: 404 })
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = {}

    if (typeof body.studiedHours === 'number') {
      updateData.studiedHours = Math.max(0, body.studiedHours)
    }
    if (typeof body.targetHours === 'number') {
      updateData.targetHours = Math.max(0, body.targetHours)
    }
    if (typeof body.name === 'string' && body.name.trim()) {
      updateData.name = body.name.trim()
    }

    const updated = await db.tawjihiSubject.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update tawjihi subject error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث المادة' },
      { status: 500 }
    )
  }
}
