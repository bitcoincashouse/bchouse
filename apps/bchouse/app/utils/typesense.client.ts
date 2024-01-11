import { Client } from 'typesense'

export const typesenseClient = new Client({
  nodes: [
    {
      url: window.env?.TYPESENSE_PUBLIC_URL || 'http://localhost:8108',
    },
  ],
  apiKey: window.env?.TYPESENSE_PUBLIC_API_KEY || 'xyz',
  connectionTimeoutSeconds: 2,
})
