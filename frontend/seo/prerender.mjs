// Prerender de las rutas públicas (se ejecuta después de `vite build`).
//
// La web es una SPA: sin esto, el HTML que recibe un buscador o un rastreador de IA
// está vacío. Este script pide los datos públicos al backend y escribe un HTML por
// ruta con su <title>, descripción, canonical, datos estructurados y el contenido
// real en HTML semántico. Con JavaScript, ese bloque se oculta y React lo sustituye
// al arrancar (ver #seo-static en index.html), así que la experiencia no cambia.
//
// - Rutas: /, /decks, /decks/:id, /cards, /cards/set/:id, /cards/search, /faq, /games-history, /about, /privacy
// - Además: dist/app.html (shell para rutas privadas y 404), sitemap.xml, llms.txt y una
//   imagen para redes por mazo (dist/og/deck-<id>.png, ver og-image.mjs).
// - Si el backend no responde, genera lo que pueda y NO rompe el build.
// - Los títulos y descripciones deben coincidir con los de usePageMeta (src/lib/seo.ts),
//   y cada <h1> con el que pinta React (los de las páginas fijas salen de page-meta.json).
import { existsSync } from 'node:fs'
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderMarkdown, plainText } from '../src/lib/markdown-lite.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const SITE = 'https://aiforgedecks.com'
const SITE_NAME = 'AIForge'
const API = (process.env.PRERENDER_API_URL || 'https://marveldcb-backend.onrender.com/api').replace(/\/+$/, '')
const DEFAULT_TITLE = 'AIForge: mazos de Marvel Champions con IA'

const pageMeta = JSON.parse(await readFile(path.join(ROOT, 'src/lib/page-meta.json'), 'utf8'))
const faqs = JSON.parse(await readFile(path.join(ROOT, 'src/data/faqs.json'), 'utf8'))
const infoPages = JSON.parse(await readFile(path.join(ROOT, 'src/data/legal-pages.json'), 'utf8'))

// ---------------------------------------------------------------- utilidades

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

// Mismo mini-formato que InfoPage.tsx: **negrita** y [enlace](https://…)
const inline = (text) =>
  esc(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

// Igual que usePageMeta: si el título con la marca pasa de 60 caracteres, se omite la marca.
const brand = (title) => (`${title} | ${SITE_NAME}`.length > 60 ? title : `${title} | ${SITE_NAME}`)

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')
const fmtDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d) ? '' : d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}
const isoDay = (iso) => {
  const d = iso ? new Date(iso) : null
  return d && !isNaN(d) ? d.toISOString().slice(0, 10) : null
}
const totalCards = (deck) => (deck.cards || []).reduce((n, c) => n + (c.quantity || 1), 0)

const TYPE_LABELS = {
  hero: 'Héroe', alter_ego: 'Alter ego', ally: 'Aliados', event: 'Eventos', upgrade: 'Mejoras',
  support: 'Apoyos', resource: 'Recursos', player_side_scheme: 'Planes secundarios de jugador',
  obligation: 'Obligaciones', attachment: 'Accesorios', environment: 'Entornos', minion: 'Esbirros',
  side_scheme: 'Planes secundarios', treachery: 'Traiciones', villain: 'Villanos', main_scheme: 'Planes principales',
  evidence: 'Pruebas',
}
const DIFFICULTY = { normal: 'Normal', expert: 'Experto', heroic: 'Heroico' }

async function fetchJson(url, { timeout = 90_000, retries = 3 } = {}) {
  for (let i = 1; i <= retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(timeout) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      if (i === retries) throw err
      // Render (plan gratuito) tarda en despertar: esperar y reintentar.
      await new Promise((r) => setTimeout(r, 5_000 * i))
    }
  }
}

async function safe(label, fn, fallback) {
  try {
    return await fn()
  } catch (err) {
    console.warn(`[prerender] aviso: no se pudo cargar ${label} (${err.message}); se genera sin esos datos.`)
    return fallback
  }
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++
        out[i] = await fn(items[i], i)
      }
    })
  )
  return out
}

// ---------------------------------------------------------------- datos

