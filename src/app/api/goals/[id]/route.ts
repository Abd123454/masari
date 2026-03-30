import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// GET /api/goals/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { id } = await params

    const goal = await db.goal.findFirst({
      where: { id, userId: user.id },
    })

    if (!goal) {
      return NextResponse.json({ error: 'الهدف غير موجود' }, { status: 404 })
    }

    return NextResponse.json({ goal })
  } catch (error) {
    console.error('Goal GET error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

// PATCH /api/goals/[id]
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
    const body = await request.json()
    const { progress } = body

    if (progress === undefined || progress < 0 || progress > 100) {
      return NextResponse.json({ error: 'قيمة التقدم غير صالحة (0-100)' }, { status: 400 })
    }

    const goal = await db.goal.findFirst({
      where: { id, userId: user.id },
    })

    if (!goal) {
      return NextResponse.json({ error: 'الهدف غير موجود' }, { status: 404 })
    }

    const updated = await db.goal.update({
      where: { id },
      data: { progress: Math.min(100, Math.max(0, progress)) },
    })

    return NextResponse.json({ goal: updated })
  } catch (error) {
    console.error('Goal PATCH error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

// DELETE /api/goals/[id]
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

    const goal = await db.goal.findFirst({
      where: { id, userId: user.id },
    })

    if (!goal) {
      return NextResponse.json({ error: 'الهدف غير موجود' }, { status: 404 })
    }

    await db.goal.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Goal DELETE error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
