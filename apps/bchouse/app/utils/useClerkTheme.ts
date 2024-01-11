import { dark } from '@clerk/themes'
import { Theme, useClientTheme } from '../components/theme-provider'

export function useClerkTheme() {
  const [clientTheme] = useClientTheme()
  return clientTheme === Theme.DARK ? dark : undefined
}
