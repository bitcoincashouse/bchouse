import { Doc } from '@bchouse/utils'
import { Link } from '@remix-run/react'
import { $path } from 'remix-routes'
import { ImageProxy } from '../image-proxy'
import { classnames } from '../utils/classnames'

export function PostContentRenderer({
  content,
  showFullLength,
}: {
  showFullLength?: boolean
  content: Doc
}) {
  return (
    <div className="flex flex-col gap-3">
      {content.content.map((node, i) => {
        if (node.type === 'paragraph') {
          return (
            <p key={i}>
              {node.content.map((node, i) => {
                if (node.type === 'hashtag') {
                  return (
                    <Link
                      key={i}
                      data-type="hashtag"
                      data-id={node.attrs.id}
                      className="text-blue-400 dark:text-blue-600 font-semibold"
                      to={$path('/hashtag/:hashtag', {
                        hashtag: node.attrs.label,
                      })}
                    >
                      #{node.attrs.label}
                    </Link>
                  )
                } else if (node.type === 'mention') {
                  return (
                    <Link
                      key={i}
                      data-type="mention"
                      data-id={node.attrs.id}
                      className="text-primary-text font-semibold"
                      to={$path('/profile/:username', {
                        username: node.attrs.label,
                      })}
                    >
                      @{node.attrs.label}
                    </Link>
                  )
                } else if (node.type === 'text') {
                  const marks = node.marks?.map((m) => m.type) || []
                  const isBold = marks.indexOf('bold') !== -1
                  const isItalic = marks.indexOf('italic') !== -1
                  const link = node.marks?.find((m) => m.type === 'link')

                  return (
                    <span
                      key={i}
                      className={classnames(
                        isBold && 'font-bold',
                        isItalic && 'italic'
                      )}
                    >
                      {link && link.type === 'link' ? (
                        <a
                          href={link.attrs.href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {node.text}
                        </a>
                      ) : (
                        node.text
                      )}
                    </span>
                  )
                } else if (node.type === 'hardBreak') {
                  return <br key={i} />
                }

                return null
              })}
            </p>
          )
        } else if (node.type === 'media') {
          return (
            <div key={i} className="py-2">
              {showFullLength ? (
                <ImageProxy
                  {...node.attrs}
                  mediaKey={node.attrs.id}
                  className="object-cover w-full"
                />
              ) : (
                <ImageProxy
                  {...node.attrs}
                  mediaKey={node.attrs.id}
                  width={600}
                  quality={100}
                  aspectRatio="16:9"
                  className="object-cover w-full"
                />
              )}
            </div>
          )
        }

        return null
      })}
    </div>
  )
}
