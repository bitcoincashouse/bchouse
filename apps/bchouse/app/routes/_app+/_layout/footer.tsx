import { usePageDisplay } from '~/utils/appHooks'

export function Footer() {
  const pageProps = usePageDisplay()

  return (
    <>
      {pageProps.showFooter && (
        <footer className="flex items-center min-h-[110px] justify-center pt-[33vh] pb-10 center grass">
          <p>
            Powered by{' '}
            <a
              className="text-blue-600"
              href="https://cashscript.org"
              target="_blank"
            >
              CashScript
            </a>
          </p>
        </footer>
      )}
    </>
  )
}
