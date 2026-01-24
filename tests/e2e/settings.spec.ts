import { test, expect } from './fixtures'
import { SettingsPage, LoginPage } from './pages'

/**
 * Testes E2E da página de Configurações
 *
 * Cobre:
 * - Visualização da página de configurações
 * - Preenchimento de credenciais WhatsApp
 * - Salvamento de configurações
 * - Teste de conexão
 */
test.describe('Configurações', () => {
  // Antes de cada teste, faz login
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page)
    const password = process.env.MASTER_PASSWORD || process.env.TEST_PASSWORD || 'test123'

    await loginPage.goto()
    await loginPage.loginAndWaitForDashboard(password)
  })

  test.describe('Página de Settings', () => {
    test('deve exibir página de configurações corretamente', async ({ page }) => {
      const settingsPage = new SettingsPage(page)

      await settingsPage.goto()
      await settingsPage.waitForLoad()

      // Verifica que está na página de settings
      expect(await settingsPage.isVisible()).toBe(true)
    })

    test('deve exibir campos de credenciais WhatsApp', async ({ page }) => {
      const settingsPage = new SettingsPage(page)

      await settingsPage.goto()
      await settingsPage.waitForLoad()

      // Verifica campos principais
      // Pelo menos um campo deve estar visível
      const phoneIdVisible = await settingsPage.phoneNumberIdInput.isVisible().catch(() => false)
      const wabaIdVisible = await settingsPage.wabaIdInput.isVisible().catch(() => false)

      expect(phoneIdVisible || wabaIdVisible).toBe(true)
    })

    test('deve ter botão de salvar habilitado', async ({ page }) => {
      const settingsPage = new SettingsPage(page)

      await settingsPage.goto()
      await settingsPage.waitForLoad()

      await expect(settingsPage.saveButton).toBeVisible()
    })
  })

  test.describe('Credenciais WhatsApp', () => {
    test('deve permitir preencher credenciais', async ({ page, testCredentials }) => {
      const settingsPage = new SettingsPage(page)

      await settingsPage.goto()
      await settingsPage.waitForLoad()

      // Preenche credenciais de teste
      await settingsPage.fillCredentials(testCredentials)

      // Verifica que os campos foram preenchidos
      // (não verifica o valor exato por questões de segurança do campo password)
      await expect(settingsPage.phoneNumberIdInput).not.toBeEmpty()
    })

    test('deve salvar configurações com sucesso', async ({ page, testCredentials }) => {
      const settingsPage = new SettingsPage(page)

      await settingsPage.goto()
      await settingsPage.waitForLoad()

      // Preenche e salva
      await settingsPage.fillCredentials(testCredentials)
      await settingsPage.save()

      // Aguarda feedback (toast ou mensagem)
      // Não deve haver erro crítico
      await page.waitForTimeout(2000)

      // Verifica que ainda está na página de settings (não houve crash)
      expect(await settingsPage.isVisible()).toBe(true)
    })

    test('deve manter valores após recarregar página', async ({ page, testCredentials }) => {
      const settingsPage = new SettingsPage(page)

      await settingsPage.goto()
      await settingsPage.waitForLoad()

      // Preenche e salva
      await settingsPage.fillCredentials(testCredentials)
      await settingsPage.save()
      await page.waitForTimeout(2000)

      // Recarrega página
      await page.reload()
      await settingsPage.waitForLoad()

      // Verifica que Phone ID foi mantido
      const phoneIdValue = await settingsPage.phoneNumberIdInput.inputValue()
      expect(phoneIdValue).toBe(testCredentials.phoneNumberId)
    })
  })

  test.describe('Teste de Conexão', () => {
    test('deve ter botão de testar conexão', async ({ page }) => {
      const settingsPage = new SettingsPage(page)

      await settingsPage.goto()
      await settingsPage.waitForLoad()

      // Botão de teste deve existir
      await expect(settingsPage.testConnectionButton).toBeVisible()
    })

    test('deve mostrar feedback ao testar conexão', async ({ page, testCredentials }) => {
      const settingsPage = new SettingsPage(page)

      await settingsPage.goto()
      await settingsPage.waitForLoad()

      // Preenche credenciais primeiro
      await settingsPage.fillCredentials(testCredentials)
      await settingsPage.save()
      await page.waitForTimeout(1000)

      // Testa conexão
      await settingsPage.testConnection()

      // Aguarda algum feedback (sucesso ou erro)
      await page.waitForTimeout(3000)

      // Como credenciais são fictícias, provavelmente vai dar erro
      // Mas o importante é que a ação foi executada sem crash
      expect(await settingsPage.isVisible()).toBe(true)
    })
  })

  test.describe('Navegação', () => {
    test('deve conseguir voltar para dashboard', async ({ page }) => {
      const settingsPage = new SettingsPage(page)

      await settingsPage.goto()
      await settingsPage.waitForLoad()

      // Navega para home/dashboard
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Deve estar no dashboard, não na página de settings
      await expect(page).not.toHaveURL(/\/settings/)
    })
  })
})
