import { unified } from 'unified'
import markdown from 'remark-parse'
import remark2rehype from 'remark-rehype'
import githubMarkdown from 'remark-gfm'
import html from 'rehype-stringify'
import htmlInMarkdown from 'rehype-raw'

const processor = unified()
  .use(githubMarkdown)
  .use(markdown)
  .use(remark2rehype, { allowDangerousHtml: true })
  .use(htmlInMarkdown)
  .use(html)

export default async function parseMarkdown(content: any) {
  const result = await processor.process(content)
  return String(result)
}
