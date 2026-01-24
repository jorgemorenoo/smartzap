import { test, expect } from './fixtures'
import { ContactsPage, LoginPage } from './pages'

/**
 * Testes E2E da página de Contatos
 *
 * Cobre:
 * - Listagem de contatos
 * - Criação de novo contato
 * - Edição de contato
 * - Exclusão de contato
 * - Busca de contatos
 * - Filtros
 */
test.describe('Contatos', () => {
  // Antes de cada teste, faz login
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page)
    const password = process.env.MASTER_PASSWORD || process.env.TEST_PASSWORD || 'test123'

    await loginPage.goto()
    await loginPage.loginAndWaitForDashboard(password)
  })

  test.describe('Listagem', () => {
    test('deve exibir página de contatos corretamente', async ({ page }) => {
      const contactsPage = new ContactsPage(page)

      await contactsPage.goto()
      await contactsPage.waitForLoad()

      // Verifica elementos principais
      await expect(contactsPage.pageTitle).toBeVisible()
      await expect(contactsPage.newContactButton).toBeVisible()
    })

    test('deve ter campo de busca visível', async ({ page }) => {
      const contactsPage = new ContactsPage(page)

      await contactsPage.goto()
      await contactsPage.waitForLoad()

      await expect(contactsPage.searchInput).toBeVisible()
    })

    test('deve ter botão de importar contatos', async ({ page }) => {
      const contactsPage = new ContactsPage(page)

      await contactsPage.goto()
      await contactsPage.waitForLoad()

      await expect(contactsPage.importButton).toBeVisible()
    })
  })

  test.describe('CRUD de Contatos', () => {
    test('deve abrir modal de novo contato', async ({ page }) => {
      const contactsPage = new ContactsPage(page)

      await contactsPage.goto()
      await contactsPage.waitForLoad()

      await contactsPage.openNewContactModal()

      // Modal deve estar visível
      await expect(contactsPage.contactModal).toBeVisible()
      await expect(contactsPage.nameInput).toBeVisible()
      await expect(contactsPage.phoneInput).toBeVisible()
    })

    test('deve criar novo contato com sucesso', async ({ page, generateUniqueContact }) => {
      const contactsPage = new ContactsPage(page)
      const newContact = generateUniqueContact()

      await contactsPage.goto()
      await contactsPage.waitForLoad()

      // Cria o contato
      await contactsPage.createContact(newContact)

      // Aguarda lista atualizar
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      // Busca o contato criado
      await contactsPage.searchContact(newContact.name)

      // Verifica que o contato existe
      const exists = await contactsPage.contactExists(newContact.name)
      expect(exists).toBe(true)
    })

    test('deve editar contato existente', async ({ page, generateUniqueContact }) => {
      const contactsPage = new ContactsPage(page)
      const contact = generateUniqueContact()
      const updatedName = `${contact.name} Editado`

      await contactsPage.goto()
      await contactsPage.waitForLoad()

      // Primeiro cria um contato
      await contactsPage.createContact(contact)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      // Busca o contato
      await contactsPage.searchContact(contact.name)

      // Edita o contato
      await contactsPage.updateContact(contact.name, { name: updatedName })
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      // Busca pelo nome atualizado
      await contactsPage.searchContact(updatedName)

      // Verifica que o contato foi atualizado
      const exists = await contactsPage.contactExists(updatedName)
      expect(exists).toBe(true)
    })

    test('deve excluir contato', async ({ page, generateUniqueContact }) => {
      const contactsPage = new ContactsPage(page)
      const contact = generateUniqueContact()

      await contactsPage.goto()
      await contactsPage.waitForLoad()

      // Primeiro cria um contato
      await contactsPage.createContact(contact)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      // Busca o contato
      await contactsPage.searchContact(contact.name)

      // Exclui o contato
      await contactsPage.deleteContact(contact.name)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      // Recarrega para garantir
      await contactsPage.goto()
      await contactsPage.searchContact(contact.name)

      // Verifica que o contato não existe mais
      const exists = await contactsPage.contactExists(contact.name)
      expect(exists).toBe(false)
    })
  })

  test.describe('Busca', () => {
    test('deve filtrar contatos por nome', async ({ page, generateUniqueContact }) => {
      const contactsPage = new ContactsPage(page)
      const contact = generateUniqueContact()

      await contactsPage.goto()
      await contactsPage.waitForLoad()

      // Cria um contato
      await contactsPage.createContact(contact)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      // Busca pelo nome
      await contactsPage.searchContact(contact.name)

      // Deve encontrar o contato
      const exists = await contactsPage.contactExists(contact.name)
      expect(exists).toBe(true)
    })

    test('deve filtrar contatos por telefone', async ({ page, generateUniqueContact }) => {
      const contactsPage = new ContactsPage(page)
      const contact = generateUniqueContact()

      await contactsPage.goto()
      await contactsPage.waitForLoad()

      // Cria um contato
      await contactsPage.createContact(contact)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      // Busca pelo telefone (parte dele)
      const phoneSearch = contact.phone.slice(-4) // últimos 4 dígitos
      await contactsPage.searchContact(phoneSearch)

      // Deve encontrar o contato
      const exists = await contactsPage.contactExists(contact.name)
      expect(exists).toBe(true)
    })

    test('deve mostrar lista vazia para busca sem resultados', async ({ page }) => {
      const contactsPage = new ContactsPage(page)

      await contactsPage.goto()
      await contactsPage.waitForLoad()

      // Busca por algo que não existe
      await contactsPage.searchContact('xyznonexistent123456789')

      // Contagem deve ser 0 ou lista vazia
      const count = await contactsPage.getContactCount()
      expect(count).toBe(0)
    })
  })

  test.describe('Validações', () => {
    test('não deve criar contato sem nome', async ({ page }) => {
      const contactsPage = new ContactsPage(page)

      await contactsPage.goto()
      await contactsPage.waitForLoad()

      await contactsPage.openNewContactModal()

      // Preenche só o telefone
      await contactsPage.phoneInput.fill('+5511999999999')

      // Tenta salvar
      await contactsPage.saveContactButton.click()

      // Modal deve permanecer aberto (validação falhou)
      await expect(contactsPage.contactModal).toBeVisible()
    })

    test('não deve criar contato sem telefone', async ({ page }) => {
      const contactsPage = new ContactsPage(page)

      await contactsPage.goto()
      await contactsPage.waitForLoad()

      await contactsPage.openNewContactModal()

      // Preenche só o nome
      await contactsPage.nameInput.fill('Contato Sem Telefone')

      // Tenta salvar
      await contactsPage.saveContactButton.click()

      // Modal deve permanecer aberto (validação falhou)
      await expect(contactsPage.contactModal).toBeVisible()
    })
  })

  test.describe('Limpeza', () => {
    // Limpa contatos criados nos testes
    test.afterEach(async ({ page }) => {
      // Tenta limpar contatos de teste
      // Isso é opcional - os testes criam contatos únicos que não conflitam
    })
  })
})
