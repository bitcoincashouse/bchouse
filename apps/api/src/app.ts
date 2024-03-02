import { searchRouter } from './search'
import { mergeRouters } from './trpc'

export const appRouter = mergeRouters(searchRouter)
