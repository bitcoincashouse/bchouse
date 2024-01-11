import CurrencyInput, {
  formatValue,
} from '@sahidmiller/react-currency-input-field'
import { useEffect, useMemo, useState } from 'react'
import { MAX_SATOSHIS, MIN_SATOSHIS, SATS_PER_BCH } from '~/utils/bchUtils'
import { cn } from '~/utils/cn'
import { prettyPrintSats } from '~/utils/prettyPrintSats'

async function fetchCurrencyRates() {
  try {
    // request the currency rates.
    const currencyRatesResponse = fetch('https://bitpay.com/api/rates/BCH')

    // Store the current rates.
    return await (await currencyRatesResponse).json()
  } catch (error) {
    // request the currency rates.
    const currencyRatesResponse = fetch(
      'https://markets.api.bitcoin.com/rates?c=BCH'
    )

    // Store the current rates.
    return await (await currencyRatesResponse).json()
  }
}

type CurrencyRates = {
  code: string
  rate: number
}[]

type CurrencyType = {
  ticker: string
  icon: string
  config: {
    decimalsLimit: number
    decimalScale: number
    intlConfig?: { locale: string; currency: string }
    prefix?: string
  }
}

function getCurrencyTypes(currencyRates: CurrencyRates): CurrencyType[] {
  const currencyTypes: CurrencyType[] = [
    {
      ticker: 'BCH',
      icon: 'icon-bch',
      config: {
        decimalsLimit: 8,
        decimalScale: 8,
      },
    },
  ]

  if (currencyRates.find((c) => c.code === 'USD')) {
    currencyTypes.push({
      ticker: 'USD',
      icon: 'icon-usd',
      config: {
        decimalsLimit: 2,
        decimalScale: 2,
        intlConfig: { locale: 'en-US', currency: 'USD' },
        prefix: ' ',
      },
    })
  }

  return currencyTypes
}

