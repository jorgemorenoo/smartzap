/**
 * Supabase Client
 * 
 * PostgreSQL database with connection pooling and RLS
 * Banco principal do SmartZap (PostgreSQL + RLS)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

function getSupabasePublishableKey(): string | undefined {
    return (
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
}

function getSupabaseServiceRoleKey(): string | undefined {
    return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
}

// Server-side client with service role (full access, bypasses RLS)
let _supabaseAdmin: SupabaseClient | null = null

/**
 * Returns a Supabase server-side client with Service Role (bypasses RLS).
 * Returns null when environment variables are not configured.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const key = getSupabaseServiceRoleKey()

    if (!url || !key) {
        return null
    }

    if (!_supabaseAdmin) {
        _supabaseAdmin = createClient(url, key, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })
    }
    return _supabaseAdmin
}

// Client-side client with anon key (respects RLS)
let _supabaseBrowser: SupabaseClient | null = null

/**
 * Returns a Supabase browser client (respects RLS).
 * Returns null when not configured.
 */
export function getSupabaseBrowser(): SupabaseClient | null {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = getSupabasePublishableKey()

    if (!url || !key) {
        return null
    }

    if (!_supabaseBrowser) {
        _supabaseBrowser = createClient(url, key)
    }
    return _supabaseBrowser
}

/**
 * Supabase facade - backwards compatible export
 */
export const supabase = {
    get admin() {
        return getSupabaseAdmin()
    },
    get browser() {
        return getSupabaseBrowser()
    },
    from: (table: string) => {
        const client = getSupabaseAdmin()
        if (!client) {
            // Return a mock that returns errors instead of throwing
            const mockError = { message: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' }
            return {
                select: () => Promise.resolve({ data: null, error: mockError }),
                insert: () => Promise.resolve({ data: null, error: mockError }),
                update: () => Promise.resolve({ data: null, error: mockError }),
                delete: () => Promise.resolve({ data: null, error: mockError }),
                upsert: () => Promise.resolve({ data: null, error: mockError }),
                eq: function() { return this },
                single: function() { return this },
                limit: function() { return this },
            } as any
        }
        return client.from(table)
    },
    rpc: (fn: string, params?: object) => {
        const client = getSupabaseAdmin()
        if (!client) {
            return Promise.resolve({ 
                data: null, 
                error: { message: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' } 
            })
        }
        return client.rpc(fn, params)
    },
}

/**
 * Check Supabase connectivity
 */
export async function checkSupabaseConnection(): Promise<{
    connected: boolean
    latency?: number
    error?: string
}> {
    try {
        const client = getSupabaseAdmin()
        if (!client) {
            return { connected: false, error: 'Supabase not configured' }
        }
        const start = Date.now()
        const { error } = await client
            .from('campaigns')
            .select('count')
            .limit(1)

        if (error && !error.message.includes('relation "campaigns" does not exist')) {
            return { connected: false, error: error.message }
        }

        return { connected: true, latency: Date.now() - start }
    } catch (err) {
        return {
            connected: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        }
    }
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const publishableKey = getSupabasePublishableKey()
    const secretKey = getSupabaseServiceRoleKey()
    return !!(url && publishableKey && secretKey)
}
