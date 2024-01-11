// import { WalletConnectModal } from '@walletconnect/modal'
// import React, { useEffect, useMemo, useState } from 'react'
import { PlainQrCodeView, WCText } from '@bchouse/cashconnect'
import { useClerk } from '@clerk/remix'
import React, { useMemo, useState } from 'react'
import { pluralize } from '~/components/utils'
import { Network } from '~/utils/bchUtils'
import { classNames } from '~/utils/classNames'
import { bchLogo } from '~/utils/constants'
import moment from '~/utils/moment'
import { prettyPrintSats } from '~/utils/prettyPrintSats'
import { AllContributions } from './contributions/all-contributions'
import { Modal } from './modal'
import { ProgressBar } from './progress-bar'

export const DonationWidget = ({
  requestedAmount = 0,
  amountRaised = 0,
  contributionCount = 0,
  className = '',
  style = {},
  type = 'donation',
  children,
  campaignId,
  showAmount = false,
  address,
  expiresAt,
  fulfilledAt,
  donationAddress,

  network,
  campaignerDisplayName,
  isLoggedIn,

  onOpen,
  isOpen,
}: {
  campaignId: string
  requestedAmount?: number
  amountRaised?: number
  contributionCount?: number
  className?: string
  style?: Record<string, string>
  type?: 'donation' | 'charity'
  children?: React.ReactNode
  showAmount?: boolean
  expiresAt: number
  fulfilledAt?: number
  address: string
  donationAddress: string

  network: Network
  campaignerDisplayName: string
  isLoggedIn: boolean
  isOpen: boolean
  onOpen: () => void
}) => {
  // const [client, setClient] = useState<WalletConnectModal | null>()
  // useEffect(() => {
  //   ;(async () => {
  //     setClient(
  //       new WalletConnectModal({
  //         projectId: 'af5124b50e42ae55ac385eeb207d9a7a',
  //         privacyPolicyUrl: 'hhtp://test.com',
  //         termsOfServiceUrl: 'http://test.com',
  //       })
  //     )
  //   })()
  // }, [])

  const [requestedAmountText, requestedDenominationText] =
    prettyPrintSats(requestedAmount)
  const [amountRaisedText, amountRaisedDenominationText] =
    prettyPrintSats(amountRaised)
  const isExpired = useMemo(() => {
    return expiresAt && expiresAt < moment().unix()
  }, [expiresAt])
  const isDone = !!fulfilledAt || !!isExpired
  const expiresInText = useMemo(() => {
    const endedAt = fulfilledAt || expiresAt
    return endedAt ? (
      <>
        {!fulfilledAt && !isExpired ? 'Ends' : 'Ended'}{' '}
        <strong>{moment().to(moment.unix(endedAt).utc(true))}</strong>
      </>
    ) : null
  }, [expiresAt, fulfilledAt])

  const clerk = useClerk()
  const [listOpen, setListOpen] = useState(false)

  return (
    <>
      <div
        style={style}
        className={`duration-250 flex flex-col relative ${className}`}
      >
        <div className="flex flex-col relative">
          {showAmount ? (
            <>
              <div className="hidden desktop:block md:my-1 mb-4 px-4">
                <ProgressBar
                  goal={requestedAmount}
                  total={amountRaised}
                ></ProgressBar>
              </div>
              <div className="hidden desktop:flex flex-wrap justify-between items-baseline gap-2 md:order-first px-4 md:pt-4">
                <span className="col-span-5">
                  <span className="mr-1">
                    <b className="text-xl">
                      {amountRaisedText} {amountRaisedDenominationText}
                    </b>{' '}
                    <small className="text-sm text-secondary-text">
                      raised of {requestedAmountText}{' '}
                      {requestedDenominationText === 'SATS'
                        ? 'SAT'
                        : requestedDenominationText}{' '}
                      goal
                    </small>
                  </span>
                  <span className="sm:hidden">
                    <strong>•</strong>
                    <strong> {contributionCount}</strong>{' '}
                    {pluralize({
                      singular: 'contribution',
                      count: contributionCount,
                    })}
                  </span>
                  {expiresInText ? (
                    <small className="sm:hidden">
                      <strong className="px-1 md:px-2">•</strong>
                      {expiresInText}
                    </small>
                  ) : null}
                </span>
              </div>
              <span className="hidden desktop:block text-secondary-text px-4">
                <button
                  type="button"
                  className="cursor-pointer"
                  onClick={() => setListOpen(true)}
                >
                  <small>
                    <strong> {contributionCount}</strong>{' '}
                    {pluralize({
                      singular: 'contribution',
                      count: contributionCount,
                    })}
                  </small>
                </button>
                {expiresInText ? (
                  <small>
                    <strong className="px-1 md:px-2">•</strong>
                    {expiresInText}
                  </small>
                ) : null}
              </span>
            </>
          ) : null}

          {!isDone ? (
            <div
              className={classNames(
                isLoggedIn ? 'pt-2' : '',
                'md:pt-4 px-4 rounded-2xl'
              )}
            >
              <div className="flex flex-col gap-4 pt-0 pb-0 md:pb-4 md:px-4">
                <div>
                  <button
                    disabled={isOpen || isDone}
                    onClick={() => (isLoggedIn ? onOpen() : clerk.openSignIn())}
                    className={classNames(
                      'disabled:!bg-gray-300 cta-btn bg-primary-btn-300 hover:bg-primary-btn-400 gradient transition-all duration-400 ease-in-out'
                    )}
                  >
                    Pledge now
                  </button>
                </div>
              </div>
              {donationAddress ? (
                <PlainQrCodeView
                  title={
                    <span className="text-primary-text">
                      {isLoggedIn ? 'Or' : ''} Donate
                    </span>
                  }
                  subtitle={
                    <WCText
                      className="text-center -mt-3 pb-4"
                      variant="xsmall-regular"
                      color="secondary"
                    >
                      The donation contract forwards to the campaign's payout
                      address even if the campaign fails to meet its goal.
                    </WCText>
                  }
                  imageAlt="Donation address QR"
                  imageUrl={bchLogo}
                  uri={donationAddress}
                />
              ) : null}
            </div>
          ) : null}

          <Modal
            title="All Contributions"
            open={!!listOpen}
            onClose={() => setListOpen(false)}
            className="min-h-[75vh] px-6"
            size="small"
          >
            <AllContributions campaignId={campaignId} expires={expiresAt} />
          </Modal>
        </div>
        {children}
      </div>
    </>
  )
}
