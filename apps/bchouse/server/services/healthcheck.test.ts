import { describe } from 'vitest'
import { HealthcheckService } from './healthcheck'

function getInstance() {
  const service = new HealthcheckService()

  return {
    service,
  }
}

describe('healthcheck service', () => {})
