// Conversor mínimo y seguro de Markdown a HTML para textos escritos por usuarios
// (descripciones de mazos, muchas importadas de MarvelCDB).
//
// Lo comparten la app (DeckDetailPage) y el prerender (seo/prerender.mjs) para que
// ambos muestren exactamente lo mismo. Es JavaScript plano para que Node pueda
// importarlo sin compilar; los tipos están en markdown-lite.d.ts.
//
// Seguridad: primero se descarta el HTML incrustado y se escapa TODO el texto;
// después solo se insertan las etiquetas que genera este fichero. Los enlaces se
// limitan a http(s) y llevan rel="ugc nofollow".

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Quita enlaces internos de MarvelCDB y el HTML incrustado (<hr>, <span class="icon-…">…). */
function stripSource(text) {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .replace(/\[([^\]]+?)\]\(\/card\/\d+\)/g, '$1')
    .replace(/<\/?(?:hr|br|p|div|h[1-6]|ul|ol|li|table|tr)\b[^>]*>/gi, '\n')
    .replace(/<\/?[a-zA-Z][^>]*>/g, '')
}

function inline(raw) {
  return escapeHtml(raw)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="ugc nofollow noopener noreferrer">$1</a>')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*\*|___)(?=\S)(.+?)(?<=\S)\1/g, '<strong><em>$2</em></strong>')
    .replace(/(\*\*|__)(?=\S)(.+?)(?<=\S)\1/g, '<strong>$2</strong>')
    .replace(/(^|[\s(¡¿"'])([*_])(?=\S)([^*_]+?)(?<=\S)\2(?=$|[\s.,;:!?)"'])/g, '$1<em>$3</em>')
}

/**
 * Convierte el texto a HTML: encabezados, listas, párrafos, negrita, cursiva y enlaces.
 * Los encabezados empiezan en `baseHeading` (por defecto h3) y nunca saltan niveles.
 */
export function renderMarkdown(text, { baseHeading = 3 } = {}) {
  const lines = stripSource(text).split('\n')
  const headingLevels = lines.map((l) => /^\s{0,3}(#{1,6})\s+\S/.exec(l)?.[1].length).filter(Boolean)
  const minLevel = headingLevels.length ? Math.min(...headingLevels) : 1
  const out = []
  let paragraph = []
  let list = null
  let prevHeading = baseHeading - 1

  const flushParagraph = () => {
    if (paragraph.length) out.push(`<p>${paragraph.map(inline).join('<br>')}</p>`)
    paragraph = []
  }
  const flushList = () => {
    if (list) out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`)
    list = null
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    const heading = /^(#{1,6})\s+(.*?)\s*#*$/.exec(line)
    const bullet = /^[-*+]\s+(.*)$/.exec(line)
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line)

    if (!line || /^([-*_])\1{2,}$/.test(line)) {
      flushParagraph()
      flushList()
    } else if (heading && heading[2]) {
      flushParagraph()
      flushList()
      const level = Math.min(baseHeading + (heading[1].length - minLevel), prevHeading + 1, 6)
      prevHeading = level
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`)
    } else if (bullet || numbered) {
      flushParagraph()
      const tag = bullet ? 'ul' : 'ol'
      if (list && list.tag !== tag) flushList()
      list ||= { tag, items: [] }
      list.items.push((bullet || numbered)[1])
    } else {
      flushList()
      paragraph.push(line)
    }
  }
  flushParagraph()
  flushList()
  return out.join('\n')
}

/** Quita la nota "[Importado de MarvelCDB]" que la importación añade al final de la descripción. */
export const IMPORT_NOTE = /\s*\[Importado de MarvelCDB\]\s*$/

export function stripImportNote(text) {
  return String(text || '').replace(IMPORT_NOTE, '')
}

/** true si el mazo se importó de MarvelCDB (por el enlace guardado o por la nota antigua). */
export function isImportedDeck(deck) {
  return Boolean(deck && (deck.source_url || IMPORT_NOTE.test(deck.description || '')))
}

/** Resumen en texto plano (sin Markdown ni HTML), recortado por palabra. */
export function plainText(text, max = 300) {
  const t = stripSource(text)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*([-*+]|\d+[.)])\s+/gm, '')
    .replace(/(\*{1,3}|_{1,3})(?=\S)(.+?)(?<=\S)\1/g, '$2')
    .replace(/\s+/g, ' ')
    .trim()
  return t.length > max ? `${t.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : t
}
