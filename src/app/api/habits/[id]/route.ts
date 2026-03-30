import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const habit = await db.habit.findUnique({
      where: { id },
      include: { completions: true },
    })
    if (!habit) {
      return NextResponse.json(
        { error: 'العادة غير موجودة' },
        { status: 404 }
      )
    }
    return NextResponse.json(habit)
  } catch (error) {
    console.error('Habit fetch error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب العادة' },
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
    await db.habit.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Habit delete error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في حذف العادة' },
      { status: 500 }
    )
  }
}
