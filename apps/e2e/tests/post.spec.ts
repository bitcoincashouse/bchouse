import { moment } from '@bchouse/utils'
import { expect, test } from '@playwright/test'
import { appEnv } from '../src/appEnv'
import { Root } from './pages/root'

test('can make new post', async ({ page }) => {
  const rootPage = new Root(page)
  const homePage = await rootPage.login()
  const randomId = Math.floor(Math.random() * 1000)
  const content = `Test page ${randomId}`

  //Make new post
  await homePage.post(content)

  //Find first post
  const postResult = homePage.getFirstPostFromFeed()
  await expect(postResult).toContainText(content)
  await expect(postResult).toContainText('a few seconds ago')
})

test('can make new campaign', async ({ page }) => {
  const rootPage = new Root(page)
  const homePage = await rootPage.login()
  const randomId = Math.floor(Math.random() * 1000)
  const campaignTitle = `Test campaign ${randomId}`
  const campaignBody = `Test campaign ${randomId}`
  const payoutAddress = appEnv.E2E_TEST_USER_BCH_ADDRESS

  await page.getByRole('button', { name: 'Post' }).click()
  await page.getByRole('option', { name: 'Campaign' }).click()

  const campaignModal = await homePage.createCampaign(
    campaignTitle,
    campaignBody
  )
  await campaignModal.inputDonationAmount('0.01')
  await campaignModal.inputPayoutAddress(payoutAddress)
  await campaignModal.inputEndDate(moment().add(1, 'months').toDate())

  //Confirm created
  const postResult = homePage.getFirstPostFromFeed()
  await expect(postResult).toContainText(campaignTitle)
  await expect(postResult).toContainText('a few seconds ago')
})
