import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const subjects = await db.tawjihiSubject.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(subjects)
  } catch (error) {
    console.error('Get tawjihi subjects error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المواد' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const body = await req.json()
    const { name, targetHours } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'يرجى إدخال اسم المادة' },
        { status: 400 }
      )
    }

    const subject = await db.tawjihiSubject.create({
      data: {
        name: name.trim(),
        targetHours: parseInt(targetHours) || 20,
        userId: user.id,
      },
    })

    return NextResponse.json(subject, { status: 201 })
  } catch (error) {
    console.error('Create tawjihi subject error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إضافة المادة' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'يرجى تحديد المادة' },
        { status: 400 }
      )
    }

    const subject = await db.tawjihiSubject.findFirst({
      where: { id, userId: user.id },
    })

    if (!subject) {
      return NextResponse.json(
        { error: 'المادة غير موجودة' },
        { status: 404 }
      )
    }

    await db.tawjihiSubject.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete tawjihi subject error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في حذف المادة' },
      { status: 500 }
    )
  }
}
