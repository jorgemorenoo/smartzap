import { Page, Locator, expect } from '@playwright/test'
import type { TestCredentials } from '../fixtures'

/**
 * Page Object para a página de Configurações
 * Encapsula configurações de credenciais WhatsApp e outras settings
 */
export class SettingsPage {
  readonly page: Page

  // Título da página
  readonly pageTitle: Locator

  // Campos de credenciais WhatsApp
  readonly phoneNumberIdInput: Locator
  readonly wabaIdInput: Locator
  readonly accessTokenInput: Locator
  readonly metaAppIdInput: Locator

  // Botões de ação
  readonly saveButton: Locator
  readonly testConnectionButton: Locator
  readonly disconnectButton: Locator

  // Status de conexão
  readonly connectionStatus: Locator
  readonly connectedBadge: Locator
  readonly disconnectedBadge: Locator

  // Mensagens de feedback
  readonly successToast: Locator
  readonly errorToast: Locator
  readonly errorMessage: Locator

  // Seções expandíveis
  readonly webhookSection: Locator
  readonly throttleSection: Locator
  readonly aiSection: Locator

  constructor(page: Page) {
    this.page = page

    // Título
    this.pageTitle = page.getByRole('heading', { name: /configurações|settings/i })

    // Campos de credenciais - busca por placeholder ou label
    this.phoneNumberIdInput = page.getByPlaceholder(/298347293847|phone.*id/i)
    this.wabaIdInput = page.getByPlaceholder(/987234987234|waba.*id/i)
    this.accessTokenInput = page.locator('input[type="password"]').filter({
      has: page.locator('[placeholder*="EAAG"], [placeholder*="token"]'),
    }).or(page.getByPlaceholder(/EAAG|token/i))
    this.metaAppIdInput = page.getByPlaceholder(/123456789012345|app.*id/i)

    // Botões
    this.saveButton = page.getByRole('button', { name: /salvar/i })
    this.testConnectionButton = page.getByRole('button', { name: /testar conexão|test connection/i })
    this.disconnectButton = page.getByRole('button', { name: /desconectar/i })

    // Status
    this.connectionStatus = page.locator('text=Conectado, text=Desconectado')
    this.connectedBadge = page.locator('text=Conectado').or(page.locator('.bg-green-500, .bg-emerald-500'))
    this.disconnectedBadge = page.locator('text=Desconectado').or(page.locator('.bg-red-500, .bg-destructive'))

    // Toasts (Sonner)
    this.successToast = page.locator('[data-sonner-toast]').filter({ hasText: /sucesso|salvo|saved/i })
    this.errorToast = page.locator('[data-sonner-toast]').filter({ hasText: /erro|falha|error/i })
    this.errorMessage = page.locator('p, span').filter({ hasText: /erro|inválido|falha/i })

    // Seções
    this.webhookSection = page.locator('text=Webhook')
    this.throttleSection = page.locator('text=Throttle')
    this.aiSection = page.locator('text=Agente IA, text=AI Agent')
  }

  /**
   * Navega para a página de configurações
   */
  async goto(): Promise<void> {
    await this.page.goto('/settings')
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Preenche as credenciais do WhatsApp
   */
  async fillCredentials(credentials: TestCredentials): Promise<void> {
    // Limpa e preenche Phone Number ID
    await this.phoneNumberIdInput.clear()
    await this.phoneNumberIdInput.fill(credentials.phoneNumberId)

    // Limpa e preenche WABA ID
    await this.wabaIdInput.clear()
    await this.wabaIdInput.fill(credentials.wabaId)

    // Limpa e preenche Access Token
    await this.accessTokenInput.clear()
    await this.accessTokenInput.fill(credentials.accessToken)

    // Preenche Meta App ID se fornecido
    if (credentials.metaAppId) {
      await this.metaAppIdInput.clear()
      await this.metaAppIdInput.fill(credentials.metaAppId)
    }
  }

  /**
   * Salva as configurações
   */
  async save(): Promise<void> {
    await this.saveButton.click()
  }

  /**
   * Salva e aguarda confirmação de sucesso
   */
  async saveAndWaitForSuccess(): Promise<void> {
    await this.save()
    await this.successToast.waitFor({ state: 'visible', timeout: 10000 })
  }

  /**
   * Testa a conexão com a API do WhatsApp
   */
  async testConnection(): Promise<void> {
    await this.testConnectionButton.click()
  }

  /**
   * Verifica se a conexão está ativa
   */
  async isConnected(): Promise<boolean> {
    try {
      await this.connectedBadge.waitFor({ state: 'visible', timeout: 3000 })
      return true
    } catch {
      return false
    }
  }

  /**
   * Verifica se há erro de conexão
   */
  async hasConnectionError(): Promise<boolean> {
    try {
      await this.errorMessage.waitFor({ state: 'visible', timeout: 3000 })
      return true
    } catch {
      return false
    }
  }

  /**
   * Obtém mensagem de erro, se houver
   */
  async getErrorMessage(): Promise<string | null> {
    try {
      await this.errorMessage.waitFor({ state: 'visible', timeout: 3000 })
      return await this.errorMessage.textContent()
    } catch {
      return null
    }
  }

  /**
   * Desconecta da API do WhatsApp
   */
  async disconnect(): Promise<void> {
    await this.disconnectButton.click()
  }

  /**
   * Expande uma seção específica
   */
  async expandSection(section: 'webhook' | 'throttle' | 'ai'): Promise<void> {
    const sectionLocator = {
      webhook: this.webhookSection,
      throttle: this.throttleSection,
      ai: this.aiSection,
    }[section]

    await sectionLocator.click()
  }

  /**
   * Verifica se a página de settings está visível
   */
  async isVisible(): Promise<boolean> {
    await this.page.waitForLoadState('domcontentloaded')
    // Verifica se estamos na URL de settings ou se o título está visível
    const url = this.page.url()
    return url.includes('/settings')
  }

  /**
   * Aguarda a página carregar completamente
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle')
    // Aguarda pelo menos um campo de credencial estar visível
    await this.phoneNumberIdInput.or(this.wabaIdInput).waitFor({ state: 'visible', timeout: 10000 })
  }
}
