import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const body = await req.json()
    const { type, url, title, duration } = body

    if (!type || !['image', 'video'].includes(type)) {
      return NextResponse.json(
        { error: 'نوع الوسائط غير صالح' },
        { status: 400 }
      )
    }

    // For images, url (base64) is required
    if (type === 'image' && !url) {
      return NextResponse.json(
        { error: 'يرجى إرفاق الصورة' },
        { status: 400 }
      )
    }

    const media = await db.media.create({
      data: {
        type,
        url: url || '',
        title: title || null,
        userId: user.id,
      },
    })

    return NextResponse.json(media, { status: 201 })
  } catch (error) {
    console.error('Upload media error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في رفع الوسائط' },
      { status: 500 }
    )
  }
}
