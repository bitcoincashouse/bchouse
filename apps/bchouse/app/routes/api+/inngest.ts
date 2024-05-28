import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { inngestService } from '~/.server/getContext'

export const loader = (_: LoaderFunctionArgs) => {
  return inngestService.handler(_)
}

export const action = (_: ActionFunctionArgs) => {
  return inngestService.handler(_)
}
