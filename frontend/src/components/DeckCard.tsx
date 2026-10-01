// Tarjeta de mazo común a Mazos, Mis mazos y Favoritos.
// Habla el mismo idioma que GameCard (las cartas de la página de un set): marco del
// color del aspecto con trama de cómic, "ilustración" con el icono del aspecto, burbuja
// con el número de cartas y cinta de tipo. Sin imágenes: la energía la dan el color,
// la forma y la tipografía. Solo presentación; las acciones llegan desde cada página.
import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowFatLinesUpIcon, CardsIcon, CardsThreeIcon, CrownSimpleIcon, DiamondIcon, HandshakeIcon, HeartIcon, LightningIcon, ScalesIcon, ShieldIcon, StarFourIcon, SwordIcon, TargetIcon, UsersIcon, type Icon } from '@phosphor-icons/react'
import type { Deck } from '../types/card'
import { getClassColor } from '../utils/classColors'
import { TiltCard } from './motion/tilt-card'

interface FavoriteSlot {
  active: boolean
  count: number
  /** Sin onToggle se muestra solo el contador. */
  onToggle?: () => void
  label?: string
}

interface DeckCardProps {
  deck: Deck
  /** Toda la tarjeta enlaza al mazo (enlace real, rastreable). */
  linkable?: boolean
  onNavigate?: () => void
  /** Resalta la tarjeta (último mazo visto). */
  highlighted?: boolean
  favorite?: FavoriteSlot
  /** Botones propios de la página (p. ej. editar o registrar partida en Mis mazos). */
  actions?: React.ReactNode
  headingLevel?: 'h2' | 'h3'
  id?: string
}

// Icono de cada aspecto: el mismo que llevan las imágenes para compartir de los mazos
const aspectIcons: Record<string, Icon> = {
  aggression: SwordIcon,
  justice: ScalesIcon,
  leadership: CrownSimpleIcon,
  protection: ShieldIcon,
  pool: StarFourIcon,
}

const totalCards = (deck: Deck) => (deck.cards || []).reduce((n, c) => n + (Number(c.quantity) || 1), 0)

// Tipos de carta de jugador: icono (el mismo que en GameCard) y nombre en plural
const cardTypes: Record<string, { icon: Icon; label: string }> = {
  ally: { icon: UsersIcon, label: 'Aliados' },
  event: { icon: LightningIcon, label: 'Eventos' },
  upgrade: { icon: ArrowFatLinesUpIcon, label: 'Mejoras' },
  support: { icon: HandshakeIcon, label: 'Apoyos' },
  resource: { icon: DiamondIcon, label: 'Recursos' },
  player_side_scheme: { icon: TargetIcon, label: 'Planes' },
}

