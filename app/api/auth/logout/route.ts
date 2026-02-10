/**
 * Logout API
 * 
 * POST: Logout and clear session
 */

import { NextResponse } from 'next/server'
import { destroySession } from '@/lib/simple-auth'

export async function POST() {
  try {
    await destroySession()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[LOGOUT] Error:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer logout' },
      { status: 500 }
    )
  }
}
