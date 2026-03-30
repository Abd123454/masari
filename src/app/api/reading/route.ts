import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = { userId: user.id }
    if (status && status !== 'all') {
      where.status = status
    }

    const books = await db.readingBook.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(books)
  } catch (error) {
    console.error('Reading books fetch error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الكتب' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const body = await request.json()
    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: 'عنوان الكتاب مطلوب' },
        { status: 400 }
      )
    }

    const book = await db.readingBook.create({
      data: {
        title: body.title.trim(),
        author: body.author?.trim() || '',
        status: body.status || 'reading',
        progress: body.progress || 0,
        totalPages: body.totalPages || 0,
        userId: user.id,
      },
    })

    return NextResponse.json(book, { status: 201 })
  } catch (error) {
    console.error('Reading book create error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الكتاب' },
      { status: 500 }
    )
  }
}
