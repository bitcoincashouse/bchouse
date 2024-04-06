import { createCookieSessionStorage } from '@remix-run/node'

import { appEnv } from '~/.server/appEnv.js'
import { Theme, isTheme } from '../components/theme-provider.js'

const sessionSecret = appEnv.SESSION_SECRET
if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be set')
}

const themeStorage = createCookieSessionStorage({
  cookie: {
    name: 'my_remix_theme',
    secure: true,
    secrets: [sessionSecret],
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
  },
})

async function getThemeSession(request: Request) {
  const session = await themeStorage.getSession(request.headers.get('Cookie'))
  return {
    getTheme: () => {
      const themeValue = session.get('theme')
      return isTheme(themeValue) ? themeValue : null
    },
    setTheme: (theme: Theme) => session.set('theme', theme),
    commit: () => themeStorage.commitSession(session),
  }
}

export { getThemeSession }
