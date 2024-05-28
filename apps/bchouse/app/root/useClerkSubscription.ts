import { moment } from '@bchouse/utils'
import { useClerk } from '@clerk/remix'
import { useRevalidator } from '@remix-run/react'
import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    clerk: ReturnType<typeof useClerk>
  }
}

export function useClerkSubscription() {
  const clerk = useClerk()
  const { revalidate } = useRevalidator()
  const lastUpdatedRef = useRef<Date>()

  useEffect(() => {
    lastUpdatedRef.current = moment().toDate()
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.clerk = clerk
    }

    console.log('CLERK SUBSCRIBE')
    const unsubscribe = clerk.addListener((resources) => {
      console.log('CLERK UPDATE', resources)

      if (
        lastUpdatedRef.current &&
        clerk.user?.updatedAt &&
        lastUpdatedRef.current <= clerk.user.updatedAt
      ) {
        lastUpdatedRef.current = clerk.user.updatedAt

        console.log('UPDATING DUE TO CLERK')
        revalidate()
      }
    })

    return () => {
      console.log('CLERK UNSUBSCRIBE')
      unsubscribe()
    }
  }, [])
}
