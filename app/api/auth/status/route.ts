/**
 * Auth Status API
 * 
 * GET: Check current auth status (setup complete? authenticated? configured?)
 */

import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/simple-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const masterPassword = process.env.MASTER_PASSWORD
    const authenticated = await isAuthenticated()
    
    return NextResponse.json({
      isConfigured: !!masterPassword,
      isAuthenticated: authenticated,
      isSetup: !!masterPassword,
      company: authenticated ? { name: 'SmartZap' } : null,
    })
  } catch (error) {
    console.error('[AUTH-STATUS] Error:', error)
    return NextResponse.json(
      { 
        isConfigured: false,
        isAuthenticated: false,
        isSetup: false,
        company: null,
      },
      { status: 500 }
    )
  }
}
