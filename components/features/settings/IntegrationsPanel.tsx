'use client'

import { Settings, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface Integration {
  name: string
  description: string
  status: 'connected' | 'disconnected' | 'error'
  required: boolean
  configPath?: string
}

export function IntegrationsPanel() {
  const integrations: Integration[] = [
    {
      name: 'QStash',
      description: 'Agendamento de campanhas e workflows',
      status: process.env.NEXT_PUBLIC_QSTASH_CONFIGURED === 'true' ? 'connected' : 'disconnected',
      required: true,
    },
    {
      name: 'Redis',
      description: 'Cache e filas de processamento',
      status: process.env.NEXT_PUBLIC_REDIS_CONFIGURED === 'true' ? 'connected' : 'disconnected',
      required: true,
    },
    {
      name: 'Evolution API',
      description: 'Conexão com WhatsApp',
      status: 'disconnected',
      required: false,
      configPath: '/settings#webhooks',
    },
  ]

  const getStatusIcon = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-amber-500" />
    }
  }

  const getStatusText = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return <span className="text-sm text-emerald-600 dark:text-emerald-400">Conectado</span>
      case 'error':
        return <span className="text-sm text-red-600 dark:text-red-400">Erro</span>
      default:
        return <span className="text-sm text-amber-600 dark:text-amber-400">Não configurado</span>
    }
  }

  const allConnected = integrations.filter(i => i.required).every(i => i.status === 'connected')

  return (
    <div className="bg-[var(--ds-bg-elevated)] border border-[var(--ds-border-default)] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--ds-text-primary)]">Integrações</h2>
            <p className="text-sm text-[var(--ds-text-secondary)]">
              Configure os serviços essenciais para o funcionamento do sistema
            </p>
          </div>
        </div>
        {!allConnected && (
          <div className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              Configuração pendente
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {integrations.map((integration) => (
          <div
            key={integration.name}
            className="flex items-center justify-between p-4 rounded-xl bg-[var(--ds-bg-surface)] border border-[var(--ds-border-default)] hover:border-[var(--ds-border-hover)] transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              {getStatusIcon(integration.status)}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-[var(--ds-text-primary)]">
                    {integration.name}
                  </h3>
                  {integration.required && (
                    <span className="text-xs px-2 py-0.5 rounded bg-[var(--ds-bg-elevated)] text-[var(--ds-text-muted)]">
                      Obrigatório
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--ds-text-secondary)] mt-0.5">
                  {integration.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusText(integration.status)}
              {integration.status !== 'connected' && (
                <a
                  href={integration.configPath || '/settings'}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
                >
                  Configurar
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {!allConnected && (
        <div className="mt-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <p className="text-sm text-[var(--ds-text-secondary)]">
            Configure as integrações obrigatórias para habilitar o envio de campanhas e workflows.
            As variáveis de ambiente devem ser definidas no painel da Vercel ou no arquivo .env.local.
          </p>
        </div>
      )}
    </div>
  )
}
