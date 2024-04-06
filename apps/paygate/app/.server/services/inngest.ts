import { schemas } from '@bchouse/inngest'
import { appEnv } from 'appEnv'
import { Inngest } from 'inngest'

export const inngest = new Inngest({
  id: 'flipstarter',
  schemas,
  eventKey: appEnv.INNGEST_EVENT_KEY,
  env: appEnv.INNGEST_BRANCH,
})
