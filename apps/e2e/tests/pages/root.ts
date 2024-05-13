import type { Page } from 'playwright/test'
import { appEnv } from '../../src/appEnv'
import { Home } from './home'

export class Root {
  page: Page

  constructor(page: Page) {
    this.page = page
  }

  async login() {
    const page = this.page
    //Start from landing page
    await page.goto(appEnv.BCHOUSE_URL)

    //Sign in
    await page.getByRole('button', { name: 'Sign in' }).first().click()
    await page.getByLabel('Email').fill(appEnv.E2E_TEST_USERNAME)
    await page.getByText('Continue', { exact: true }).click()
    await page
      .getByLabel('Password', { exact: true })
      .fill(appEnv.E2E_TEST_USER_PASSWORD)
    await page.getByText('Continue', { exact: true }).click()

    //Return page
    return new Home(page)
  }
}
