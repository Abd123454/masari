import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const note = await db.note.findUnique({ where: { id } })
    if (!note) {
      return NextResponse.json(
        { error: 'الملاحظة غير موجودة' },
        { status: 404 }
      )
    }
    return NextResponse.json(note)
  } catch (error) {
    console.error('Note fetch error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الملاحظة' },
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

    const note = await db.note.update({
      where: { id },
      data: {
        title: body.title,
        content: body.content !== undefined ? body.content : undefined,
        color: body.color,
        isPinned: body.isPinned !== undefined ? body.isPinned : undefined,
      },
    })
    return NextResponse.json(note)
  } catch (error) {
    console.error('Note update error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث الملاحظة' },
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
    await db.note.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Note delete error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في حذف الملاحظة' },
      { status: 500 }
    )
  }
}
