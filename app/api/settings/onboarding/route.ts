import { NextResponse } from 'next/server'
import { settingsDb } from '@/lib/supabase-db'

const KEYS = {
  onboardingCompleted: 'onboarding_completed',
  permanentTokenConfirmed: 'permanent_token_confirmed',
}

/**
 * GET /api/settings/onboarding
 * Retorna o status do onboarding (completo + token permanente)
 */
export async function GET() {
  try {
    const [onboardingCompleted, permanentTokenConfirmed] = await Promise.all([
      settingsDb.get(KEYS.onboardingCompleted),
      settingsDb.get(KEYS.permanentTokenConfirmed),
    ])

    return NextResponse.json({
      onboardingCompleted: onboardingCompleted === 'true',
      permanentTokenConfirmed: permanentTokenConfirmed === 'true',
    })
  } catch (error) {
    console.error('Erro ao buscar settings de onboarding:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/settings/onboarding
 * Salva configurações do onboarding
 * Body: { onboardingCompleted?: boolean, permanentTokenConfirmed?: boolean }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { onboardingCompleted, permanentTokenConfirmed } = body

    const updates: Promise<void>[] = []

    if (typeof onboardingCompleted === 'boolean') {
      updates.push(settingsDb.set(KEYS.onboardingCompleted, onboardingCompleted ? 'true' : 'false'))
    }

    if (typeof permanentTokenConfirmed === 'boolean') {
      updates.push(settingsDb.set(KEYS.permanentTokenConfirmed, permanentTokenConfirmed ? 'true' : 'false'))
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo válido fornecido' },
        { status: 400 }
      )
    }

    await Promise.all(updates)

    return NextResponse.json({
      success: true,
      onboardingCompleted: typeof onboardingCompleted === 'boolean' ? onboardingCompleted : undefined,
      permanentTokenConfirmed: typeof permanentTokenConfirmed === 'boolean' ? permanentTokenConfirmed : undefined,
    })
  } catch (error) {
    console.error('Erro ao salvar settings de onboarding:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar configurações' },
      { status: 500 }
    )
  }
}
