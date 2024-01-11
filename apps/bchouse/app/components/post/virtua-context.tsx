export type VirtuaContext = {
  previousLoader: LoaderContext
  nextLoader: LoaderContext
}

export type LoaderContext = {
  isRendered: boolean
  isFetching: boolean
  hasMore: boolean
  onTrigger: () => void
}
