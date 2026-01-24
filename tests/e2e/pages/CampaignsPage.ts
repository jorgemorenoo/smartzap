import { Page, Locator, expect } from '@playwright/test'
import type { TestCampaign } from '../fixtures'

/**
 * Page Object para a página de Campanhas
 * Encapsula listagem, criação e ações de campanhas
 */
export class CampaignsPage {
  readonly page: Page

  // Header e ações principais
  readonly pageTitle: Locator
  readonly createCampaignButton: Locator

  // Busca e filtros
  readonly searchInput: Locator
  readonly statusFilter: Locator
  readonly folderFilter: Locator
  readonly tagFilter: Locator

  // Lista de campanhas
  readonly campaignList: Locator
  readonly campaignCards: Locator

  // Paginação
  readonly nextPageButton: Locator
  readonly previousPageButton: Locator

  // Ações por campanha
  readonly startButton: Locator
  readonly pauseButton: Locator
  readonly resumeButton: Locator
  readonly duplicateButton: Locator
  readonly deleteButton: Locator

  // Modal de confirmação
  readonly confirmModal: Locator
  readonly confirmButton: Locator
  readonly cancelButton: Locator

  // Loading states
  readonly loadingSpinner: Locator

  constructor(page: Page) {
    this.page = page

    // Header
    this.pageTitle = page.getByRole('heading', { name: /campanhas/i })
    this.createCampaignButton = page.getByRole('button', { name: /criar campanha|nova campanha|\+/i })
      .or(page.getByRole('link', { name: /criar campanha|nova campanha/i }))

    // Busca e filtros
    this.searchInput = page.getByPlaceholder(/buscar/i)
    this.statusFilter = page.locator('select, [role="combobox"]').filter({ hasText: /status|todos/i })
    this.folderFilter = page.locator('select, [role="combobox"]').filter({ hasText: /pasta|folder/i })
    this.tagFilter = page.locator('select, [role="combobox"]').filter({ hasText: /tags/i })

    // Lista
    this.campaignList = page.locator('[role="list"], table, .grid')
    this.campaignCards = page.locator('[role="listitem"], tr, .campaign-card')

    // Paginação
    this.nextPageButton = page.getByRole('button', { name: /próxim|next|>/i })
    this.previousPageButton = page.getByRole('button', { name: /anterior|prev|</i })

    // Ações (ícones na linha da campanha)
    this.startButton = page.locator('button[title*="Iniciar"], button:has(svg)')
    this.pauseButton = page.locator('button[title*="Pausar"]')
    this.resumeButton = page.locator('button[title*="Retomar"]')
    this.duplicateButton = page.locator('button[title*="Clonar"], button[title*="Duplicar"]')
    this.deleteButton = page.locator('button[title*="Excluir"]')

    // Modal
    this.confirmModal = page.locator('[role="dialog"]')
    this.confirmButton = page.getByRole('button', { name: /confirmar|sim|ok/i })
    this.cancelButton = page.getByRole('button', { name: /cancelar|não/i })

    // Loading
    this.loadingSpinner = page.locator('.animate-spin, [role="status"]')
  }

