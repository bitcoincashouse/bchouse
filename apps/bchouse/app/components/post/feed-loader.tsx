import { useInView } from 'react-intersection-observer'
import { LoadingIndicator as LoadingSpinner } from '~/components/loading'
import { classNames } from '../utils'
import { LoaderContext, VirtuaContext } from './virtua-context'

export function BeforeLoadingIndicator(
  props: { context?: VirtuaContext } | undefined
) {
  const context = props?.context
  return context ? <LoadingIndicator context={context.previousLoader} /> : <></>
}

export function AfterLoadingIndicator(
  props: { context?: VirtuaContext } | undefined
) {
  const context = props?.context
  return context ? <LoadingIndicator context={context.nextLoader} /> : <></>
}

export function LoadingIndicator({ context }: { context: LoaderContext }) {
  const { isRendered, isFetching, hasMore, onTrigger } = context || {}

  const { ref } = useInView({
    /* Optional options */
    threshold: 0.2,
    initialInView: false,
    fallbackInView: false,
    rootMargin: '-60px',
    onChange: (inView) => {
      if (inView && isRendered && hasMore && !isFetching) {
        onTrigger?.()
      }
    },
  })

  return (
    <div
      ref={ref}
      className={classNames(
        'relative w-full loading loading-before ease-in-out overflow-hidden',
        hasMore ? 'opacity-100' : 'opacity-0'
      )}
    >
      <div className="flex justify-center">
        <LoadingSpinner />
      </div>
    </div>
  )
}