/** Las tres categorías de carta con más copias en el mazo. */
function topCardTypes(deck: Deck) {
  const byType = (deck.cards || []).reduce<Record<string, number>>((acc, c) => {
    const type = ((c as { type?: string }).type || '').toLowerCase()
    if (type) acc[type] = (acc[type] || 0) + (Number(c.quantity) || 1)
    return acc
  }, {})
  return Object.entries(byType)
    .map(([type, n]) => ({ type, n, ...(cardTypes[type] || { icon: CardsIcon, label: type.replace(/_/g, ' ') }) }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 3)
}

const DeckCard: React.FC<DeckCardProps> = ({ deck, linkable = true, onNavigate, highlighted, favorite, actions, headingLevel = 'h2', id }) => {
  const Heading = headingLevel
  const aspect = (deck.aspect || '').toLowerCase()
  const frame = aspect ? getClassColor(aspect) : 'bg-ink-700'
  const AspectIcon = aspectIcons[aspect] || CardsThreeIcon
  const types = topCardTypes(deck)
  const cards = totalCards(deck)
  const hero = deck.hero_name || 'Héroe desconocido'

  return (
    <article
      id={id}
      data-slot="deck-card"
      className={`group relative h-full rounded-2xl has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-brand-500 has-[a:focus-visible]:ring-offset-2 ${
        highlighted ? 'ring-[3px] ring-brand-500 ring-offset-2 ring-offset-paper' : ''
      }`}
    >
      <TiltCard
        maxTilt={5}
        spotlight="light"
        spotlightLayer="above"
        className={`h-full rounded-2xl p-[6px] shadow-md transition-shadow duration-300 group-hover:shadow-xl ${frame}`}
      >
        {/* Trama de cómic sobre el marco */}
        <div className="absolute inset-0 halftone opacity-70 pointer-events-none rounded-2xl" aria-hidden="true" />

        <div className="relative z-[1] h-full flex flex-col overflow-hidden rounded-[11px] bg-white ring-1 ring-black/10">
          {/* "Ilustración": color del aspecto, icono y el héroe como titular */}
          <div className={`relative h-[7.5rem] overflow-hidden ${frame}`}>
            <div className="absolute inset-0 halftone" aria-hidden="true" />
            <AspectIcon
              className="absolute -right-4 -top-3 w-32 h-32 text-white/25 transition-transform duration-500 ease-out group-hover:-rotate-12 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:transform-none"
              weight="duotone"
              aria-hidden="true"
            />
            {/* Degradado para que el texto blanco tenga contraste sobre cualquier aspecto */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" aria-hidden="true" />

            {/* Burbuja de cartas, como la de coste de una carta */}
            <span
              className="absolute left-2.5 top-2.5 flex h-11 w-11 flex-col items-center justify-center rounded-full bg-ink-900 text-white ring-2 ring-white/90 shadow-md"
              title={`${cards} cartas`}
            >
              <span className="font-display text-base font-extrabold leading-none tabular-nums">{cards}</span>
              <span className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-ink-300">cartas</span>
            </span>

            {favorite &&
              (favorite.onToggle ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    favorite.onToggle!()
                  }}
                  aria-pressed={favorite.active}
                  aria-label={favorite.label || (favorite.active ? 'Eliminar de favoritos' : 'Añadir a favoritos')}
                  title={favorite.label || (favorite.active ? 'Eliminar de favoritos' : 'Añadir a favoritos')}
                  className={`absolute right-2.5 top-2.5 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums shadow-sm ring-1 ring-black/10 transition-colors duration-200 ${
                    favorite.active ? 'bg-white text-brand-600 hover:bg-brand-50' : 'bg-white/90 text-ink-600 hover:bg-white hover:text-brand-600'
                  }`}
                >
                  <HeartIcon className="w-4 h-4" weight={favorite.active ? 'fill' : 'bold'} aria-hidden="true" />
                  {favorite.count}
                </button>
              ) : (
                <span
                  className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-sm font-semibold text-ink-700 tabular-nums shadow-sm ring-1 ring-black/10"
                  title="Favoritos"
                >
                  <HeartIcon className="w-4 h-4 text-brand-600" weight="fill" aria-hidden="true" />
                  {favorite.count}
                </span>
              ))}

            {/* Héroe como titular de cómic */}
            <p
              className="absolute inset-x-3 bottom-4 truncate font-display text-[1.65rem] font-extrabold uppercase leading-none text-white [text-shadow:0_2px_0_rgb(0_0_0/0.35)]"
              style={{ fontStretch: '78%' }}
            >
              {hero}
            </p>
          </div>

          {/* Cinta de tipo, como en las cartas */}
          <div className="relative z-[1] -mt-3 mx-3">
            <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-md bg-ink-900 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white shadow">
              Mazo
              {aspect && (
                <>
                  <span className="text-ink-500" aria-hidden="true">·</span>
                  <span className={`h-1.5 w-1.5 rotate-45 ${frame}`} aria-hidden="true" />
                  {aspect}
                </>
              )}
            </span>
          </div>

          {/* Sin "relative": así el enlace estirado cubre la tarjeta entera, ilustración incluida */}
          <div className="flex flex-1 flex-col px-3.5 pt-2.5 pb-3">
            <Heading
              className="font-display text-lg font-extrabold leading-tight text-ink-900 line-clamp-2 transition-colors duration-200 group-hover:text-brand-700"
              style={{ fontStretch: '88%' }}
            >
              {linkable ? (
                <Link
                  to={`/decks/${deck.id}`}
                  onClick={onNavigate}
                  className="after:absolute after:inset-0 after:z-[5] after:content-[''] focus-visible:outline-none"
                >
                  {deck.name}
                </Link>
              ) : (
                deck.name
              )}
            </Heading>

            {/* Lo que lleva el mazo: las tres categorías de carta con más copias */}
            {types.length > 0 && (
              <dl className="mt-3 grid grid-cols-3 divide-x divide-ink-100 rounded-lg bg-ink-50 ring-1 ring-inset ring-ink-900/[0.05]">
                {types.map(({ type, n, icon: TypeIcon, label }) => (
                  // dt antes que dd en el DOM; flex-col-reverse deja el número arriba a la vista
                  <div key={type} className="flex flex-col-reverse items-center px-1 py-1.5">
                    <dt className="mt-1 truncate max-w-full font-mono text-[9px] uppercase tracking-[0.12em] text-ink-500">{label}</dt>
                    <dd className="flex items-center gap-1 font-display text-base font-extrabold leading-none text-ink-900 tabular-nums">
                      <TypeIcon className="w-3.5 h-3.5 text-ink-400" weight="duotone" aria-hidden="true" />
                      {n}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="mt-auto flex items-center justify-between gap-3 pt-3 text-xs text-ink-500">
              <span className="min-w-0 truncate">
                por <span className="font-semibold text-ink-800">{deck.creator_name || 'Anónimo'}</span>
              </span>
              {deck.created_at && (
                <time dateTime={deck.created_at} className="flex-shrink-0 tabular-nums">
                  {new Date(deck.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </time>
              )}
            </div>
          </div>

          {actions && <div className="relative z-10 border-t border-ink-100 bg-ink-50/60 p-3">{actions}</div>}
        </div>
      </TiltCard>
    </article>
  )
}

export default DeckCard
