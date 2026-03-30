import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.sleepLog.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Sleep delete error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في حذف سجل النوم' },
      { status: 500 }
    )
  }
}