  /**
   * Navega para a página de campanhas
   */
  async goto(): Promise<void> {
    await this.page.goto('/campaigns')
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Clica para criar nova campanha
   */
  async clickCreateCampaign(): Promise<void> {
    await this.createCampaignButton.click()
    await expect(this.page).toHaveURL(/\/campaigns\/new/, { timeout: 5000 })
  }

  /**
   * Busca campanhas por nome
   */
  async searchCampaign(query: string): Promise<void> {
    await this.searchInput.fill(query)
    await this.page.waitForTimeout(500) // Debounce
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Filtra por status
   */
  async filterByStatus(status: 'Todos' | 'Rascunho' | 'Agendado' | 'Enviando' | 'Concluído' | 'Pausado' | 'Falhou'): Promise<void> {
    await this.statusFilter.click()
    await this.page.getByRole('option', { name: status }).click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Verifica se uma campanha existe na lista
   */
  async campaignExists(name: string): Promise<boolean> {
    const campaign = this.page.locator('text=' + name)
    return await campaign.count() > 0
  }

  /**
   * Obtém contagem de campanhas na lista
   */
  async getCampaignCount(): Promise<number> {
    await this.page.waitForLoadState('networkidle')
    return await this.campaignCards.count()
  }

  /**
   * Clica em uma campanha para ver detalhes
   */
  async openCampaign(name: string): Promise<void> {
    const campaignRow = this.page.locator('tr, [role="listitem"]').filter({ hasText: name })
    await campaignRow.click()
    await expect(this.page).toHaveURL(/\/campaigns\/[a-z0-9-]+/, { timeout: 5000 })
  }

  /**
   * Inicia uma campanha (muda de DRAFT para SENDING)
   */
  async startCampaign(name: string): Promise<void> {
    const row = this.page.locator('tr, [role="listitem"]').filter({ hasText: name })
    const startBtn = row.locator('button[title*="Iniciar"]')
    await startBtn.click()

    // Pode ter confirmação
    if (await this.confirmModal.isVisible()) {
      await this.confirmButton.click()
    }
  }

  /**
   * Pausa uma campanha em envio
   */
  async pauseCampaign(name: string): Promise<void> {
    const row = this.page.locator('tr, [role="listitem"]').filter({ hasText: name })
    const pauseBtn = row.locator('button[title*="Pausar"]')
    await pauseBtn.click()

    if (await this.confirmModal.isVisible()) {
      await this.confirmButton.click()
    }
  }

  /**
   * Retoma uma campanha pausada
   */
  async resumeCampaign(name: string): Promise<void> {
    const row = this.page.locator('tr, [role="listitem"]').filter({ hasText: name })
    const resumeBtn = row.locator('button[title*="Retomar"]')
    await resumeBtn.click()

    if (await this.confirmModal.isVisible()) {
      await this.confirmButton.click()
    }
  }

  /**
   * Duplica uma campanha
   */
  async duplicateCampaign(name: string): Promise<void> {
    const row = this.page.locator('tr, [role="listitem"]').filter({ hasText: name })
    const duplicateBtn = row.locator('button[title*="Clonar"], button[title*="Duplicar"]')
    await duplicateBtn.click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Exclui uma campanha
   */
  async deleteCampaign(name: string): Promise<void> {
    const row = this.page.locator('tr, [role="listitem"]').filter({ hasText: name })
    const deleteBtn = row.locator('button[title*="Excluir"]')
    await deleteBtn.click()

    await this.confirmModal.waitFor({ state: 'visible' })
    await this.confirmButton.click()
    await this.confirmModal.waitFor({ state: 'hidden' })
  }

  /**
   * Obtém o status de uma campanha
   */
  async getCampaignStatus(name: string): Promise<string | null> {
    const row = this.page.locator('tr, [role="listitem"]').filter({ hasText: name })
    const statusBadge = row.locator('.badge, [class*="badge"]')
    return await statusBadge.textContent()
  }

  /**
   * Aguarda lista carregar
   */
  async waitForLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible' })
    await this.page.waitForLoadState('networkidle')
  }
}

/**
 * Page Object para o wizard de criação de campanha
 */
export class CampaignWizardPage {
  readonly page: Page

  // Navegação do wizard
  readonly stepIndicator: Locator
  readonly nextButton: Locator
  readonly backButton: Locator
  readonly cancelButton: Locator
  readonly launchButton: Locator

  // Step 1: Configuração
  readonly campaignNameInput: Locator
  readonly templateSelect: Locator
  readonly templateCards: Locator

  // Step 2: Público
  readonly allContactsOption: Locator
  readonly segmentsOption: Locator
  readonly contactCheckboxes: Locator

  // Step 3: Validação
  readonly warningsTable: Locator
  readonly skipWarningsCheckbox: Locator

  // Step 4: Agendamento
  readonly scheduleNowOption: Locator
  readonly scheduleForLaterOption: Locator
  readonly dateInput: Locator
  readonly timeInput: Locator

  constructor(page: Page) {
    this.page = page

    // Navegação
    this.stepIndicator = page.locator('[role="tablist"], .stepper')
    this.nextButton = page.getByRole('button', { name: /próxim|avançar|next/i })
    this.backButton = page.getByRole('button', { name: /voltar|back/i })
    this.cancelButton = page.getByRole('button', { name: /cancelar/i })
    this.launchButton = page.getByRole('button', { name: /lançar|enviar|criar campanha/i })

    // Step 1
    this.campaignNameInput = page.getByPlaceholder(/nome da campanha|campaign name/i)
      .or(page.locator('input[name="name"]'))
    this.templateSelect = page.locator('[role="combobox"]').filter({ hasText: /template/i })
    this.templateCards = page.locator('.template-card, [role="radio"]')

    // Step 2
    this.allContactsOption = page.getByLabel(/todos os contatos|all contacts/i)
      .or(page.locator('text=Todos os contatos'))
    this.segmentsOption = page.getByLabel(/segmentos|segments/i)
    this.contactCheckboxes = page.locator('input[type="checkbox"]')

    // Step 3
    this.warningsTable = page.locator('table').filter({ hasText: /aviso|warning/i })
    this.skipWarningsCheckbox = page.getByLabel(/ignorar|skip/i)

    // Step 4
    this.scheduleNowOption = page.getByLabel(/agora|now|imediatamente/i)
      .or(page.locator('text=Agora'))
    this.scheduleForLaterOption = page.getByLabel(/agendar|schedule|later/i)
    this.dateInput = page.locator('input[type="date"]')
    this.timeInput = page.locator('input[type="time"]').or(page.getByPlaceholder(/hh:mm/i))
  }

  /**
   * Navega para criação de nova campanha
   */
  async goto(): Promise<void> {
    await this.page.goto('/campaigns/new')
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Preenche o nome da campanha (Step 1)
   */
  async fillCampaignName(name: string): Promise<void> {
    await this.campaignNameInput.fill(name)
  }

  /**
   * Seleciona um template (Step 1)
   */
  async selectTemplate(templateName: string): Promise<void> {
    const templateCard = this.page.locator('.template-card, [role="radio"]').filter({ hasText: templateName })
    await templateCard.click()
  }

  /**
   * Avança para o próximo step
   */
  async nextStep(): Promise<void> {
    await this.nextButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Volta para o step anterior
   */
  async previousStep(): Promise<void> {
    await this.backButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Seleciona todos os contatos (Step 2)
   */
  async selectAllContacts(): Promise<void> {
    await this.allContactsOption.click()
  }

  /**
   * Seleciona agendar agora (Step 4)
   */
  async scheduleNow(): Promise<void> {
    await this.scheduleNowOption.click()
  }

  /**
   * Agenda para data/hora específica (Step 4)
   */
  async scheduleForLater(date: string, time: string): Promise<void> {
    await this.scheduleForLaterOption.click()
    await this.dateInput.fill(date)
    await this.timeInput.fill(time)
  }

  /**
   * Lança a campanha
   */
  async launch(): Promise<void> {
    await this.launchButton.click()
    // Aguarda redirecionamento para página de detalhes ou lista
    await expect(this.page).toHaveURL(/\/campaigns(\/[a-z0-9-]+)?$/, { timeout: 10000 })
  }

  /**
   * Cancela criação da campanha
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click()
    await expect(this.page).toHaveURL('/campaigns', { timeout: 5000 })
  }

  /**
   * Fluxo completo: cria campanha simples
   */
  async createSimpleCampaign(campaign: TestCampaign): Promise<void> {
    // Step 1: Nome e template
    await this.fillCampaignName(campaign.name)
    if (campaign.templateName) {
      await this.selectTemplate(campaign.templateName)
    }
    await this.nextStep()

    // Step 2: Público
    await this.selectAllContacts()
    await this.nextStep()

    // Step 3: Validação - apenas avança
    await this.nextStep()

    // Step 4: Agendar e lançar
    await this.scheduleNow()
    await this.launch()
  }

  /**
   * Verifica qual step está ativo
   */
  async getCurrentStep(): Promise<number> {
    // Busca pelo step ativo no indicador
    const steps = await this.page.locator('.step-active, [aria-current="step"]').count()
    return steps > 0 ? 1 : 0 // Simplificado
  }
}
