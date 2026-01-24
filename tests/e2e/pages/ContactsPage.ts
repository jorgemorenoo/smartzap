import { Page, Locator, expect } from '@playwright/test'
import type { TestContact } from '../fixtures'

/**
 * Page Object para a página de Contatos
 * Encapsula CRUD de contatos e operações de listagem
 */
export class ContactsPage {
  readonly page: Page

  // Header e ações principais
  readonly pageTitle: Locator
  readonly newContactButton: Locator
  readonly importButton: Locator
  readonly exportButton: Locator

  // Busca e filtros
  readonly searchInput: Locator
  readonly statusFilter: Locator
  readonly tagFilter: Locator

  // Tabela/Lista
  readonly contactTable: Locator
  readonly contactRows: Locator
  readonly selectAllCheckbox: Locator
  readonly bulkDeleteButton: Locator

  // Paginação
  readonly nextPageButton: Locator
  readonly previousPageButton: Locator

  // Modal de novo/editar contato
  readonly contactModal: Locator
  readonly nameInput: Locator
  readonly phoneInput: Locator
  readonly emailInput: Locator
  readonly tagsInput: Locator
  readonly saveContactButton: Locator
  readonly updateContactButton: Locator
  readonly closeModalButton: Locator

  // Modal de confirmação de exclusão
  readonly deleteModal: Locator
  readonly confirmDeleteButton: Locator
  readonly cancelDeleteButton: Locator

  constructor(page: Page) {
    this.page = page

    // Header
    this.pageTitle = page.getByRole('heading', { name: /contatos/i })
    this.newContactButton = page.getByRole('button', { name: /novo contato|adicionar/i })
    this.importButton = page.getByRole('button', { name: /importar/i })
    this.exportButton = page.getByRole('button', { name: /exportar|download/i })

    // Busca e filtros
    this.searchInput = page.getByPlaceholder(/buscar|nome ou telefone/i)
    this.statusFilter = page.locator('select, [role="combobox"]').filter({ hasText: /status|todos/i })
    this.tagFilter = page.locator('select, [role="combobox"]').filter({ hasText: /tags|todas/i })

    // Tabela
    this.contactTable = page.locator('table, [role="table"]')
    this.contactRows = page.locator('tbody tr, [role="row"]')
    this.selectAllCheckbox = page.locator('input[type="checkbox"]#select-all, thead input[type="checkbox"]')
    this.bulkDeleteButton = page.getByRole('button', { name: /excluir selecionados/i })

    // Paginação
    this.nextPageButton = page.getByRole('button', { name: /próxim|next|>/i })
    this.previousPageButton = page.getByRole('button', { name: /anterior|prev|</i })

    // Modal de contato
    this.contactModal = page.locator('[role="dialog"], .fixed.inset-0')
    this.nameInput = page.getByPlaceholder(/joão silva|nome/i)
    this.phoneInput = page.getByPlaceholder(/\+55|telefone|whatsapp/i)
    this.emailInput = page.getByPlaceholder(/email|@/i)
    this.tagsInput = page.getByPlaceholder(/tags|vip|lead/i)
    this.saveContactButton = page.getByRole('button', { name: /salvar contato/i })
    this.updateContactButton = page.getByRole('button', { name: /atualizar contato/i })
    this.closeModalButton = page.locator('[role="dialog"] button[aria-label*="fechar"], [role="dialog"] button:has(svg)')

    // Modal de exclusão
    this.deleteModal = page.locator('[role="dialog"]').filter({ hasText: /excluir|confirmar/i })
    this.confirmDeleteButton = page.getByRole('button', { name: /^excluir$/i })
    this.cancelDeleteButton = page.getByRole('button', { name: /cancelar/i })
  }

