/**
 * Login API
 * 
 * POST: Login with password
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, createSession } from '@/lib/simple-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body
    
    if (!password) {
      return NextResponse.json(
        { error: 'Senha é obrigatória' },
        { status: 400 }
      )
    }
    
    // Check if MASTER_PASSWORD is configured
    if (!process.env.MASTER_PASSWORD) {
      console.error('[LOGIN] MASTER_PASSWORD não configurado')
      return NextResponse.json(
        { 
          error: 'Sistema não configurado. Configure MASTER_PASSWORD nas variáveis de ambiente.',
          needsConfiguration: true
        },
        { status: 503 }
      )
    }
    
    // Verify password using simple auth (no database required)
    const isValid = await verifyPassword(password)
    
    if (!isValid) {
      console.log('[LOGIN] Senha incorreta')
      return NextResponse.json(
        { error: 'Senha incorreta' },
        { status: 401 }
      )
    }
    
    // Create session
    await createSession()
    
    console.log('[LOGIN] Login bem-sucedido')
    return NextResponse.json({
      success: true,
      company: { name: 'SmartZap' }
    })
    
  } catch (error) {
    console.error('[LOGIN] Erro inesperado:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    )
  }
}
