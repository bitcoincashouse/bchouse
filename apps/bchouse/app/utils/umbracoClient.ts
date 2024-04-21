const DELIVERY_API_PATH = '/umbraco/delivery/api/v2/content'
const baseUrl =
  typeof window !== 'undefined'
    ? window.env.UMBRACO_URL
    : (process.env.UMBRACO_URL as string)

type Options = {
  sort?: string
  fetch?: string
  skip?: string
  take?: string
  expand?: string
  fields?: string
  filter?: string
}

function createClient(domain: string) {
  const deliveryApiUrl = `${domain}${DELIVERY_API_PATH}`

  return {
    getContentById: async (id: string) => {
      const response = await fetch(`${deliveryApiUrl}/item/${id}`)
      const data = await response.json()

      return data
    },
    queryContent: async (options: Options = {}) => {
      let searchParams = new URLSearchParams(options)
      const response = await fetch(
        `${deliveryApiUrl}?${searchParams.toString()}`
      )

      if (response.ok) {
        const data = await response.json()
        return data
      } else {
        throw await response.json().catch(() => {
          return {
            error: response.statusText || 'Unknown error',
            code: response.status,
          }
        })
      }
    },
    getUrl(path?: string) {
      return path ? baseUrl + path : undefined
    },
  }
}

const umbracoClient = createClient(baseUrl)

export { umbracoClient }
