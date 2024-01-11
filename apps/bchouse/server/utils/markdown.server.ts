export default async function parseMarkdown(content: any) {
  const [
    unified,
    markdown,
    remark2rehype,
    githubMarkdown,
    html,
    htmlInMarkdown,
  ] = await Promise.all([
    import('unified').then((d) => d.unified),
    import('remark-parse').then((d) => d.default),
    import('remark-rehype').then((d) => d.default),
    import('remark-gfm').then((d) => d.default),
    import('rehype-stringify').then((d) => d.default),
    import('rehype-raw').then((d) => d.default),
  ])

  const processor = unified()
    .use(githubMarkdown)
    .use(markdown)
    .use(remark2rehype, { allowDangerousHtml: true })
    .use(htmlInMarkdown)
    .use(html)
  const result = await processor.process(content)
  return String(result)
}
