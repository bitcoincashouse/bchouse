import { db } from '../db'

export class HealthcheckService {
  constructor() {}

  async checkHealth(host: string) {
    const url = new URL('/', `http://${host}`)

    await Promise.all([
      db.selectFrom('User').select('id').limit(1).execute(),
      fetch(url.toString(), { method: 'HEAD' }).then((r) => {
        if (!r.ok) return Promise.reject(r)
        return
      }),
    ])
  }
}
