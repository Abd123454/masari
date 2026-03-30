import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const mediaType = searchParams.get('mediaType')

    const where: Record<string, string> = { userId: user.id }
    if (mediaType) {
      where.type = mediaType
    }

    const media = await db.media.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(media)
  } catch (error) {
    console.error('Get media error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الوسائط' },
      { status: 500 }
    )
  }
}
