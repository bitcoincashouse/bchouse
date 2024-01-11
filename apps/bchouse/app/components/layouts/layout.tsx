export default function Layout({
  title,
  description,
  wrapperClassName,
  children
} : {
  title?: React.ReactNode,
  description?: React.ReactNode,
  wrapperClassName?: string,
  children?: React.ReactNode
}) {
  return <>{children}</>
}