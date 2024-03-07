import { isApplicationError, isClerkError, logger } from '@bchouse/utils'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { useNavigate } from '@remix-run/react'
import { typedjson, useTypedFetcher, useTypedLoaderData } from 'remix-typedjson'
import { z } from 'zod'
import { zx } from '~/utils/zodix'

export const loader = async (_: LoaderFunctionArgs) => {
  await _.context.ratelimit.limitByIp(_, 'api', true)

  const { code } = zx.parseParams(_.params, {
    code: z.string().optional(),
  })

  const invitationInfo = code
    ? await _.context.authService.getInviteCode({
        code,
      })
    : null

  if (!invitationInfo) {
    return typedjson(null)
  }

  return typedjson({
    code: invitationInfo.code,
    invitationFrom: invitationInfo.name,
  })
}

export const action = async (_: ActionFunctionArgs) => {
  try {
    const { emailAddress, code } = await zx.parseForm(_.request, {
      emailAddress: z.string().email(),
      code: z.string(),
    })

    const result = await _.context.authService.claimInviteCode({
      code,
      emailAddress,
    })

    return typedjson({
      error: false as const,
      emailAddress: emailAddress,
    })
  } catch (err) {
    logger.error('Error inviting user', err)

    if (isClerkError(err) && err.errors[0]) {
      if (err.errors[0].message === 'duplicate allowlist identifier') {
        return typedjson({
          error: true as const,
          message: 'Email already invited',
        })
      }

      return typedjson({ error: true as const, message: err.errors[0].message })
    }

    if (isApplicationError(err) && err.errors[0]) {
      return typedjson({ error: true as const, message: err.errors[0].message })
    }

    return typedjson({
      error: true as const,
      message: 'Error inviting user, please try again.',
    })
  }
}

export default function Index() {
  const data = useTypedLoaderData<typeof loader>()
  const fetcher = useTypedFetcher<typeof action>()
  const result = fetcher.data

  const navigate = useNavigate()

  return (
    <>
      <div className="flex min-h-full">
        <div className="flex flex-1 flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div>
              <div className="flex flex-row gap-2">
                <button
                  className="hover:bg-gray-200 dark:bg-hover rounded-full p-2"
                  title="Back"
                  //Go back if there's history, otherwise go to home
                  onClick={() => {
                    if (window.history.state.idx > 0) {
                      window.history.back()
                    } else {
                      navigate('/home')
                    }
                  }}
                >
                  <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                <h2 className="text-3xl font-bold tracking-tight text-primary-text">
                  Claim invite code
                </h2>
              </div>
              {data?.code ? (
                <p className="mt-2 text-sm text-secondary-text">
                  Claiming{' '}
                  <span className="font-medium text-indigo-600">
                    {data.code}
                  </span>{' '}
                  from{' '}
                  <span className="font-medium text-indigo-600">
                    {data.invitationFrom}
                  </span>
                </p>
              ) : null}
            </div>
            <div className="mt-6">
              <fetcher.Form
                className="flex flex-col gap-4 caret-black"
                method="POST"
              >
                <input
                  autoFocus
                  className="border border-gray-300 p-3 rounded-lg placeholder:text-gray-400 w-full text-gray-900"
                  placeholder="Code"
                  type={data?.code ? 'hidden' : 'text'}
                  name="code"
                  defaultValue={data?.code || ''}
                  required
                ></input>
                <input
                  autoFocus
                  className="border border-gray-300 p-3 rounded-lg placeholder:text-gray-400 w-full text-gray-900"
                  placeholder="Email"
                  type="email"
                  name="emailAddress"
                  required
                ></input>
                <div className="flex items-center">
                  {result && !result.error ? (
                    <div className="pt-2 text-green-500 font-readable">
                      <h2>Invitation sent to {result.emailAddress}!</h2>
                    </div>
                  ) : null}

                  {result?.error ? (
                    <div className="pt-2 text-red-400 font-readable">
                      {result.message}
                    </div>
                  ) : null}
                  <button
                    type="submit"
                    className="ml-auto bg-purple-500 rounded-lg text-white font-semibold p-4"
                  >
                    {fetcher.state === 'submitting' ? 'Claiming' : 'Claim'}
                  </button>
                </div>
              </fetcher.Form>
            </div>
          </div>
        </div>
        <div className="relative hidden w-0 flex-1 lg:block min-h-screen">
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src="https://images.unsplash.com/photo-1505904267569-f02eaeb45a4c?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1908&q=80"
            alt=""
          />
        </div>
      </div>
    </>
  )
}
