import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const wishlist = await db.wishlistItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(wishlist)
  } catch (error) {
    console.error('Wishlist fetch error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب قائمة الأمنيات' },
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
        { error: 'العنوان مطلوب' },
        { status: 400 }
      )
    }

    const item = await db.wishlistItem.create({
      data: {
        title: body.title.trim(),
        userId: user.id,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Wishlist create error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إضافة العنصر' },
      { status: 500 }
    )
  }
}
