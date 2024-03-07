import { createContext, useContext } from 'react'

export type CurrentUser = {
  isAnonymous: boolean
  isAdmin: boolean
  username: string
  avatarUrl: string
  fullName: string
  id: string
}

const CurrentUserContext = createContext<CurrentUser | null>(null)

export const CurrentUserProvider = ({
  user,
  children,
}: {
  user: CurrentUser
  children: React.ReactNode
}) => {
  return (
    <CurrentUserContext.Provider value={user}>
      {children}
    </CurrentUserContext.Provider>
  )
}

export const useCurrentUser = () => {
  const ctx = useContext(CurrentUserContext)
  if (ctx === null) {
    throw new Error('User context must be a child of CurrentUserProvider')
  }

  return ctx
}
