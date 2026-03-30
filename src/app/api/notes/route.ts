import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const notes = await db.note.findMany({
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' },
      ],
    })
    return NextResponse.json(notes)
  } catch (error) {
    console.error('Notes fetch error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الملاحظات' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const note = await db.note.create({
      data: {
        title: body.title,
        content: body.content || '',
        color: body.color || '#1a1a2e',
        isPinned: body.isPinned || false,
        userId: body.userId,
      },
    })
    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('Note create error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الملاحظة' },
      { status: 500 }
    )
  }
}
