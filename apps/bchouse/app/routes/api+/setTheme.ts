import { LoaderFunctionArgs, json } from '@remix-run/node'
import { isTheme } from '~/components/theme-provider'
import { getThemeSession } from '~/utils/themeCookie.server'

export const action = async ({ request }: LoaderFunctionArgs) => {
  const themeSession = await getThemeSession(request)
  const requestText = await request.text()
  const form = new URLSearchParams(requestText)
  const theme = form.get('theme')

  if (!isTheme(theme)) {
    return json({
      success: false,
      message: `theme value of ${theme} is not a valid theme`,
    })
  }

  themeSession.setTheme(theme)
  return json(
    { success: true },
    { headers: { 'Set-Cookie': await themeSession.commit() } }
  )
}
