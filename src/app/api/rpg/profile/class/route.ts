import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

const CLASSES = ['Warrior', 'Mage', 'Healer'] as const

export async function POST() {
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

    const currentIdx = CLASSES.indexOf(profile.className as typeof CLASSES[number])
    const nextIdx = (currentIdx + 1) % CLASSES.length
    const newClass = CLASSES[nextIdx]

    const level = profile.level
    const base = 10 + (level - 1) * 2

    let strength = base
    let intelligence = base
    let wisdom = base

    switch (newClass) {
      case 'Warrior':
        strength = base + 5
        intelligence = base - 2
        wisdom = base
        break
      case 'Mage':
        strength = base - 2
        intelligence = base + 5
        wisdom = base
        break
      case 'Healer':
        strength = base
        intelligence = base
        wisdom = base + 5
        break
    }

    const updated = await db.userRPG.update({
      where: { userId: user.id },
      data: {
        className: newClass,
        strength,
        intelligence,
        wisdom,
      },
    })

    return NextResponse.json({
      ...updated,
      xpNeeded: level * 100,
    })
  } catch (error) {
    console.error('RPG class change error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تغيير الفئة' },
      { status: 500 }
    )
  }
}
