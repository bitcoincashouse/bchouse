import { Links, LiveReload, Meta, Scripts } from '@remix-run/react'
import React from 'react'

export const Document = ({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) => {
  return (
    <html lang="en" className="bg-primary text-primary-text">
      <head>
        <Meta />
        <Links />
      </head>
      <body className={className}>
        <div id="app">
          <div className="w-full flex flex-col min-h-screen">{children}</div>
        </div>
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}