console.log(`[prerender] API: ${API}`)
const sets = await safe('sets', async () => (await fetchJson(`${API}/sets`)).sets || [], [])
const decks = await safe('mazos', async () => {
  const j = await fetchJson(`${API}/decks`)
  return (j.decks || j).filter((d) => d && d.id != null)
}, [])
const games = await safe('partidas', async () => (await fetchJson(`${API}/game-configurations/all`)).games || [], [])
const setCards = await mapLimit(sets, 6, (s) =>
  safe(`cartas del set ${s.id}`, async () => (await fetchJson(`${API}/sets/${s.id}/cards`)).cards || [], null)
)
console.log(`[prerender] datos: ${sets.length} sets, ${decks.length} mazos, ${games.length} partidas`)

// ---------------------------------------------------------------- piezas comunes

// Miga visible: los mismos nombres y el mismo orden que el BreadcrumbList del JSON-LD.
const crumbTrail = (items) =>
  `<p>${items.map(([name, url], i) => (i === items.length - 1 ? esc(name) : `<a href="${url}">${esc(name)}</a>`)).join(' › ')}</p>`

const WEBSITE = { '@id': `${SITE}/#website` }
const GAME = { '@id': `${SITE}/#game` }

// Un único @graph por página: nodo de página + miga + entidades, enlazados por @id.
// El grafo del sitio (Organization, WebSite, WebApplication, Game) ya va en index.html.
function pageGraph(r) {
  const url = SITE + r.path
  const graph = [
    {
      '@type': r.pageType || 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: r.pageName || r.title,
      inLanguage: 'es',
      isPartOf: WEBSITE,
      ...(r.crumbs ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
      ...(r.pageExtra || {}),
    },
  ]
  if (r.crumbs) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: r.crumbs.map(([name, href], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + href })),
    })
  }
  return { '@context': 'https://schema.org', '@graph': [...graph, ...(r.entities || [])] }
}

const NAV = [
  ['/', 'Inicio'], ['/decks', 'Mazos públicos'], ['/cards', 'Cartas por set'],
  ['/cards/search', 'Buscador de cartas'], ['/games-history', 'Historial de partidas'], ['/faq', 'Preguntas frecuentes'],
]

const layout = (main) => `<div id="seo-static">
  <header>
    <p><strong><a href="/">AIForge</a></strong> · Mazos de Marvel Champions con inteligencia artificial</p>
    <nav aria-label="Principal"><ul>${NAV.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join('')}</ul></nav>
  </header>
  <main>
${main}
  </main>
  <footer>
    <ul><li><a href="/about">Sobre AIForge</a></li><li><a href="/privacy">Privacidad</a></li><li><a href="/faq">Preguntas frecuentes</a></li></ul>
    <p>AIForge es un Trabajo de Fin de Grado gratuito y sin ánimo de lucro. Proyecto fan no afiliado a Fantasy Flight Games ni a Marvel. Datos de cartas: <a href="https://marvelcdb.com">MarvelCDB</a>. Contacto: aiforge.soporte@gmail.com</p>
  </footer>
</div>`

const setByName = new Map(sets.map((st) => [st.name, st.id]))
const setLink = (name) => {
  if (!name) return ''
  const id = setByName.get(name)
  return id ? ` (<a href="/cards/set/${id}">${esc(name)}</a>)` : ` (${esc(name)})`
}

const deckLine = (d) =>
  `<li><a href="/decks/${d.id}">${esc(d.name)}</a> — ${esc(d.hero_name || 'Héroe desconocido')}${d.aspect ? ` · ${esc(cap(d.aspect))}` : ''} · ${totalCards(d)} cartas · por ${esc(d.creator_name || 'Anónimo')}${d.created_at ? ` · ${fmtDate(d.created_at)}` : ''}</li>`

// ---------------------------------------------------------------- rutas

const routes = []
const totalSetCards = sets.reduce((n, s) => n + (s.cardCount || 0), 0)
const wins = games.filter((g) => g.result === 'win').length

