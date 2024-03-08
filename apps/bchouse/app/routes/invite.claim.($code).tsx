import { ArrowLeftIcon } from '@heroicons/react/20/solid'
import { LoaderFunctionArgs } from '@remix-run/node'
import { useNavigate, useParams } from '@remix-run/react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { trpc } from '~/utils/trpc'
import { zx } from '~/utils/zodix'

export const loader = async (_: LoaderFunctionArgs) => {
  const { code } = zx.parseParams(_.params, {
    code: z.string().optional(),
  })

  await _.context.trpc.profile.getInvite.prefetch({ code })
  return _.context.getDehydratedState()
}

export default function Index() {
  const { code } = useParams<{ code: string }>()
  const { data } = trpc.profile.getInvite.useQuery(
    { code: code! },
    {
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
    }
  )

  const claimInviteMutation = trpc.profile.claimInvite.useMutation()
  const result = claimInviteMutation.data

  const navigate = useNavigate()

  const { register, handleSubmit } = useForm<{
    code: string
    emailAddress: string
  }>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      code: data?.code,
      emailAddress: '',
    },
  })

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
              <form
                className="flex flex-col gap-4 caret-black"
                method="POST"
                onSubmit={handleSubmit((data) =>
                  claimInviteMutation.mutate({
                    code: data.code,
                    emailAddress: data.emailAddress,
                  })
                )}
              >
                <input
                  autoFocus
                  className="border border-gray-300 p-3 rounded-lg placeholder:text-gray-400 w-full text-gray-900"
                  placeholder="Code"
                  type={data?.code ? 'hidden' : 'text'}
                  id="code"
                  {...register('code', { required: true })}
                ></input>
                <input
                  autoFocus
                  className="border border-gray-300 p-3 rounded-lg placeholder:text-gray-400 w-full text-gray-900"
                  placeholder="Email"
                  type="email"
                  id="emailAddress"
                  {...register('emailAddress', { required: true })}
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
                    {claimInviteMutation.status === 'pending'
                      ? 'Claiming'
                      : 'Claim'}
                  </button>
                </div>
              </form>
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
