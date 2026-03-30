import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    let profile = await db.userRPG.findUnique({
      where: { userId: user.id },
    })

    if (!profile) {
      profile = await db.userRPG.create({
        data: {
          userId: user.id,
          level: 1,
          xp: 0,
          className: 'Warrior',
          maxHp: 100,
          currentHp: 100,
          strength: 10,
          intelligence: 10,
          wisdom: 10,
        },
      })
    }

    return NextResponse.json({
      ...profile,
      xpNeeded: profile.level * 100,
    })
  } catch (error) {
    console.error('RPG profile fetch error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الشخصية' },
      { status: 500 }
    )
  }
}
