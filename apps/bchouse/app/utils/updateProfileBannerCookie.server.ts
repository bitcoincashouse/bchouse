import { createCookieSessionStorage } from '@remix-run/node'

const sessionSecret = process.env.SESSION_SECRET
if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be set')
}

const updateProfileCookie = createCookieSessionStorage({
  cookie: {
    name: 'updateProfileToast',
    secure: true,
    secrets: [sessionSecret],
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
  },
})

async function getUpdateProfileSession(request: Request) {
  const session = await updateProfileCookie.getSession(
    request.headers.get('Cookie')
  )
  return {
    getDismissed: () => {
      const dismissed = session.get('dismissed')
      if (typeof dismissed === 'boolean') {
        return dismissed
      } else if (typeof dismissed === 'string') {
        return dismissed === 'true'
      }

      return false
    },
    setDismissed: () => session.set('dismissed', true),
    commit: () => updateProfileCookie.commitSession(session),
  }
}

export { getUpdateProfileSession }
