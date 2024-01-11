import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { useSetThemeFetcher } from '~/routes/api.setTheme'
import { useMounted } from '~/utils/useMounted'
import { useHydrated } from './utils/use-hydrated'

enum Theme {
  DARK = 'dark',
  LIGHT = 'light',
}

type ThemeContextType = [Theme | null, Dispatch<SetStateAction<Theme | null>>]

const prefersDarkMQ = '(prefers-color-scheme: dark)'
const getPreferredTheme = () =>
  window.matchMedia(prefersDarkMQ).matches ? Theme.DARK : Theme.LIGHT
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)
const themes: Array<Theme> = Object.values(Theme)

function ThemeProvider({
  children,
  specifiedTheme,
}: {
  children: ReactNode
  specifiedTheme: Theme | null
}) {
  const [theme, setTheme] = useState<Theme | null>(() => {
    if (specifiedTheme) {
      if (themes.includes(specifiedTheme)) {
        return specifiedTheme
      } else {
        return null
      }
    }

    // there's no way for us to know what the theme should be in this context
    // the client will have to figure it out before hydration.
    if (typeof window !== 'object') {
      return null
    }

    return getPreferredTheme()
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia(prefersDarkMQ)
    const handleChange = () => {
      setTheme(mediaQuery.matches ? Theme.DARK : Theme.LIGHT)
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const { submit: submitTheme } = useSetThemeFetcher()
  useMounted(() => {
    if (theme) {
      submitTheme(theme)
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={[theme, setTheme]}>
      {children}
    </ThemeContext.Provider>
  )
}

export { Theme }

export function withThemeProvider<P extends object>(
  Component: React.ComponentType<
    P & {
      specifiedTheme: Theme | null
    }
  >
): React.FC<
  P & {
    specifiedTheme: Theme | null
  }
> {
  return (props) => (
    <ThemeProvider specifiedTheme={props.specifiedTheme}>
      <Component {...props} />
    </ThemeProvider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export function useClientTheme() {
  const context = useTheme()
  const hydrated = useHydrated()

  if (hydrated) {
    return context
  } else {
    return [null, context[1]] as ThemeContextType
  }
}

const clientThemeCode = `
;(() => {
  const theme = window.matchMedia(${JSON.stringify(prefersDarkMQ)}).matches
    ? 'dark'
    : 'light';
  const cl = document.documentElement.classList;
  const themeAlreadyApplied = cl.contains('light') || cl.contains('dark');
  if (!themeAlreadyApplied) {
    cl.add(theme);
  }

  const meta = document.querySelector('meta[name=color-scheme]');
  if (meta) {
    if (theme === 'dark') {
      meta.content = 'dark light';
    } else if (theme === 'light') {
      meta.content = 'light dark';
    }
  }
})();
`

export function ClientThemeHydrationScript({
  ssrTheme,
}: {
  ssrTheme: boolean
}) {
  const [theme] = useTheme()

  return (
    <>
      {ssrTheme ? null : (
        <>
          <meta
            name="color-scheme"
            content={theme === 'light' ? 'light dark' : 'dark light'}
          />
          <script dangerouslySetInnerHTML={{ __html: clientThemeCode }} />
        </>
      )}
    </>
  )
}

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && themes.includes(value as Theme)
}
