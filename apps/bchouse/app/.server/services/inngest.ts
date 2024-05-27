import { schemas } from '@bchouse/inngest'
import { Inngest } from 'inngest'
import { appEnv } from '~/.server/appEnv'

export const inngest = new Inngest({
  id: 'flipstarter',
  schemas,
  eventKey: appEnv.INNGEST_EVENT_KEY,
  env: appEnv.INNGEST_BRANCH,
})
