import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const [wishlist, futureMessage] = await Promise.all([
      db.wishlistItem.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      }),
      db.note.findFirst({
        where: { userId: user.id, title: 'رسالة لنفسك' },
      }),
    ])

    return NextResponse.json({
      wishlist,
      futureMessage: futureMessage?.content || '',
    })
  } catch (error) {
    console.error('Motivation fetch error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب البيانات' },
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
    const { futureMessage } = body

    if (typeof futureMessage !== 'string' || !futureMessage.trim()) {
      return NextResponse.json(
        { error: 'الرسالة مطلوبة' },
        { status: 400 }
      )
    }

    // Upsert the future message as a note
    const existing = await db.note.findFirst({
      where: { userId: user.id, title: 'رسالة لنفسك' },
    })

    if (existing) {
      await db.note.update({
        where: { id: existing.id },
        data: { content: futureMessage.trim() },
      })
    } else {
      await db.note.create({
        data: {
          title: 'رسالة لنفسك',
          content: futureMessage.trim(),
          userId: user.id,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Motivation save error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في حفظ الرسالة' },
      { status: 500 }
    )
  }
}
