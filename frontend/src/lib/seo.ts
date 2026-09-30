// Metadatos por página (título, descripción, canonical y robots) para una SPA.
// Cada ruta llama a usePageMeta; al desmontarse se restauran los valores del
// index.html para que nunca quede el canonical de otra página.
// El HTML inicial de las rutas públicas ya trae estos mismos valores: lo genera
// seo/prerender.mjs en el build (mantener los textos sincronizados).
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export const SITE_URL = 'https://aiforgedecks.com'
export const SITE_NAME = 'AIForge'
const DEFAULT_TITLE = 'AIForge: mazos de Marvel Champions con IA'
const DEFAULT_DESCRIPTION =
  'AIForge: crea, comparte y analiza mazos de Marvel Champions con ayuda de inteligencia artificial.'

/**
 * true si esta carga vino del shell de reserva de /decks/:id o /cards/set/:id
 * (dist/app-dynamic.html, que trae <meta name="robots" content="noindex" data-fallback>):
 * la URL no tiene página prerenderizada, así que o es contenido nuevo o no existe.
 * Esas páginas mantienen el noindex hasta que el dato carga de verdad.
 * Se evalúa una sola vez al arrancar, antes de que ningún efecto toque el <head>.
 */
export const SERVED_FROM_FALLBACK =
  typeof document !== 'undefined' && document.head.querySelector('meta[name="robots"][data-fallback]') !== null

export interface PageMeta {
  /** Título de la página, sin la marca (se añade " | AIForge"). Omitir en la home. */
  title?: string
  description?: string
  /** true para páginas que no deben indexarse (404, estados vacíos...). */
  noindex?: boolean
  /** false para no emitir canonical (por ejemplo, mientras carga un recurso). */
  canonical?: boolean
}

function upsertMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    document.head.appendChild(el)
  }
  Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v))
  return el
}

export function usePageMeta({ title, description, noindex = false, canonical = true }: PageMeta) {
  const { pathname } = useLocation()

  useEffect(() => {
    // Los buscadores cortan el título hacia los 60 caracteres: si no cabe, se omite la marca.
    const branded = `${title} | ${SITE_NAME}`
    const fullTitle = title ? (branded.length > 60 ? title : branded) : DEFAULT_TITLE
    const desc = description || DEFAULT_DESCRIPTION
    document.title = fullTitle
    upsertMeta('meta[name="description"]', { name: 'description', content: desc })
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle })
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: desc })

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (canonical && !noindex) {
      if (!link) {
        link = document.createElement('link')
        link.rel = 'canonical'
        document.head.appendChild(link)
      }
      const path = pathname === '/' ? '/' : pathname.replace(/\/+$/, '')
      link.href = SITE_URL + path
      upsertMeta('meta[property="og:url"]', { property: 'og:url', content: SITE_URL + path })
    } else if (link) {
      link.remove()
    }

    const robots = document.head.querySelector('meta[name="robots"]')
    if (noindex) upsertMeta('meta[name="robots"]', { name: 'robots', content: 'noindex' })
    else robots?.remove()

    return () => {
      document.title = DEFAULT_TITLE
      upsertMeta('meta[name="description"]', { name: 'description', content: DEFAULT_DESCRIPTION })
      upsertMeta('meta[property="og:title"]', { property: 'og:title', content: DEFAULT_TITLE })
      upsertMeta('meta[property="og:description"]', { property: 'og:description', content: DEFAULT_DESCRIPTION })
      document.head.querySelector('link[rel="canonical"]')?.remove()
      document.head.querySelector('meta[property="og:url"]')?.remove()
      document.head.querySelector('meta[name="robots"]')?.remove()
    }
  }, [title, description, noindex, canonical, pathname])
}
