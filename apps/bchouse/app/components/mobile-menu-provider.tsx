import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { createContext, useContext, useState } from 'react'

const MobileMenuContext = createContext<{
  menuOpen: boolean
  setMenuOpen: Dispatch<SetStateAction<boolean>>
} | null>(null)

export function MobileMenuProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <MobileMenuContext.Provider value={{ menuOpen, setMenuOpen }}>
      {children}
    </MobileMenuContext.Provider>
  )
}

export function useMobileMenu() {
  const context = useContext(MobileMenuContext)
  if (!context) {
    throw new Error('useMobileMenu must be used in child of MobileMenuProvider')
  }

  return context
}