  /**
   * Navega para a página de contatos
   */
  async goto(): Promise<void> {
    await this.page.goto('/contacts')
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Abre o modal de novo contato
   */
  async openNewContactModal(): Promise<void> {
    await this.newContactButton.click()
    await this.contactModal.waitFor({ state: 'visible' })
  }

  /**
   * Cria um novo contato
   */
  async createContact(contact: TestContact): Promise<void> {
    await this.openNewContactModal()

    await this.nameInput.fill(contact.name)
    await this.phoneInput.fill(contact.phone)

    if (contact.email) {
      await this.emailInput.fill(contact.email)
    }

    if (contact.tags && contact.tags.length > 0) {
      await this.tagsInput.fill(contact.tags.join(', '))
    }

    await this.saveContactButton.click()

    // Aguarda o modal fechar
    await this.contactModal.waitFor({ state: 'hidden', timeout: 5000 })
  }

  /**
   * Busca um contato pelo nome ou telefone
   */
  async searchContact(query: string): Promise<void> {
    await this.searchInput.fill(query)
    // Aguarda debounce da busca
    await this.page.waitForTimeout(500)
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Verifica se um contato existe na lista
   */
  async contactExists(nameOrPhone: string): Promise<boolean> {
    const row = this.page.locator('tr, [role="row"]').filter({ hasText: nameOrPhone })
    return await row.count() > 0
  }

  /**
   * Obtém o número de contatos exibidos
   */
  async getContactCount(): Promise<number> {
    // Aguarda carregamento
    await this.page.waitForLoadState('networkidle')
    return await this.contactRows.count()
  }

  /**
   * Clica no botão de editar de um contato específico
   */
  async editContact(nameOrPhone: string): Promise<void> {
    const row = this.page.locator('tr, [role="row"]').filter({ hasText: nameOrPhone })
    const editButton = row.locator('button').filter({ has: this.page.locator('svg') }).first()
    await editButton.click()
    await this.contactModal.waitFor({ state: 'visible' })
  }

  /**
   * Atualiza um contato existente
   */
  async updateContact(originalName: string, newData: Partial<TestContact>): Promise<void> {
    await this.editContact(originalName)

    if (newData.name) {
      await this.nameInput.clear()
      await this.nameInput.fill(newData.name)
    }

    if (newData.phone) {
      await this.phoneInput.clear()
      await this.phoneInput.fill(newData.phone)
    }

    if (newData.email) {
      await this.emailInput.clear()
      await this.emailInput.fill(newData.email)
    }

    await this.updateContactButton.click()
    await this.contactModal.waitFor({ state: 'hidden', timeout: 5000 })
  }

  /**
   * Exclui um contato
   */
  async deleteContact(nameOrPhone: string): Promise<void> {
    const row = this.page.locator('tr, [role="row"]').filter({ hasText: nameOrPhone })
    const deleteButton = row.locator('button').filter({ has: this.page.locator('svg') }).last()
    await deleteButton.click()

    // Confirma exclusão no modal
    await this.deleteModal.waitFor({ state: 'visible' })
    await this.confirmDeleteButton.click()
    await this.deleteModal.waitFor({ state: 'hidden', timeout: 5000 })
  }

  /**
   * Seleciona todos os contatos da página
   */
  async selectAllContacts(): Promise<void> {
    await this.selectAllCheckbox.check()
  }

  /**
   * Exclui todos os contatos selecionados
   */
  async deleteSelectedContacts(): Promise<void> {
    await this.bulkDeleteButton.click()
    await this.deleteModal.waitFor({ state: 'visible' })
    await this.confirmDeleteButton.click()
    await this.deleteModal.waitFor({ state: 'hidden', timeout: 5000 })
  }

  /**
   * Filtra contatos por status
   */
  async filterByStatus(status: 'Todos' | 'Opt-in' | 'Opt-out' | 'Desconhecido'): Promise<void> {
    await this.statusFilter.click()
    await this.page.getByRole('option', { name: status }).click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Aguarda a lista de contatos carregar
   */
  async waitForLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible' })
    await this.page.waitForLoadState('networkidle')
  }
}
