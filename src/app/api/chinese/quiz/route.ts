import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hskLevel = searchParams.get('hskLevel')

    const where: Record<string, unknown> = {}
    if (hskLevel) {
      where.hskLevel = parseInt(hskLevel)
    }

    const allWords = await db.chineseWord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    if (allWords.length < 4) {
      return NextResponse.json({ question: null, options: [], message: 'يجب أن يكون لديك 4 كلمات على الأقل لبدء الاختبار' })
    }

    // Shuffle and pick question + 3 wrong options
    const shuffled = [...allWords].sort(() => Math.random() - 0.5)
    const question = shuffled[0]
    const wrongOptions = shuffled.slice(1, 4)

    // Build 4 options with the correct answer
    const options = [
      { id: question.id, text: question.arabic, isCorrect: true },
      ...wrongOptions.map((w) => ({ id: w.id, text: w.arabic, isCorrect: false })),
    ].sort(() => Math.random() - 0.5)

    return NextResponse.json({
      question: {
        id: question.id,
        chinese: question.chinese,
        pinyin: question.pinyin,
        hskLevel: question.hskLevel,
      },
      options,
    })
  } catch (error) {
    console.error('Chinese quiz error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء السؤال' },
      { status: 500 }
    )
  }
}
