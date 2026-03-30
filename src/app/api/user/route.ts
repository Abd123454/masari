import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const account = await db.account.findFirst({
      where: { userId: user.id }
    })

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: account?.email || null,
      avatar: user.avatar,
      createdAt: user.createdAt
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب بيانات المستخدم' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const body = await req.json()
    const { name } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'يرجى إدخال الاسم' },
        { status: 400 }
      )
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { name: name.trim() },
    })

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث البيانات' },
      { status: 500 }
    )
  }
}
