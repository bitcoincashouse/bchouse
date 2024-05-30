import { useCurrentUser } from '../../context/current-user-context'
import { classnames } from '../../utils/classnames'
import { useCampaignComplete } from './useCampaignComplete'
import { usePledgeModal } from './usePledge'

export function PledgeButton() {
  const isDone = useCampaignComplete()
  const { pledge, openPledgeModal } = usePledgeModal()
  const currentUser = useCurrentUser()

  return (
    <button
      disabled={isDone || !!pledge}
      onClick={(e) => {
        e.stopPropagation()
        openPledgeModal()
      }}
      className={classnames(
        'desktop:hidden disabled:!bg-gray-300 rounded-full text-primary-text font-semibold text-[15px] px-2 bg-primary-btn-300 hover:bg-primary-btn-400 gradient transition-all duration-400 ease-in-out'
      )}
    >
      {!currentUser?.isAnonymous ? 'Pledge' : 'Donate'}
    </button>
  )
}
