import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _adminClient: SupabaseClient | null = null

function getSupabaseServiceRoleKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
}

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = getSupabaseServiceRoleKey()

  if (!url || !key) {
    console.warn('[getSupabaseAdmin] Missing config:', { hasUrl: !!url, hasKey: !!key })
    return null
  }

  if (!_adminClient) {
    _adminClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  }
  return _adminClient
}

// Mock responses when Supabase not configured
const mockError = { code: 'SUPABASE_NOT_CONFIGURED', message: 'Supabase not configured' }
const mockResponse = { data: null, error: mockError }

export const supabase = {
  from: (table: string) => {
    const client = getSupabaseAdmin()
    if (!client) {
      console.warn('[supabase.from] Not configured, returning mock')
      return {
        select: () => Promise.resolve(mockResponse),
        insert: () => Promise.resolve(mockResponse),
        update: () => Promise.resolve(mockResponse),
        delete: () => Promise.resolve(mockResponse),
        upsert: () => Promise.resolve(mockResponse),
        eq: () => ({ single: () => Promise.resolve(mockResponse) }),
        single: () => Promise.resolve(mockResponse),
      } as any
    }
    return client.from(table)
  },
  rpc: (fn: string, params?: object) => {
    const client = getSupabaseAdmin()
    if (!client) {
      console.warn('[supabase.rpc] Not configured, returning mock')
      return Promise.resolve(mockResponse) as any
    }
    return client.rpc(fn, params)
  },
}