// Inicio
routes.push({
  path: '/',
  title: DEFAULT_TITLE,
  description: pageMeta.home.description,
  pageName: DEFAULT_TITLE,
  pageExtra: { about: { '@id': `${SITE}/#organization` }, mainEntity: { '@id': `${SITE}/#webapp` } },
  main: `<p>Constructor de mazos · Marvel Champions</p>
<h1>${pageMeta.home.heading}</h1>
<p>AIForge es una plataforma web gratuita para crear y optimizar mazos de Marvel Champions: The Card Game usando inteligencia artificial. Permite crear mazos personalizados, explorar todas las cartas disponibles, registrar tus partidas, generar mazos optimizados con IA para cada villano y compartir tus creaciones con la comunidad.</p>
<h2>Qué puedes hacer</h2>
<ul>
  <li><strong>Recomendación con IA:</strong> genera mazos optimizados para enfrentarte a villanos concretos; la IA aprende de las partidas registradas.</li>
  <li><strong>Constructor de mazos:</strong> elige héroe y aspecto y añade entre 40 y 50 cartas.</li>
  <li><strong>Análisis de partidas:</strong> registra victorias y derrotas por villano y dificultad.</li>
  <li><strong>Comunidad:</strong> comparte tus mazos, comenta los de otros jugadores y guarda tus favoritos.</li>
</ul>
<h2>Cómo funciona</h2>
<ol>
  <li><strong>Elige tu héroe:</strong> selecciona el héroe con el que quieres construir tu mazo.</li>
  <li><strong>Construye tu mazo:</strong> añade las cartas que mejor encajan con tu estrategia.</li>
  <li><strong>Juega y aprende:</strong> registra tus partidas y mejora con cada una.</li>
</ol>
${decks.length || games.length || sets.length ? `<h2>AIForge en cifras</h2>
<ul>
  ${decks.length ? `<li>${decks.length} mazos públicos creados por la comunidad</li>` : ''}
  ${games.length ? `<li>${games.length} partidas registradas (${wins} victorias)</li>` : ''}
  ${sets.length ? `<li>${totalSetCards} cartas en ${sets.length} sets</li>` : ''}
</ul>` : ''}
${decks.length ? `<h2>Últimos mazos de la comunidad</h2>
<ul>${decks.slice(0, 6).map(deckLine).join('\n')}</ul>
<p><a href="/decks">Ver todos los mazos públicos</a></p>` : ''}
<p>¿Dudas? Consulta las <a href="/faq">preguntas frecuentes</a>.</p>`,
})

