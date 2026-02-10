'use client'

/**
 * Login Page
 * 
 * Simple password login for single-tenant DaaS
 */

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Eye, EyeOff, LogIn } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [isConfigured, setIsConfigured] = useState(true)

  useEffect(() => {

    // Get company name from auth status
    fetch('/api/auth/status')
      .then(res => {
        return res.json()
      })
      .then(async (data) => {
        if (!data.isConfigured) {
          setIsConfigured(false)
          setError('Defina MASTER_PASSWORD nas variáveis de ambiente para habilitar o login.')
          return
        } else if (data.isAuthenticated) {
          router.push('/')
        } else if (data.company) {
          setCompanyName(data.company.name)
        }
      })
      .catch((err) => {
        console.error('🔍 [LOGIN] Auth status error:', err)
      })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!password) {
      setError('Digite sua senha')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login')
      }

      // Redirect to original destination or dashboard
      router.push(redirectTo)
      router.refresh()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-emerald-500 to-emerald-600 mb-4">
          <span className="text-3xl font-bold text-white">S</span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--ds-text-primary)]">
          {companyName || 'SmartZap'}
        </h1>
        <p className="text-[var(--ds-text-secondary)] mt-1">Entre para continuar</p>
      </div>

      {/* Configuration Warning */}
      {!isConfigured && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2">
            Configuração Necessária
          </h3>
          <p className="text-sm text-[var(--ds-text-secondary)] mb-3">
            Para acessar o sistema, configure a variável de ambiente <code className="px-2 py-0.5 rounded bg-[var(--ds-bg-surface)] text-[var(--ds-text-primary)] font-mono text-xs">MASTER_PASSWORD</code> no painel da Vercel ou no arquivo <code className="px-2 py-0.5 rounded bg-[var(--ds-bg-surface)] text-[var(--ds-text-primary)] font-mono text-xs">.env.local</code>.
          </p>
          <p className="text-xs text-[var(--ds-text-muted)]">
            Após configurar, reinicie o servidor de desenvolvimento ou faça redeploy na produção.
          </p>
        </div>
      )}

      {/* Card */}
      <div className="bg-[var(--ds-bg-elevated)] border border-[var(--ds-border-default)] rounded-2xl p-6 shadow-xl">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--ds-text-muted)]" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              name="password"
              autoComplete="current-password"
              className="w-full bg-[var(--ds-bg-surface)] border border-[var(--ds-border-default)] rounded-xl pl-11 pr-11 py-3 text-[var(--ds-text-primary)] placeholder:text-[var(--ds-text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ds-text-muted)] hover:text-[var(--ds-text-secondary)]"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <p className="mt-4 text-[var(--ds-status-error-text)] text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !isConfigured}
            className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Entrar
                <LogIn className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-[var(--ds-text-muted)] text-sm mt-6">
        SmartZap © {new Date().getFullYear()} |{' '}
        <a
          href="https://www.escoladeautomacao.com.br/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-emerald-500 transition-colors"
        >
          Escola de Automação
        </a>
        {' '}| by{' '}
        <a
          href="https://instagram.com/thaleslaray"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-emerald-500 transition-colors"
        >
          @thaleslaray
        </a>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--ds-bg-base)] flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
