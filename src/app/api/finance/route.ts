import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// GET /api/finance
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const [expenses, deposits] = await Promise.all([
      db.financeExpense.findMany({
        where: { userId: user.id },
        orderBy: { date: 'desc' },
      }),
      db.financeDeposit.findMany({
        where: { userId: user.id },
        orderBy: { date: 'desc' },
      }),
    ])

    return NextResponse.json({ expenses, deposits })
  } catch (error) {
    console.error('Finance GET error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

// POST /api/finance
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const body = await request.json()
    const { type, title, amount, category, source, date } = body

    if (!type || !title || !amount) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'المبلغ يجب أن يكون أكبر من صفر' }, { status: 400 })
    }

    if (type === 'expense') {
      const expense = await db.financeExpense.create({
        data: {
          title,
          amount: parseFloat(amount),
          category: category || 'other',
          date: date ? new Date(date) : new Date(),
          userId: user.id,
        },
      })
      return NextResponse.json({ transaction: expense }, { status: 201 })
    } else if (type === 'deposit') {
      const deposit = await db.financeDeposit.create({
        data: {
          title,
          amount: parseFloat(amount),
          source: source || 'other',
          date: date ? new Date(date) : new Date(),
          userId: user.id,
        },
      })
      return NextResponse.json({ transaction: deposit }, { status: 201 })
    }

    return NextResponse.json({ error: 'نوع المعاملة غير صالح' }, { status: 400 })
  } catch (error) {
    console.error('Finance POST error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
