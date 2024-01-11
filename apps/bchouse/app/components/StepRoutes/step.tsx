import { animate } from 'motion'
import { useEffect, useRef, useState } from 'react'

export type ExtractStep<
  TSteps extends { step: number; data: Record<string, any> },
  Step extends number
> = Extract<TSteps, { step: Step }>

export type ExtractStepData<
  TSteps extends { step: number; data: Record<string, any> },
  Index extends number
> = Extract<TSteps, { step: Index }>['data']

export function useSteps<
  TSteps extends { step: number; data: Record<string, any> }
>(initialStep: Extract<TSteps, { step: 1 }>) {
  const [step, setStep] = useState<TSteps>(initialStep as any)
  const stepTo = <
    TStep extends TSteps['step'],
    TData extends Extract<TSteps, { step: TStep }>['data']
  >(
    step: TStep,
    data: TData
  ) => {
    return setStep({
      step,
      data,
    } as Extract<TSteps, { step: TStep }>)
  }

  return [step, stepTo] as const
}

export function StepRoute({
  children,
  step,
}: React.PropsWithChildren<{ step: string | number }>) {
  const routerRef = useRef<HTMLDivElement>(null)
  const stepRef = useRef(step)
  const [currentChildren, setCurrentChildren] =
    useState<React.ReactNode>(children)

  useEffect(() => {
    ;(async () => {
      const routerEl = routerRef.current
      if (!routerEl) return

      //If same step, no animation necessary
      if (stepRef.current === step) {
        setCurrentChildren(children)
        return
      }

      await animate(
        routerEl,
        { opacity: [1, 0], scale: [1, 1.02] },
        { duration: 0.15, delay: 0.1 }
      ).finished

      setCurrentChildren(children)
    })()
  }, [step, children])

  useEffect(() => {
    const routerEl = routerRef.current
    if (!routerEl || stepRef.current === step) return

    //When new view is set, fade back in.
    stepRef.current = step
    animate(
      routerEl,
      { opacity: [0, 1], scale: [0.99, 1] },
      { duration: 0.37, delay: 0.05 }
    )
  }, [currentChildren])

  return <div ref={routerRef}>{currentChildren}</div>
}
