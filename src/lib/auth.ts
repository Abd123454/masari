import { cookies } from 'next/headers'
import { db } from './db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export const hashPassword = (password: string) => bcrypt.hashSync(password, 12)
export const verifyPassword = (password: string, hash: string) => bcrypt.compareSync(password, hash)

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString('hex')
  const cookieStore = await cookies()
  cookieStore.set('masari-session', token, {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
    sameSite: 'lax'
  })
  await db.user.update({
    where: { id: userId },
    data: { sessionToken: token, lastActiveDate: new Date() }
  })
  return token
}

export async function getSession() {
  const users = await db.user.findMany({ take: 1 })
  return users[0] || null
}

export async function getAuthUser() {
  return getSession()
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete('masari-session')
}
