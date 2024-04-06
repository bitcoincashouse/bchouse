import { createCookieSessionStorage } from '@remix-run/node'
import { appEnv } from 'appEnv'

const sessionSecret = appEnv.SESSION_SECRET
if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be set')
}

const pledgeStorage = createCookieSessionStorage({
  cookie: {
    name: 'pledge_secrets_cookie',
    secure: true,
    secrets: [sessionSecret],
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
  },
})

async function getPledgeSession(request: Request) {
  const session = await pledgeStorage.getSession(request.headers.get('Cookie'))
  return {
    getPledgeSecrets() {
      const secrets = session.get('pledgeSecrets')
      return typeof secrets === 'string' ? secrets.split(',') : []
    },
    setPledgesSecrets(pledges: string[]) {
      return session.set('pledgeSecrets', pledges.join(','))
    },
    addPledgeSecret(secret: string) {
      const secrets = this.getPledgeSecrets()
      return this.setPledgesSecrets([...secrets, secret])
    },
    commit() {
      return pledgeStorage.commitSession(session)
    },
  }
}

export { getPledgeSession }
