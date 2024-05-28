import { InfoFooter, MessageView, WCText } from '@bchouse/cashconnect'
import { $useActionMutation } from 'remix-query'

export function LeaveMessageView({
  campaignId,
  campaignerName,
  secret,
  showName,
  nextStep,
}: {
  campaignerName: string
  campaignId: string
  secret: string
  showName: boolean
  nextStep: () => void
}) {
  const commentMutation = $useActionMutation('/api/campaign/pledge/comment', {
    onSuccess: () => nextStep(),
  })

  return (
    <MessageView
      showName={showName}
      username={campaignerName}
      onSubmit={(name, comment) =>
        commentMutation.mutate({
          name,
          comment,
          secret,
        })
      }
      onSkip={() => nextStep()}
      footer={
        <div className="wcm-legal-notice">
          <InfoFooter>
            <WCText color="secondary" variant="small-thin">
              {/* TODO: Only for Bitcoin.com and other wallets that don't save invoice memo */}
              Visit our{' '}
              <a
                href={`/campaign/pledge/refund/${secret}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                revocation page
              </a>{' '}
              to easily revoke your pledge before expiration. Thanks for the
              support!
            </WCText>
          </InfoFooter>
        </div>
      }
    />
  )
}
