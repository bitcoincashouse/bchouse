import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import cors from 'cors'
import express from 'express'
import { appRouter } from './app'
import { createContext } from './trpc'

const app = express()

app.use(cors({ credentials: true, origin: 'http://localhost:3000' }))
app.use(ClerkExpressWithAuth())
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
)

const server = app.listen(3003)
export type AppRouter = typeof appRouter
