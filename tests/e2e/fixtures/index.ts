/**
 * Exportação central dos fixtures de teste E2E
 *
 * Uso:
 * import { test, expect } from './fixtures'
 *
 * test('meu teste', async ({ authenticatedPage, testContact }) => {
 *   // ...
 * })
 */

export { test, expect } from './test-data.fixture'
export type { TestContact, TestCampaign, TestCredentials } from './test-data.fixture'
