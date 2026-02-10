import { cookies } from 'next/headers'
import * as crypto from 'crypto'

const SESSION_COOKIE_NAME = 'smartzap-session'
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Simple authentication without database dependency
 * Uses only MASTER_PASSWORD from environment variables
 */

export async function verifyPassword(password: string): Promise<boolean> {
  const masterPassword = process.env.MASTER_PASSWORD
  
  if (!masterPassword) {
    console.error('[simple-auth] MASTER_PASSWORD not configured')
    return false
  }

  // Direct comparison or SHA-256 hash comparison
  if (password === masterPassword) {
    return true
  }

  // Try hash comparison if MASTER_PASSWORD is a hash
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex')
  return passwordHash === masterPassword
}

export async function createSession(): Promise<string> {
  const sessionId = crypto.randomBytes(32).toString('hex')
  const expiresAt = Date.now() + SESSION_DURATION
  
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  })

  return sessionId
}

export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE_NAME)
  return session?.value || null
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return !!session
}
