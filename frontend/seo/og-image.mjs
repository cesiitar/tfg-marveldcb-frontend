// Imagen para compartir en redes (Open Graph, 1200x630) de cada mazo.
// Se genera en el build sin navegador: satori compone el SVG y resvg lo pasa a PNG.
// Mismo lenguaje visual que public/og-image.png (fondo tinta, trama de puntos, carmesí),
// con el color del aspecto del mazo como acento.
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'

const require = createRequire(import.meta.url)
const font = (pkg, file) => readFile(require.resolve(`${pkg}/files/${file}`))

const fonts = [
  { name: 'Archivo', weight: 800, style: 'normal', data: await font('@fontsource/archivo', 'archivo-latin-800-normal.woff') },
  { name: 'Archivo', weight: 800, style: 'normal', data: await font('@fontsource/archivo', 'archivo-latin-ext-800-normal.woff') },
  { name: 'Geist', weight: 400, style: 'normal', data: await font('@fontsource/geist-sans', 'geist-sans-latin-400-normal.woff') },
  { name: 'Geist', weight: 600, style: 'normal', data: await font('@fontsource/geist-sans', 'geist-sans-latin-600-normal.woff') },
  { name: 'Geist Mono', weight: 500, style: 'normal', data: await font('@fontsource/geist-mono', 'geist-mono-latin-500-normal.woff') },
]

// Color e icono por aspecto (los mismos colores que usa la web para cada aspecto).
const ASPECTS = {
  aggression: { color: '#DC2626', label: 'Aggression', icon: 'M56 200 208 48M160 48h48v48M72 136l48 48M56 200l-24 24' },
  justice: { color: '#D97706', label: 'Justice', icon: 'M128 40v176M88 216h80M56 88l144-24M24 168l32-80 32 80a32 32 0 0 1-64 0zM168 144l32-80 32 80a32 32 0 0 1-64 0z' },
  leadership: { color: '#0284C7', label: 'Leadership', icon: 'M48 184 32 72l56 48 40-72 40 72 56-48-16 112zM48 216h160' },
  protection: { color: '#16A34A', label: 'Protection', icon: 'M40 56h176v56c0 84-88 112-88 112S40 196 40 112z' },
  pool: { color: '#0D9488', label: 'Pool', icon: 'M128 24l30 70 76 6-58 50 18 74-66-40-66 40 18-74-58-50 76-6z' },
}
const DEFAULT_ASPECT = { color: '#B8263D', label: '', icon: 'M128 24l30 70 76 6-58 50 18 74-66-40-66 40 18-74-58-50 76-6z' }

const h = (type, style, children, props = {}) => ({ type, props: { style, children, ...props } })

/** Devuelve el PNG (Buffer) de la imagen social de un mazo. */
export async function renderDeckImage({ name, hero, aspect, cards, creator }) {
  const a = ASPECTS[(aspect || '').toLowerCase()] || DEFAULT_ASPECT
  const title = name.length > 70 ? `${name.slice(0, 68).trimEnd()}…` : name
  const titleSize = title.length <= 18 ? 84 : title.length <= 34 ? 68 : 54

  const chip = (children, extra = {}) =>
    h('div', { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderRadius: 999, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', fontSize: 28, fontWeight: 600, color: '#fff', ...extra }, children)

  const tree = h('div', { width: 1200, height: 630, display: 'flex', position: 'relative', background: '#1B1A18', color: '#fff', fontFamily: 'Geist' }, [
    // trama de puntos + resplandor del color del aspecto + barra lateral
    h('div', { position: 'absolute', top: 0, left: 0, width: 1200, height: 630, backgroundImage: 'radial-gradient(circle at 8px 8px, rgba(255,255,255,0.09) 1px, transparent 1.4px)', backgroundSize: '16px 16px' }),
    h('div', { position: 'absolute', top: -260, left: 660, width: 760, height: 760, borderRadius: 380, backgroundImage: `radial-gradient(circle, ${a.color}99, ${a.color}00 65%)` }),
    h('div', { position: 'absolute', top: 0, left: 0, width: 14, height: 630, background: a.color }),

    // columna de texto
    h('div', { position: 'absolute', top: 0, left: 90, width: 700, height: 630, display: 'flex', flexDirection: 'column', justifyContent: 'center' }, [
      h('div', { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }, [
        h('div', { width: 56, height: 56, borderRadius: 14, background: '#B8263D', display: 'flex', alignItems: 'center', justifyContent: 'center' },
          h('svg', {}, h('path', {}, undefined, { d: 'M7 25 16 6l9 19h-5l-4-9-4 9z', fill: '#fff' }), { width: 34, height: 34, viewBox: '0 0 32 32' })),
        h('div', { display: 'flex', fontFamily: 'Archivo', fontWeight: 800, fontSize: 40, letterSpacing: -1 }, [h('span', {}, 'AI'), h('span', { color: '#E26577' }, 'Forge')]),
      ]),
      h('div', { fontFamily: 'Geist Mono', fontSize: 20, letterSpacing: 4, color: '#A29D93', marginBottom: 18 }, 'MAZO DE MARVEL CHAMPIONS'),
      h('div', { display: 'block', fontFamily: 'Archivo', fontWeight: 800, fontSize: titleSize, lineHeight: 1.02, letterSpacing: -2, lineClamp: 3 }, title),
      h('div', { display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 34 }, [
        chip(hero || 'Héroe'),
        ...(a.label ? [chip([h('div', { width: 16, height: 16, borderRadius: 8, background: a.color }), h('span', {}, a.label)])] : []),
      ]),
    ]),

    // pie
    h('div', { position: 'absolute', left: 90, bottom: 46, display: 'flex', fontSize: 24, color: '#CBC7BE' }, `${cards} cartas${creator ? ` · por ${creator}` : ''}`),
    h('div', { position: 'absolute', right: 60, bottom: 48, display: 'flex', fontFamily: 'Geist Mono', fontSize: 20, letterSpacing: 4, color: '#A29D93' }, 'AIFORGEDECKS.COM'),

    // carta del aspecto
    h('div', { position: 'absolute', top: 150, left: 880, width: 230, height: 322, borderRadius: 24, background: a.color, border: '1px solid rgba(255,255,255,0.28)', transform: 'rotate(8deg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 22, boxShadow: '0 30px 60px rgba(0,0,0,0.55)' }, [
      h('div', { display: 'flex', fontFamily: 'Geist Mono', fontSize: 16, letterSpacing: 3, color: 'rgba(255,255,255,0.92)' }, (a.label || 'AIForge').toUpperCase()),
      h('div', { display: 'flex', justifyContent: 'center' },
        h('svg', {}, h('path', {}, undefined, { d: a.icon, fill: 'none', stroke: '#fff', 'stroke-width': 14, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }), { width: 110, height: 110, viewBox: '0 0 256 256' })),
      h('div', { width: 56, height: 8, borderRadius: 8, background: 'rgba(255,255,255,0.5)' }),
    ]),
  ])

  const svg = await satori(tree, { width: 1200, height: 630, fonts })
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()
}
