import { type Page } from 'playwright/test'
import { PledgeModal } from './pledgeModal'

export class Home {
  page: Page

  constructor(page: Page) {
    this.page = page
  }

  getFirstPostFromFeed() {
    return this.page.locator('.hover\\:bg-hover > div').first()
  }

  async post(content: string) {
    const page = this.page
    //Create post and submit
    await page.locator('#comment').getByRole('paragraph').click()
    await page.locator('#comment div').fill(content)
    await page.getByText('Submit').click()
  }

  async createCampaign(campaignTitle: string, campaignBody: string) {
    const page = this.page
    await page.getByPlaceholder('Title').click()
    await page.getByPlaceholder('Title').fill(campaignTitle)
    await page.locator('#comment').getByRole('paragraph').click()
    await page.locator('#comment div').fill(campaignBody)
    await page.getByText('Submit').click()

    return new PledgeModal(page)
  }
}
