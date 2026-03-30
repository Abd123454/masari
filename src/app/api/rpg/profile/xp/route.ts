import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

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

    const xpToAdd = 50
    const newXp = profile.xp + xpToAdd
    let newLevel = profile.level
    let xpNeeded = newLevel * 100
    let remainingXp = newXp
    let leveledUp = false

    while (remainingXp >= xpNeeded) {
      remainingXp -= xpNeeded
      newLevel++
      leveledUp = true
      xpNeeded = newLevel * 100
    }

    const newMaxHp = 100 + (newLevel - 1) * 20
    const classStats = getClassStats(profile.className, newLevel)

    const updated = await db.userRPG.update({
      where: { userId: user.id },
      data: {
        xp: remainingXp,
        level: newLevel,
        maxHp: newMaxHp,
        currentHp: newMaxHp,
        strength: classStats.strength,
        intelligence: classStats.intelligence,
        wisdom: classStats.wisdom,
      },
    })

    return NextResponse.json({
      ...updated,
      xpNeeded,
      xpAdded: xpToAdd,
      leveledUp,
    })
  } catch (error) {
    console.error('RPG XP add error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إضافة الخبرة' },
      { status: 500 }
    )
  }
}

function getClassStats(className: string, level: number) {
  const base = 10 + (level - 1) * 2
  switch (className) {
    case 'Warrior':
      return { strength: base + 5, intelligence: base - 2, wisdom: base }
    case 'Mage':
      return { strength: base - 2, intelligence: base + 5, wisdom: base }
    case 'Healer':
      return { strength: base, intelligence: base, wisdom: base + 5 }
    default:
      return { strength: base, intelligence: base, wisdom: base }
  }
}
