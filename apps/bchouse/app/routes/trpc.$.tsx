import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '~/.server/router'
import { getAuthOptional } from '~/utils/auth'

export const loader = async (args: LoaderFunctionArgs) => {
  return handleRequest(args)
}

export const action = async (args: ActionFunctionArgs) => {
  return handleRequest(args)
}

async function handleRequest(args: LoaderFunctionArgs | ActionFunctionArgs) {
  const auth = await getAuthOptional(args)
  return fetchRequestHandler({
    endpoint: '/trpc',
    req: args.request,
    router: appRouter,
    createContext() {
      return {
        auth,
        // auth: (req as any).auth as AuthObject,
        // ip: req.headers['Fly-Client-IP'] ?? req.socket.remoteAddress,
      }
    },
  })
}
