import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'

export const loader = (_: LoaderFunctionArgs) => {
  return _.context.inngestService.handler(_)
}

export const action = (_: ActionFunctionArgs) => {
  return _.context.inngestService.handler(_)
}
