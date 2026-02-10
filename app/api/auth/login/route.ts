/**
 * Login API
 * 
 * POST: Login with password
 */

import { NextRequest, NextResponse } from 'next/server'
import { loginUser, isSetupComplete } from '@/lib/user-auth'

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
    const masterPassword = process.env.MASTER_PASSWORD
    
    if (!masterPassword) {
      console.error('[LOGIN] MASTER_PASSWORD não configurado nas variáveis de ambiente')
      return NextResponse.json(
        { 
          error: 'Sistema não configurado. Configure a variável MASTER_PASSWORD nas variáveis de ambiente da Vercel.',
          needsConfiguration: true
        },
        { status: 503 }
      )
    }
    
    const result = await loginUser(password)
    
    if (!result.success) {
      console.log('[LOGIN] Falha na autenticação:', result.error)
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
    }
    
    console.log('[LOGIN] Login bem-sucedido')
    return NextResponse.json({
      success: true,
      company: result.company
    })
    
  } catch (error) {
    console.error('[LOGIN] Erro inesperado:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    )
  }
}
