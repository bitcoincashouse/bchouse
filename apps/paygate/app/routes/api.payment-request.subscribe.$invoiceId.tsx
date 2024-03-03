import { LoaderFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { cors } from '~/utils/cors'
import { eventStream } from '~/utils/event-stream'
import { zx } from '~/utils/zodix'

export async function loader(_: LoaderFunctionArgs) {
  if (_.request.method.toLowerCase() === 'options') {
    return await cors(_.request, new Response('ok', { status: 200 }))
  }

  const { invoiceId } = zx.parseParams(_.params, {
    invoiceId: z.string(),
  })

  const invoice = await _.context.paygateService.getInvoice({ invoiceId })

  return cors(
    _.request,
    eventStream(_.request.signal, function setup(send, abort) {
      if (invoice?.payment) {
        send({ event: 'message', data: 'success' })
      } else {
        //Subscribe to event when pledge payment is recieved (successful or not)
        // Pass the event details to the front-end
        _.context.paygateService.subscribe(invoiceId, (event) => {
          send({ event: 'message', data: event })
        })
      }

      return function clear() {
        _.context.paygateService.unsubscribe(invoiceId)
      }
    })
  )
}
