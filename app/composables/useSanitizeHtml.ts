import sanitizeHtml from 'sanitize-html'

// Mesmas allowedTags/allowedAttributes/allowedStyles do server
// (server/api/proposals/public/[slug].get.ts, server/utils/pdf.ts).
// Defesa em profundidade: servidor já sanitiza antes de enviar, isso
// protege contra qualquer ponto de entrada que não passe por lá.
const sanitizeOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
    'nl', 'li', 'ins', 'del', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
    'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'span'
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target'],
    span: ['style', 'class'],
    p: ['style', 'class'],
    div: ['style', 'class'],
    table: ['style', 'class'],
    tr: ['style', 'class'],
    td: ['style', 'class']
  },
  allowedStyles: {
    '*': {
      'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
      'color': [/^#(?:[0-9a-fA-F]{3}){1,2}$/, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/],
      'background-color': [/^#(?:[0-9a-fA-F]{3}){1,2}$/, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/],
      'font-size': [/^\d+(?:px|em|rem|%)$/],
      'font-weight': [/^bold$/, /^normal$/, /^\d+$/],
      'padding-left': [/^\d+(?:px|em|rem|%)$/]
    }
  }
}

export function useSanitizeHtml(html: string | null | undefined) {
  return sanitizeHtml(html || '', sanitizeOptions)
}