// Mazos
routes.push({
  path: '/decks',
  title: brand(`${pageMeta.decks.title}`),
  description: pageMeta.decks.description,
  pageType: 'CollectionPage',
  pageName: pageMeta.decks.title,
  crumbs: [['Inicio', '/'], ['Mazos', '/decks']],
  pageExtra: {
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: decks.length,
      itemListElement: decks.map((d, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/decks/${d.id}`, name: d.name })),
    },
  },
  main: `<h1>${pageMeta.decks.heading}</h1>
<p>Mazos de Marvel Champions creados y compartidos por la comunidad de AIForge.${decks.length ? ` Actualmente hay ${decks.length} mazos públicos.` : ''} Todos los mazos son públicos: puedes verlos, añadirlos a favoritos y usarlos como inspiración.</p>
${decks.length ? `<ul>${decks.map(deckLine).join('\n')}</ul>` : ''}`,
})

// Detalle de cada mazo
for (const d of decks) {
  const byType = {}
  for (const c of d.cards || []) (byType[c.type || 'otros'] ||= []).push(c)
  const hasDescription = Boolean(d.description && d.description.trim())
  const crumbs = [['Inicio', '/'], ['Mazos', '/decks'], [d.name, `/decks/${d.id}`]]
  const created = isoDay(d.created_at)
  const modified = isoDay(d.updated_at || d.created_at)
  const sameHero = decks.filter((o) => o.id !== d.id && o.hero_name === d.hero_name)
  routes.push({
    path: `/decks/${d.id}`,
    title: brand(`${d.name} · mazo de ${d.hero_name}`),
    description: `Mazo de Marvel Champions con ${d.hero_name}${d.creator_name ? ` creado por ${d.creator_name}` : ''}: lista de cartas, estadísticas y comentarios en AIForge.`,
    crumbs,
    // Imagen propia al compartir el mazo (se genera más abajo; si falla, queda la genérica)
    image: {
      file: `og/deck-${d.id}.png`,
      alt: `${d.name}: mazo de ${d.hero_name}${d.aspect ? ` (${cap(d.aspect)})` : ''} en AIForge`,
      data: { name: d.name, hero: d.hero_name, aspect: d.aspect, cards: totalCards(d), creator: d.creator_name },
    },
    pageExtra: { mainEntity: { '@id': `${SITE}/decks/${d.id}#deck` } },
    entities: [
      {
        '@type': 'CreativeWork',
        '@id': `${SITE}/decks/${d.id}#deck`,
        name: d.name,
        url: `${SITE}/decks/${d.id}`,
        genre: 'Mazo de Marvel Champions',
        // Resumen en texto plano: la descripción completa (Markdown del usuario) va en el HTML.
        ...(hasDescription ? { description: plainText(d.description) } : {}),
        ...(d.creator_name ? { author: { '@type': 'Person', name: d.creator_name } } : {}),
        ...(created ? { dateCreated: created } : {}),
        ...(modified ? { dateModified: modified } : {}),
        keywords: [d.hero_name, d.aspect && cap(d.aspect), 'Marvel Champions'].filter(Boolean).join(', '),
        about: GAME,
        mainEntityOfPage: { '@id': `${SITE}/decks/${d.id}#webpage` },
        isPartOf: WEBSITE,
      },
    ],
    main: `${crumbTrail(crumbs)}
<h1>${esc(d.name)}</h1>
<p>Mazo de Marvel Champions para <strong>${esc(d.hero_name)}</strong>${d.aspect ? ` con el aspecto <strong>${esc(cap(d.aspect))}</strong>` : ''}, creado por ${esc(d.creator_name || 'un usuario anónimo')}${created ? ` el <time datetime="${created}">${fmtDate(d.created_at)}</time>` : ''}${modified && modified !== created ? ` y actualizado el <time datetime="${modified}">${fmtDate(d.updated_at)}</time>` : ''}. Contiene ${totalCards(d)} cartas en total.</p>
${hasDescription ? `<h2>Descripción</h2>\n${renderMarkdown(d.description)}` : ''}
<h2>Lista de cartas</h2>
${Object.entries(byType)
  .map(([type, cards]) => `<h3>${esc(TYPE_LABELS[type] || cap(type))}</h3>
<ul>${cards.map((c) => `<li>${c.quantity || 1}× ${esc(c.card_name)}${setLink(c.set || c.card_set)}</li>`).join('')}</ul>`)
  .join('\n')}
${sameHero.length ? `<h2>Más mazos de ${esc(d.hero_name)}</h2>\n<ul>${sameHero.slice(0, 5).map(deckLine).join('\n')}</ul>` : ''}
<p>Volver a los <a href="/decks">mazos públicos</a> o explorar las <a href="/cards">cartas por set</a>.</p>`,
  })
}

// Cartas por set
routes.push({
  path: '/cards',
  title: brand(`${pageMeta.cards.title}`),
  description: pageMeta.cards.description,
  pageType: 'CollectionPage',
  pageName: pageMeta.cards.title,
  crumbs: [['Inicio', '/'], ['Cartas', '/cards']],
  pageExtra: {
    about: GAME,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: sets.length,
      itemListElement: sets.map((s, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/cards/set/${s.id}`, name: s.name })),
    },
  },
  main: `<h1>${pageMeta.cards.heading}</h1>
<p>Catálogo de cartas de Marvel Champions: The Card Game organizado por set y expansión${sets.length ? `: ${totalSetCards} cartas en ${sets.length} sets` : ''}. Entra en cada set para ver sus cartas con tipo, aspecto y coste.</p>
${sets.length ? `<ul>${sets.map((s) => `<li><a href="/cards/set/${s.id}">${esc(s.name)}</a> (${s.cardCount} cartas)</li>`).join('\n')}</ul>` : ''}
<p>¿Buscas una carta concreta? Usa el <a href="/cards/search">buscador de cartas</a>.</p>`,
})

// Cada set
sets.forEach((s, i) => {
  const cards = setCards[i]
  if (!cards) return
  const setCrumbs = [['Inicio', '/'], ['Cartas', '/cards'], [s.name, `/cards/set/${s.id}`]]
  routes.push({
    path: `/cards/set/${s.id}`,
    title: brand(`Cartas del set ${s.name}`),
    description: `Todas las cartas del set ${s.name} de Marvel Champions, con estadísticas por tipo, aspecto y coste.`,
    pageType: 'CollectionPage',
    pageName: `Cartas del set ${s.name}`,
    crumbs: setCrumbs,
    pageExtra: {
      about: GAME,
      mainEntity: {
        '@type': 'ItemList',
        name: `Cartas del set ${s.name}`,
        numberOfItems: cards.length,
        itemListElement: cards.map((c, n) => ({ '@type': 'ListItem', position: n + 1, name: c.name })),
      },
    },
    main: `${crumbTrail(setCrumbs)}
<h1>Cartas del set ${esc(s.name)}</h1>
<p>El set <strong>${esc(s.name)}</strong> de Marvel Champions: The Card Game incluye ${cards.length} cartas. Listado completo con tipo, aspecto y coste.</p>
<table>
  <thead><tr><th scope="col">Carta</th><th scope="col">Tipo</th><th scope="col">Aspecto</th><th scope="col">Coste</th></tr></thead>
  <tbody>
${cards.map((c) => `    <tr><td>${esc(c.name)}</td><td>${esc(cap((c.type || '').replace(/_/g, ' ')))}</td><td>${esc(cap(c.clase))}</td><td>${c.cost ?? '—'}</td></tr>`).join('\n')}
  </tbody>
</table>`,
  })
})

// Buscador de cartas
routes.push({
  path: '/cards/search',
  title: brand(`${pageMeta.cardSearch.title}`),
  description: pageMeta.cardSearch.description,
  pageName: pageMeta.cardSearch.title,
  crumbs: [['Inicio', '/'], ['Cartas', '/cards'], ['Buscador', '/cards/search']],
  main: `<h1>${pageMeta.cardSearch.heading}</h1>
<p>Busca cualquier carta de Marvel Champions: The Card Game${totalSetCards ? ` entre las ${totalSetCards} del catálogo` : ''} combinando filtros. Los resultados muestran cada carta con su tipo, aspecto, coste y set.</p>
<h2>Filtros disponibles</h2>
<ul>
  <li><strong>Nombre:</strong> busca por el nombre de la carta, completo o parcial.</li>
  <li><strong>Aspecto:</strong> agresión (aggression), justicia (justice), liderazgo (leadership), protección (protection), básica (basic), pool, héroe y campaña.</li>
  <li><strong>Tipo de carta:</strong> aliado, evento, mejora, apoyo, recurso, accesorio, esbirro, traición, plan secundario, villano y más.</li>
  <li><strong>Coste:</strong> de 0 a 10 recursos.</li>
  <li><strong>Set:</strong> cualquiera de los ${sets.length || 'más de 50'} sets y expansiones publicados.</li>
</ul>
${sets.length ? `<h2>Explorar por set</h2>
<ul>${sets.slice(0, 12).map((st) => `<li><a href="/cards/set/${st.id}">${esc(st.name)}</a> (${st.cardCount} cartas)</li>`).join('')}</ul>` : ''}
<p>Consulta el <a href="/cards">catálogo completo por sets</a> o los <a href="/decks">mazos públicos</a> de la comunidad para ver cómo se combinan las cartas.</p>`,
})

// Historial de partidas
const recentGames = games.slice(0, 50)
routes.push({
  path: '/games-history',
  title: brand(`${pageMeta.gamesHistory.title}`),
  description: pageMeta.gamesHistory.description,
  pageName: pageMeta.gamesHistory.title,
  crumbs: [['Inicio', '/'], ['Historial de partidas', '/games-history']],
  main: `<h1>${pageMeta.gamesHistory.heading}</h1>
<p>Partidas registradas por los jugadores de AIForge.${games.length ? ` En total hay ${games.length} partidas, con ${wins} victorias (${Math.round((wins / games.length) * 100)} %).` : ''} Estos resultados alimentan la recomendación de mazos con inteligencia artificial.</p>
${recentGames.length ? `<h2>Últimas partidas</h2>
<table>
  <thead><tr><th scope="col">Fecha</th><th scope="col">Mazo</th><th scope="col">Héroe</th><th scope="col">Villano</th><th scope="col">Dificultad</th><th scope="col">Resultado</th></tr></thead>
  <tbody>
${recentGames.map((g) => `    <tr><td>${fmtDate(g.played_at)}</td><td>${g.deck_id ? `<a href="/decks/${g.deck_id}">${esc(g.deck_name)}</a>` : esc(g.deck_name)}</td><td>${esc(g.hero_name)}</td><td>${esc(g.villain_name)}</td><td>${esc(DIFFICULTY[g.difficulty] || cap(g.difficulty))}</td><td>${g.result === 'win' ? 'Victoria' : 'Derrota'}</td></tr>`).join('\n')}
  </tbody>
</table>` : ''}`,
})

// FAQ
routes.push({
  path: '/faq',
  title: brand(`${pageMeta.faq.title}`),
  description: pageMeta.faq.description,
  pageType: 'FAQPage',
  pageName: pageMeta.faq.title,
  crumbs: [['Inicio', '/'], ['Preguntas frecuentes', '/faq']],
  pageExtra: {
    dateModified: pageMeta.faq.reviewed,
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
  },
  main: `<h1>${pageMeta.faq.heading}</h1>
${faqs.map((f) => `<h2>${esc(f.question)}</h2>\n<p>${esc(f.answer)}</p>`).join('\n')}
<p>Última revisión: <time datetime="${pageMeta.faq.reviewed}">${fmtDate(pageMeta.faq.reviewed)}</time>. Más detalles sobre el modelo de IA en <a href="/about">Sobre AIForge</a>.</p>`,
})

// Sobre AIForge y Política de privacidad
for (const [key, pg] of Object.entries(infoPages)) {
  routes.push({
    path: pg.path,
    title: brand(`${pg.title}`),
    description: pg.description,
    pageType: key === 'about' ? 'AboutPage' : 'WebPage',
    pageName: pg.heading,
    crumbs: [['Inicio', '/'], [pg.heading, pg.path]],
    pageExtra: {
      dateModified: pg.updated,
      ...(key === 'about' ? { about: { '@id': `${SITE}/#organization` }, author: { '@id': `${SITE}/#founder` } } : {}),
    },
    main: `<h1>${esc(pg.heading)}</h1>
<p>${esc(pg.lead)}</p>
${pg.sections
  .map((sec) => [
    `<h2>${esc(sec.title)}</h2>`,
    ...(sec.paragraphs || []).map((t) => `<p>${inline(t)}</p>`),
    sec.items ? `<ul>${sec.items.map((t) => `<li>${inline(t)}</li>`).join('')}</ul>` : '',
    ...(sec.after || []).map((t) => `<p>${inline(t)}</p>`),
  ].join('\n'))
  .join('\n')}
<p>Última actualización: <time datetime="${pg.updated}">${fmtDate(pg.updated)}</time></p>`,
  })
}

// ---------------------------------------------------------------- escritura

// Shell sin contenido ni canonical: rutas privadas, 404 y cualquier otra ruta de la SPA.
// Es la copia intacta del index.html de Vite (si ya existe, el script se está repitiendo).
const SHELL = path.join(DIST, 'app.html')
if (!existsSync(SHELL)) await copyFile(path.join(DIST, 'index.html'), SHELL)
// Vercel sirve 404.html (con estado 404) a cualquier ruta que no esté en los rewrites:
// es el mismo shell, y React muestra la página "no encontrada" con noindex.
await copyFile(SHELL, path.join(DIST, '404.html'))
const template = await readFile(SHELL, 'utf8')
// Shell para /decks/:id y /cards/set/:id cuando no hay página prerenderizada (contenido
// creado después del build, o un id que no existe). Lleva noindex; React lo quita solo
// cuando el mazo o el set carga de verdad (SERVED_FROM_FALLBACK en src/lib/seo.ts).
await writeFile(
  path.join(DIST, 'app-dynamic.html'),
  template.replace('<title>', '<meta name="robots" content="noindex" data-fallback />\n    <title>')
)
if (!template.includes('<div id="root"></div>')) throw new Error('[prerender] el index.html de Vite no tiene <div id="root"></div>')

const setMeta = (html, attr, key, value) =>
  html.replace(new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`), `$1${esc(value)}$2`)

function renderPage(r) {
  const url = SITE + r.path
  let html = template.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(r.title)}</title>`)
  html = setMeta(html, 'name', 'description', r.description)
  html = setMeta(html, 'property', 'og:title', r.title)
  html = setMeta(html, 'property', 'og:description', r.description)
  if (r.image?.ok) {
    html = setMeta(html, 'property', 'og:image', `${SITE}/${r.image.file}`)
    html = setMeta(html, 'property', 'og:image:alt', r.image.alt)
    html = setMeta(html, 'name', 'twitter:image', `${SITE}/${r.image.file}`)
  }
  const head = [
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<script type="application/ld+json">${JSON.stringify(pageGraph(r)).replace(/</g, '\\u003c')}</script>`,
  ]
  html = html.replace(/\s*<\/head>/, `\n    ${head.join('\n    ')}\n  </head>`)
  html = html.replace(/\s*<noscript>[\s\S]*?<\/noscript>/, '')
  return html.replace('<div id="root"></div>', `<div id="root">${layout(r.main)}</div>`)
}

// Imágenes para redes de los mazos. Un fallo aquí no debe romper el build: el generador
// se importa de forma diferida porque depende de un binario nativo (resvg).
let images = 0
const renderDeckImage = await import('./og-image.mjs').then((m) => m.renderDeckImage).catch((err) => {
  console.warn(`[prerender] aviso: generador de imágenes no disponible (${err.message}); los mazos usan la imagen genérica.`)
  return null
})
for (const r of renderDeckImage ? routes.filter((x) => x.image) : []) {
  try {
    const file = path.join(DIST, r.image.file)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, await renderDeckImage(r.image.data))
    r.image.ok = true
    images++
  } catch (err) {
    console.warn(`[prerender] aviso: no se pudo generar la imagen de ${r.path} (${err.message}); usa la genérica.`)
  }
}

for (const r of routes) {
  // Con "cleanUrls" en vercel.json, /decks sirve decks.html y /decks/17 sirve decks/17.html.
  const file = r.path === '/' ? path.join(DIST, 'index.html') : path.join(DIST, `${r.path.slice(1)}.html`)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, renderPage(r))
}

// Sitemap con todas las rutas prerenderizadas (sustituye al estático de public/).
const lastmod = (r) => {
  const d = r.path.startsWith('/decks/') && decks.find((x) => `/decks/${x.id}` === r.path)
  if (d) return isoDay(d.updated_at || d.created_at)
  if (r.path === '/faq') return pageMeta.faq.reviewed
  return Object.values(infoPages).find((pg) => pg.path === r.path)?.updated || null
}
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map((r) => {
    const lm = lastmod(r)
    return `  <url><loc>${SITE}${r.path}</loc>${lm ? `<lastmod>${lm}</lastmod>` : ''}</url>`
  })
  .join('\n')}
</urlset>
`
await writeFile(path.join(DIST, 'sitemap.xml'), sitemap)

// llms.txt: resumen del sitio para asistentes de IA (https://llmstxt.org).
const llms = `# AIForge

> AIForge es una plataforma web gratuita para crear y optimizar mazos de Marvel Champions: The Card Game con inteligencia artificial: constructor de mazos, recomendaciones de mazo para cada villano, registro de partidas y mazos públicos de la comunidad. Web en español.

- Los mazos válidos tienen entre 40 y 50 cartas en total, incluidas las 15 cartas propias del héroe.
- La recomendación con IA elige héroe, aspecto y cartas para un villano y dificultad concretos, a partir de las partidas registradas.
- Proyecto de fin de grado, sin ánimo de lucro. Contacto: aiforge.soporte@gmail.com

## Secciones

- [Mazos públicos](${SITE}/decks): mazos creados por la comunidad${decks.length ? ` (${decks.length})` : ''}, con héroe, aspecto y lista de cartas
- [Cartas por set](${SITE}/cards): catálogo de cartas${sets.length ? ` (${totalSetCards} cartas en ${sets.length} sets)` : ''}
- [Buscador de cartas](${SITE}/cards/search): búsqueda por nombre, tipo, aspecto, coste y set
- [Historial de partidas](${SITE}/games-history): partidas registradas con villano, dificultad y resultado
- [Preguntas frecuentes](${SITE}/faq): cómo funciona AIForge
- [Sobre AIForge](${SITE}/about): quién lo hace y cómo funciona el modelo de IA (SVM entrenado con las partidas registradas)
- [Política de privacidad](${SITE}/privacy): qué datos se guardan y para qué

## Opcional

- [Sitemap](${SITE}/sitemap.xml)
`
await writeFile(path.join(DIST, 'llms.txt'), llms)

console.log(`[prerender] ${routes.length} páginas + app.html, sitemap.xml (${routes.length} URLs), llms.txt y ${images} imágenes de mazo`)
