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
    const item = await db.wishlistItem.findUnique({ where: { id } })

    if (!item || item.userId !== user.id) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
    }

    const updated = await db.wishlistItem.update({
      where: { id },
      data: { completed: !item.completed },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Wishlist toggle error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث العنصر' },
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
    const item = await db.wishlistItem.findUnique({ where: { id } })

    if (!item || item.userId !== user.id) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
    }

    await db.wishlistItem.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Wishlist delete error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في حذف العنصر' },
      { status: 500 }
    )
  }
}
