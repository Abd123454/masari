import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isRandom = searchParams.get('random') === 'true'
    const hskLevel = searchParams.get('hskLevel')

    if (isRandom) {
      const where = hskLevel ? { hskLevel: parseInt(hskLevel) } : {}
      const count = await db.chineseWord.count({ where })
      if (count === 0) {
        return NextResponse.json(null)
      }
      const skip = Math.floor(Math.random() * count)
      const words = await db.chineseWord.findMany({
        take: 1,
        skip,
        where,
      })
      return NextResponse.json(words[0] || null)
    }

    const where: Record<string, unknown> = {}
    if (hskLevel) {
      where.hskLevel = parseInt(hskLevel)
    }

    const words = await db.chineseWord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(words)
  } catch (error) {
    console.error('Chinese words fetch error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الكلمات' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const word = await db.chineseWord.create({
      data: {
        chinese: body.chinese,
        pinyin: body.pinyin || '',
        arabic: body.arabic || '',
        hskLevel: body.hskLevel || 1,
      },
    })
    return NextResponse.json(word, { status: 201 })
  } catch (error) {
    console.error('Chinese word create error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الكلمة' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'معرف الكلمة مطلوب' }, { status: 400 })
    }
    await db.chineseWord.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Chinese word delete error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في حذف الكلمة' },
      { status: 500 }
    )
  }
}
