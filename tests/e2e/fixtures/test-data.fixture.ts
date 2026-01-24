import { test as base } from './auth.fixture'

/**
 * Dados de teste para E2E
 * Centraliza dados usados nos testes para fácil manutenção
 */

export interface TestContact {
  name: string
  phone: string
  email?: string
  tags?: string[]
}

export interface TestCampaign {
  name: string
  templateName?: string
}

export interface TestCredentials {
  phoneNumberId: string
  wabaId: string
  accessToken: string
  metaAppId?: string
}

export type TestDataFixtures = {
  testContact: TestContact
  testCampaign: TestCampaign
  testCredentials: TestCredentials
  generateUniqueContact: () => TestContact
  generateUniqueCampaign: () => TestCampaign
}

/**
 * Gera um ID único baseado em timestamp
 */
function uniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 5)
}

/**
 * Gera um número de telefone brasileiro válido para testes
 * Formato: +55 11 9XXXX-XXXX
 */
function generateTestPhone(): string {
  const areaCode = '11'
  const prefix = '9' + Math.floor(1000 + Math.random() * 9000).toString()
  const suffix = Math.floor(1000 + Math.random() * 9000).toString()
  return `+55${areaCode}${prefix}${suffix}`
}

export const test = base.extend<TestDataFixtures>({
  /**
   * Contato de teste padrão
   */
  testContact: async ({}, use) => {
    await use({
      name: 'Contato Teste E2E',
      phone: '+5511999999999',
      email: 'teste.e2e@example.com',
      tags: ['teste', 'e2e'],
    })
  },

  /**
   * Campanha de teste padrão
   */
  testCampaign: async ({}, use) => {
    await use({
      name: 'Campanha Teste E2E',
      templateName: 'hello_world', // Template padrão do Meta
    })
  },

  /**
   * Credenciais de teste (valores fictícios para testes de UI)
   */
  testCredentials: async ({}, use) => {
    await use({
      phoneNumberId: '123456789012345',
      wabaId: '987654321098765',
      accessToken: 'EAAGtest123456789abcdefghijklmnopqrstuvwxyz',
      metaAppId: '111222333444555',
    })
  },

  /**
   * Gera um contato único para cada execução de teste
   * Evita conflitos entre testes paralelos
   */
  generateUniqueContact: async ({}, use) => {
    const generator = (): TestContact => ({
      name: `Teste E2E ${uniqueId()}`,
      phone: generateTestPhone(),
      email: `teste.${uniqueId()}@example.com`,
      tags: ['teste-automatizado'],
    })

    await use(generator)
  },

  /**
   * Gera uma campanha única para cada execução de teste
   */
  generateUniqueCampaign: async ({}, use) => {
    const generator = (): TestCampaign => ({
      name: `Campanha E2E ${uniqueId()}`,
    })

    await use(generator)
  },
})

export { expect } from './auth.fixture'
