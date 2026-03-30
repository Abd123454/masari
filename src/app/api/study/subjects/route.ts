import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const subjects = await db.studySubject.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(subjects)
  } catch (error) {
    console.error('Study subjects fetch error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المواد الدراسية' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const subject = await db.studySubject.create({
      data: {
        name: body.name,
        color: body.color || '#388BFD',
        targetHours: body.targetHours || 0,
      },
    })
    return NextResponse.json(subject, { status: 201 })
  } catch (error) {
    console.error('Study subject create error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء المادة الدراسية' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'معرف المادة مطلوب' }, { status: 400 })
    }
    await db.studySubject.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Study subject delete error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في حذف المادة الدراسية' },
      { status: 500 }
    )
  }
}