export default function DonationAmount({
  className,
  defaultDonationAmount,
  donationInputType = 'default',
  onDonationAmountChanged,
  defaultValue = 0,
  defaultCurrency = 'BCH',
  current,
  goal,
  minimum = MIN_SATOSHIS,
  maximum = MAX_SATOSHIS,
  ...props
}: {
  className?: string
  defaultDonationAmount: number
  donationInputType?: string
  onDonationAmountChanged?: (amount: number) => void
  defaultValue?: number
  defaultCurrency?: 'USD' | 'BCH'
  current?: number
  goal?: number
  minimum?: number
  maximum?: number
}) {
  let max = 0
  const calculateMax =
    typeof goal !== 'undefined' && typeof current !== 'undefined'

  if (calculateMax && current < goal) {
    const remainingAmount = goal - current
    max = remainingAmount < minimum ? minimum : remainingAmount
  }

  const defaultCurrencyValue = defaultDonationAmount
    ? defaultDonationAmount / SATS_PER_BCH
    : ''

  const [donationCurrencyValue, setDonationCurrencyValue] =
    useState(defaultCurrencyValue)
  const [donationAmount, setDonationAmount] = useState(defaultDonationAmount)
  const [selectedCurrencyType, setSelectedCurrencyType] =
    useState(defaultCurrency)

  const [isDirty, setIsDirty] = useState(false)

  const donationAmountError = useMemo(() => {
    if (!isDirty) return ''

    if (calculateMax && donationAmount > max) {
      const [text, denomination] = prettyPrintSats(max)
      return `This donation exceeds what the campaign needs (${text} ${denomination})`
    } else if (donationAmount > maximum) {
      const [text, denomination] = prettyPrintSats(maximum)
      return `This exceeds the maximum of ${text}${denomination}`
    } else if (!donationAmount || isNaN(donationAmount)) {
      return 'Please enter an amount'
    } else if (donationAmount < minimum) {
      return `Minimum amount is ${minimum} SATS`
    } else {
      return ''
    }
  }, [isDirty, donationAmount, max, minimum, calculateMax])

  const [currencyRates, setCurrencyRates] = useState<CurrencyRates>([])

  const currencyTypes = getCurrencyTypes(currencyRates)
  const selectedCurrency = currencyTypes.find(
    (c) => c.ticker === selectedCurrencyType
  )

  if (!selectedCurrency) {
    throw new Error('Invalid selected currerncy')
  }

  const currencyConfig = selectedCurrency?.config || {}

  const [donationAmountText, donationAmountDenomination] =
    prettyPrintSats(donationAmount)

  const usdRate = useMemo(() => {
    return currencyRates?.find((c) => c.code === 'USD')?.rate || 0
  }, [currencyRates])

  const altDonationAmountText = useMemo(() => {
    if (selectedCurrencyType === 'BCH') {
      const fiatAmount = usdRate * (donationAmount / SATS_PER_BCH)
      return Math.round(fiatAmount * 100) / 100
    } else {
      return donationAmountText
    }
  }, [usdRate, donationAmount, selectedCurrencyType])

  const altDonationAmountDenomination =
    selectedCurrencyType === 'BCH' ? 'USD' : donationAmountDenomination

  useEffect(() => {
    ;(async () => {
      const currencyRates = (await fetchCurrencyRates()) as CurrencyRates
      setCurrencyRates(currencyRates)
    })()
  }, [])

  function onCurrencyChanged(e: React.ChangeEvent<HTMLSelectElement>) {
    //Set text value to donation value in new currency.

    //Convert donation amount to new currency
    const currency = e.target.value
    const { rate: toCurrencyRate } =
      currencyRates.find((c) => c.code === currency) || {}
    const { config: toCurrencyConfig } =
      currencyTypes.find((c) => c.ticker === currency) || {}

    if (toCurrencyRate && toCurrencyConfig) {
      const value = (donationAmount / SATS_PER_BCH) * toCurrencyRate
      setDonationCurrencyValue(
        formatValue({
          value: value.toString(),
          ...toCurrencyConfig,
          disableGroupSeparators: true,
        })
      )
      setSelectedCurrencyType(currency as any)
    } else {
      return setDonationCurrencyValue(0)
    }
  }

  function onValueChanged(textValue: string | number, currencyType?: string) {
    //Convert whatever currency back to BCH
    const value =
      typeof textValue === 'number' ? textValue : parseFloat(textValue || '0')
    currencyType = currencyType || selectedCurrencyType

    if (value) setIsDirty(true)

    const { rate: fromCurrencyRate } = currencyRates.find(
      (c) => c.code === currencyType
    ) || { rate: 1 }

    if (
      !isNaN(value) &&
      (currencyType === 'SATS' || currencyType === 'SAT' || fromCurrencyRate)
    ) {
      //Notify new SATS value.
      const sats =
        currencyType === 'SATS' || currencyType === 'SAT'
          ? value
          : Math.round((value / fromCurrencyRate) * SATS_PER_BCH)
      onDonationAmountChanged?.(sats)
      setDonationAmount(sats)

      if (currencyType !== selectedCurrencyType && !isNaN(value)) {
        const { rate: toCurrencyRate } = currencyRates.find(
          (c) => c.code === selectedCurrencyType
        ) || { rate: 1 }
        const { config: toCurrencyConfig } =
          currencyTypes.find((c) => c.ticker === selectedCurrencyType) || {}

        if (toCurrencyRate && toCurrencyConfig) {
          const displayValue = (sats / SATS_PER_BCH) * toCurrencyRate
          setDonationCurrencyValue(
            formatValue({
              value: displayValue.toString(),
              ...toCurrencyConfig,
              disableGroupSeparators: true,
            })
          )
        }

        return
      }
    }

    setDonationCurrencyValue(textValue)
  }

  function setMaximumAmount() {
    const { rate: toCurrencyRate } = currencyRates.find(
      (c) => c.code === selectedCurrencyType
    ) || { rate: 1 }
    const value = (max / SATS_PER_BCH) * toCurrencyRate
    onValueChanged(value)
  }

  return (
    <div className={cn(className, 'font-sans')}>
      <div className="relative">
        {donationInputType === 'default' && (
          <div className="flex rounded py-3 px-4 w-full">
            <div className="relative mr-4 group flex items-center">
              <select
                name="currency"
                className="absolute w-full h-full bottom-0 left-0 appearance-none opacity-0"
                value={selectedCurrency.ticker}
                onChange={onCurrencyChanged}
              >
                <option value="BCH">BCH</option>
                <option value="USD">USD</option>
              </select>
              <div className="text-center pointer-events-none">
                <span className={`block ${selectedCurrency.icon || ''}`}></span>
                <span className="block font-bold">
                  {selectedCurrency.ticker}
                </span>
                <span className="block font-bold down-arrow"></span>
              </div>
            </div>
            <CurrencyInput
              data-testid="donationInput"
              value={donationCurrencyValue}
              name="donationAmount"
              className="borderr border-[#6b7280] w-full outline-0 xs:text-2xl text-3xl font-bold text-right relative w-full rounded-[30px] bg-wcm-color-1 text-primary-text"
              inputMode="decimal"
              autoComplete="off"
              id="donationAmount"
              {...currencyConfig}
              {...props}
              onValueChange={(value) => onValueChanged(value || 0)}
            ></CurrencyInput>
            {calculateMax && (
              <div className="text-center">
                <div className="flex pl-1 place-content-center h-20">
                  <button
                    className="border border-[#6b7280] bg-primary-btn-400 p-4 relative w-full rounded-[30px] bg-wcm-color-1 text-primary-text ml-1 w-full cursor-pointer disabled:cursor-default disabled:bg-gray-300"
                    onClick={setMaximumAmount}
                  >
                    Max
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="">
        {donationAmountError && (
          <div
            data-testid="donationAmountError"
            className="flex gap-2 items-center ml-4 text-red-500"
          >
            <span className="icon-info"></span>
            <span className="">{donationAmountError}</span>
          </div>
        )}
      </div>
    </div>
  )
}
