import { pagesRouter } from './pages'
import { searchRouter } from './pages/search'
import { mergeRouters } from './trpc'

export const appRouter = mergeRouters(searchRouter, pagesRouter)
