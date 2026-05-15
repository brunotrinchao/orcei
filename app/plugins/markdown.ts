import MarkdownIt from 'markdown-it'

export default defineNuxtPlugin(() => {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
  })

  return {
    provide: {
      md
    }
  }
})
