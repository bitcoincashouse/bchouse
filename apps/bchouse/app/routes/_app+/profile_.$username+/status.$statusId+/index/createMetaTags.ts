import { Params } from '@remix-run/react'
import { generateText } from '@tiptap/core'
import { PostCardModel } from '~/.server/services/types'
import { getExtensions } from '~/components/post/form/tiptap-extensions'

export function createMetaTags(mainPost: PostCardModel, params: Params) {
  const author = mainPost.person.name || mainPost.person.handle
  let content = 'A post on BCHouse by ' + author

  try {
    content = generateText(
      mainPost.content,
      getExtensions('Placeholder', () => {})
    ).substring(0, 200)
  } catch (err) {}

  const title =
    (mainPost.person.name
      ? `${mainPost.person.name} (@${mainPost.person.handle})`
      : mainPost.person.handle) + ' on BCHouse'

  const logoUrl = 'https://bchouse.fly.dev/assets/images/bchouse.png'
  const url = `https://bchouse.fly.dev/profile/${params.username}/status/${params.statusId}`
  const author_url = `https://bchouse.fly.dev/profile/${params.username}`

  return [
    { title },
    { name: 'description', content: content },
    { name: 'lang', content: 'en' },
    { name: 'author', content: author },
    { name: 'author_url', content: author_url },
    { name: 'site', content: 'BCHouse' },
    { name: 'canonical', content: url },

    { name: 'og:title', content: title },
    { name: 'og:description', content: content },
    { name: 'og:site_name', content: 'BCHouse' },
    { name: 'og:url', content: url },
    { name: 'og:image:url', content: logoUrl },
    { name: 'og:image:type', content: 'image/png' },
    { name: 'og:image:width', content: 534 },
    { name: 'og:image:height', content: 94 },
    { name: 'og:image:alt', content: 'BCHouse Logo' },

    { name: 'twitter:card', content: content },
    { name: 'twitter:site', content: 'BCHouse' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: content },
    { name: 'twitter:image', content: logoUrl },
  ]
}
