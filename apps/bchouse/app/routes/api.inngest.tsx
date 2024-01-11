import { ActionArgs, LoaderArgs } from '@remix-run/node'

export const loader = (_: LoaderArgs) => {
  return _.context.inngestService.handler(_)
}

export const action = (_: ActionArgs) => {
  return _.context.inngestService.handler(_)
}
