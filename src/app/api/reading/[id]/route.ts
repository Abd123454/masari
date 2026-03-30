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
    const book = await db.readingBook.findUnique({ where: { id } })

    if (!book || book.userId !== user.id) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = {}

    if (typeof body.progress === 'number') {
      updateData.progress = Math.max(0, body.progress)
    }
    if (typeof body.totalPages === 'number') {
      updateData.totalPages = Math.max(0, body.totalPages)
    }
    if (typeof body.rating === 'number') {
      updateData.rating = Math.max(0, Math.min(5, body.rating))
    }
    if (typeof body.status === 'string') {
      updateData.status = body.status
      // Auto-complete when status changes to completed
      if (body.status === 'completed' && book.totalPages > 0) {
        updateData.progress = book.totalPages
      }
    }
    if (typeof body.title === 'string' && body.title.trim()) {
      updateData.title = body.title.trim()
    }
    if (typeof body.author === 'string') {
      updateData.author = body.author.trim()
    }

    const updated = await db.readingBook.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Reading book update error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث الكتاب' },
      { status: 500 }
    )
  }
}

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
    const book = await db.readingBook.findUnique({ where: { id } })

    if (!book || book.userId !== user.id) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
    }

    await db.readingBook.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reading book delete error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في حذف الكتاب' },
      { status: 500 }
    )
  }
}
