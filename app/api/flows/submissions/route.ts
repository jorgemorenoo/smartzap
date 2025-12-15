import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { supabase } from '@/lib/supabase'

function clampInt(value: string | null, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(n)))
}

/**
 * GET /api/flows/submissions
 * Query params:
 * - flowId
 * - phone
 * - limit (default 50, max 200)
 */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams
    const flowId = sp.get('flowId')
    const phone = sp.get('phone')
    const limit = clampInt(sp.get('limit'), 1, 200, 50)

    let q = supabase
      .from('flow_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (flowId) q = q.eq('flow_id', flowId)
    if (phone) q = q.eq('from_phone', phone)

    const { data, error } = await q
    if (error) throw error

    return NextResponse.json(data || [], {
      headers: {
        'Cache-Control': 'private, no-store, no-cache, must-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })
  } catch (error) {
    console.error('Failed to fetch flow submissions:', error)
    return NextResponse.json({ error: 'Falha ao buscar submissions de Flow' }, { status: 500 })
  }
}
