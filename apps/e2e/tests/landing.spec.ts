import { expect, test } from '@playwright/test'
import { Root } from './pages/root'

test('sign in and redirect home', async ({ page }) => {
  const rootPage = new Root(page)
  await rootPage.login()
  await expect(page.getByLabel('Breadcrumb')).toContainText('Home')
})
