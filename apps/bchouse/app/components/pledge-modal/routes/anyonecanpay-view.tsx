import {
  Content,
  InfoFooter,
  SvgUtil,
  ToastCtrl,
  WCButton,
  WCHeader,
  WCText,
} from '@bchouse/cashconnect'
import { useCallback, useRef } from 'react'
import { classnames } from '~/components/utils/classnames'
import { trpc } from '~/utils/trpc'
import useCopy from '~/utils/useCopy'
import { useExternalWalletPayload } from '~/utils/useValidateAnyonecanpayPledgeFetcher'

export function AnyonecanpayView({
  nextStep,
  onGoBack,
  title,
  campaignId,
  donationAmount,
  recipients,
  expires,
  name,
  comment,
}: {
  campaignId: string
  title?: React.ReactNode
  name?: string
  comment?: string
  recipients: {
    address: string
    satoshis: number
  }[]
  donationAmount: number
  expires: number
  nextStep: (payload: string) => void
  onGoBack: () => void
}) {
  const payloadRef = useRef<HTMLTextAreaElement>(null)
  const outgoingPayloadRef = useRef<HTMLTextAreaElement>(null)

  const onSubmit = (payload: string) => {
    nextStep(payload)
  }

  const outgoingPayload = useExternalWalletPayload({
    donationAmount,
    recipients,
    expires,
    name,
    comment,
  })

  const validateFetcher = trpc.campaign.validateAnyonecanpay.useMutation()

  const onCommitmentResultChange = (payload: string) => {
    validateFetcher.reset()
    if (payload) {
      validateFetcher.mutate({
        campaignId,
        payload,
      })
    }
  }

  const [copyExternalWalletPayload] = useCopy(outgoingPayload)

  const onExternalPayloadClick = useCallback(() => {
    if (outgoingPayloadRef.current) {
      outgoingPayloadRef.current.focus()
      outgoingPayloadRef.current.select()
      copyExternalWalletPayload()
      ToastCtrl.openToast('Copied', 'success')
    }
  }, [outgoingPayload, outgoingPayloadRef.current])

  const footer = (
    <div className="wcm-legal-notice">
      <InfoFooter>
        <WCText color="secondary" variant="small-thin">
          {/* TODO: Only for Bitcoin.com and other wallets that don't save invoice memo */}
          Visit{' '}
          <a
            href={`flipstarter.cash`}
            target="_blank"
            rel="noreferrer noopener"
          >
            flipstarter.cash
          </a>{' '}
          for more information on the flipstarter plugin.
        </WCText>
      </InfoFooter>
    </div>
  )

  return (
    <div className="wcm-desktop-connecting-view">
      <WCHeader
        className="!pb-2"
        title={title}
        actionIcon={SvgUtil.SCAN_ICON}
        showBackBtn
        onGoBack={onGoBack}
      ></WCHeader>
      <WCText variant="small-regular">
        Copy the payload to the plugin and paste the result here.
      </WCText>

      <Content
        mainClassName={classnames(
          'flex flex-col justify-center gap-1 !px-4 w-full !pt-4'
        )}
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-4 font-wcm text-sm">
            <div>
              <textarea
                readOnly
                ref={outgoingPayloadRef}
                name="outgoingPayload"
                className="w-full rounded-2xl px-[10px] py-0 !leading-[28px] tracking-[-0.03em] bg-[rgb(228,231,231)] dark:bg-[rgb(20,20,20)]"
                value={outgoingPayload}
                onClick={onExternalPayloadClick}
              />
            </div>
            <div>
              <textarea
                ref={payloadRef}
                name="incomingPayload"
                placeholder="Paste plugin payload"
                onChange={(e) => onCommitmentResultChange(e.target.value)}
                className="w-full rounded-2xl px-[10px] py-0 !leading-[28px] tracking-[-0.03em] bg-[rgb(228,231,231)] dark:bg-[rgb(20,20,20)]"
              />
            </div>
          </div>

          <div className="flex flex-row justify-between gap-2">
            <WCText
              variant="small-regular"
              color={
                validateFetcher.isSuccess
                  ? 'success'
                  : validateFetcher.isError
                  ? 'error'
                  : 'error'
              }
            >
              {validateFetcher.isPending ? 'Validating' : ''}
              {validateFetcher.data?.isValid === false ? 'Invalid payload' : ''}
            </WCText>
            <WCButton
              type="button"
              disabled={!validateFetcher.data?.isValid}
              buttonClassName="!transition-none flex flex-row items-center"
              onClick={() => {
                if (payloadRef.current?.value) {
                  onSubmit(payloadRef.current.value)
                }
              }}
              variant="default"
            >
              Next
            </WCButton>
          </div>
        </div>
      </Content>

      {footer}
    </div>
  )
}
