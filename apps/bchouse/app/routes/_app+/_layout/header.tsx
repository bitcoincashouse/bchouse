import { usePageDisplay } from '~/utils/appHooks'

export function Header() {
  const pageProps = usePageDisplay()

  return (
    <>
      {/* Header */}
      {pageProps.header && pageProps.title && (
        <header className="pt-16 pb-12 w-full">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight">
              {pageProps.title}
            </h1>
          </div>
        </header>
      )}
    </>
  )
}
