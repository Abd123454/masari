import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// DELETE /api/finance/[id]
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

    // Try to find and delete as expense first, then as deposit
    const expense = await db.financeExpense.findFirst({
      where: { id, userId: user.id },
    })

    if (expense) {
      await db.financeExpense.delete({ where: { id } })
      return NextResponse.json({ success: true, type: 'expense' })
    }

    const deposit = await db.financeDeposit.findFirst({
      where: { id, userId: user.id },
    })

    if (deposit) {
      await db.financeDeposit.delete({ where: { id } })
      return NextResponse.json({ success: true, type: 'deposit' })
    }

    return NextResponse.json({ error: 'المعاملة غير موجودة' }, { status: 404 })
  } catch (error) {
    console.error('Finance DELETE error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
