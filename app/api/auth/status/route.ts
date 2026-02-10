/**
 * Auth Status API
 * 
 * GET: Check current auth status (setup complete? authenticated? configured?)
 */

import { NextResponse } from 'next/server'
import { getUserAuthStatus } from '@/lib/user-auth'

// Este endpoint controla redirects do login.
// No Edge, env vars/SDK podem se comportar diferente e fazer isSetup/isAuthenticated
// voltarem como false, gerando loop para o wizard.
export const runtime = 'nodejs'

// Evita cache/stale data (status de sessão/setup precisa ser sempre atual)
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const isProd = process.env.NODE_ENV === 'production'
    const log = (...args: any[]) => {
      if (!isProd) console.log(...args)
    }

    log('🔍 [AUTH-STATUS] === START ===')
    // Check if MASTER_PASSWORD is configured
    log('🔍 [AUTH-STATUS] MASTER_PASSWORD exists:', !!process.env.MASTER_PASSWORD)
    log('🔍 [AUTH-STATUS] VERCEL_TOKEN exists:', !!process.env.VERCEL_TOKEN)
    log('🔍 [AUTH-STATUS] SETUP_COMPLETE exists:', !!process.env.SETUP_COMPLETE)
    const isConfigured = !!process.env.MASTER_PASSWORD

    if (!isConfigured) {
      log('🔍 [AUTH-STATUS] Not configured - MASTER_PASSWORD missing')
      return NextResponse.json({
        isConfigured: false,
        needsSetup: true,
        isSetup: false,
        isAuthenticated: false,
        company: null,
        message: 'Configure MASTER_PASSWORD in environment variables to enable login'
      })
    }

    log('🔍 [AUTH-STATUS] Calling getUserAuthStatus...')
    const status = await getUserAuthStatus()
    log('🔍 [AUTH-STATUS] getUserAuthStatus result:', JSON.stringify(status, null, 2))

    const response = {
      isConfigured: true,
      isSetup: status.isSetup,
      isAuthenticated: status.isAuthenticated,
      company: status.company
    }

    log('🔍 [AUTH-STATUS] Final response:', JSON.stringify(response, null, 2))
    return NextResponse.json(response)
  } catch (error) {
    console.error('Auth status error:', error)
    return NextResponse.json(
      { error: 'Failed to check auth status' },
      { status: 500 }
    )
  }
}
