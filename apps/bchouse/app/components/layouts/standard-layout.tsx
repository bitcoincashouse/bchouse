import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useNavigate } from '@remix-run/react'
import StickyBox from 'react-sticky-box'
import { Search } from '~/components/search/autocomplete-search'
import { classNames } from '~/utils/classNames'

type LayoutProps = {
  title?: React.ReactNode
  header?: React.ReactNode
  main?: React.ReactNode
  widgets?: (React.ReactNode | null)[]
  reverseOrder?: boolean
  hideBackButton?: boolean
  headroom?: boolean
  subtitle?: React.ReactNode
  headerIcons?: React.ReactNode
  hideXs?: boolean
  hideSearch?: boolean
}

export function StandardLayout({
  header,
  title,
  main,
  widgets = [],
  hideBackButton = false,
  headerIcons = null,
  headroom = false,
  subtitle,
  hideXs = false,
  hideSearch = false,
}: LayoutProps) {
  const navigate = useNavigate()
  widgets = widgets.filter(Boolean)

  return (
    <div className="min-h-full">
      <main>
        <div
          className={classNames(
            'flex gap-6 sm:max-w-[1000px] mx-auto non-mobile:mx-0 flex-row min-h-screen items-start w-screen non-mobile:w-auto',
            widgets.length ? 'lg:grid-cols-3' : ''
          )}
        >
          <StickyBox
            offsetBottom={40}
            className="hidden lg:block pt-2 min-[990px]:block w-[290px] min-[1080px]:w-[350px] relative order-last"
          >
            <div className={classNames('flex flex-col gap-4 pt-2 relative')}>
              {!hideSearch ? <Search /> : null}
              {widgets.map((widget, index) => (
                <div key={index}>{widget}</div>
              ))}
            </div>
          </StickyBox>
          <div
            className={classNames(
              'non-mobile:w-[600px] w-full non-mobile:border !border-t-0 border-gray-100 dark:border-gray-600 dark:border-gray-600'
            )}
          >
            <div className="flex flex-col gap-6 bg-primary">
              {/* Welcome panel */}
              <div className="relative z-0 flex-1 focus:outline-none bg-primary min-h-screen">
                {/* Breadcrumb */}
                <nav className="sticky top-0 z-40" aria-label="Breadcrumb">
                  <div className="backdrop-blur-lg bg-primary">
                    {!hideBackButton ||
                    !!title ||
                    !!subtitle ||
                    !!headerIcons ? (
                      <div
                        className={classNames(
                          hideXs ? 'hidden sm:flex' : 'flex',
                          'items-center gap-3 py-3 mx-3'
                        )}
                      >
                        {!hideBackButton ? (
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
                            <ArrowLeftIcon
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
                          </button>
                        ) : null}
                        <div>
                          <div className="items-center space-x-3 text-lg font-bold text-primary-text">
                            <span>{title}</span>
                          </div>
                          <div className="items-center space-x-3 text-sm font-light text-secondary-text">
                            <span>{subtitle}</span>
                          </div>
                        </div>
                        {headerIcons}
                      </div>
                    ) : null}
                    {header}
                  </div>
                </nav>
                {main}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
