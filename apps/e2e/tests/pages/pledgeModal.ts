import { moment } from '@bchouse/utils'
import os from 'node:os'
import { type Page } from 'playwright/test'

export class PledgeModal {
  page: Page
  currentSelectedDate: moment.Dayjs = moment() //.hour(23).minute(59)

  constructor(page: Page) {
    this.page = page
  }

  async inputDonationAmount(amount: string, gotoNextStep: boolean = true) {
    const page = this.page
    await page.getByTestId('donationInput').click()
    await page.getByTestId('donationInput').fill(amount)

    if (gotoNextStep) await page.getByRole('button', { name: 'Done' }).click()

    return this
  }

  async inputPayoutAddress(address: string, gotoNextStep: boolean = true) {
    const page = this.page
    page.evaluate(`navigator.clipboard.writeText('${address}')`)

    //Enter address
    await page.getByText('Scan or paste your address').waitFor()
    await page.getByPlaceholder('Recipient address').focus()
    const isMac = os.platform() === 'darwin'
    const modifier = isMac ? 'Meta' : 'Control'
    await page.keyboard.press(`${modifier}+KeyV`)

    if (gotoNextStep) {
      await page.getByRole('button', { name: 'Done' }).click()
      //Confirm
      //TODO: save confirmation in local state
      await page.getByRole('button', { name: 'Amount: 0.01BCH Return' }).click()
    }

    return this
  }

  async inputEndDate(endsOn: Date, gotoNextStep: boolean = true) {
    const page = this.page
    const endsOnMoment = moment(endsOn)

    const diffMonths = this.currentSelectedDate
      .startOf('month')
      .diff(endsOnMoment.startOf('month'), 'month')

    let iterations = Math.abs(diffMonths)

    while (iterations != 0) {
      if (diffMonths > 0) {
        await page.getByLabel('Go to previous month').click()
      } else {
        await page.getByLabel('Go to next month').click()
      }
      iterations--
    }

    await page
      .locator(
        `button:not(.opacity-50):text-is("${endsOnMoment
          .get('date')
          .toString()}")`
      )
      .click()

    await page.locator('input[type="time"]').fill(endsOnMoment.format('HH:mm'))
    this.currentSelectedDate = endsOnMoment

    if (gotoNextStep) {
      await page.getByRole('button', { name: 'Done' }).click()
    }

    return this
  }
}
