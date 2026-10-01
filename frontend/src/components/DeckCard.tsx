// Tarjeta de mazo común a Mazos, Mis mazos y Favoritos (mismo diseño en toda la web).
// Solo presentación: las acciones (favorito, editar, borrar…) llegan desde cada página.
import React from 'react'
import { Link } from 'react-router-dom'
import { HeartIcon, UserIcon } from '@phosphor-icons/react'
import type { Deck } from '../types/card'
import { getClassColor, getClassPillClasses } from '../utils/classColors'

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

const totalCards = (deck: Deck) => (deck.cards || []).reduce((n, c) => n + (Number(c.quantity) || 1), 0)

/** Reparto de cartas por aspecto (clase), en porcentaje, para la mini barra. */
function aspectShare(deck: Deck) {
  const total = totalCards(deck)
  const byClass = (deck.cards || []).reduce<Record<string, number>>((acc, c) => {
    const clase = (c as { clase?: string }).clase || 'basic'
    acc[clase] = (acc[clase] || 0) + (Number(c.quantity) || 1)
    return acc
  }, {})
  return Object.entries(byClass)
    .map(([clase, n]) => ({ clase, pct: total ? (n / total) * 100 : 0 }))
    .sort((a, b) => b.pct - a.pct)
}

const DeckCard: React.FC<DeckCardProps> = ({ deck, linkable = true, onNavigate, highlighted, favorite, actions, headingLevel = 'h2', id }) => {
  const Heading = headingLevel
  const aspect = deck.aspect
  const share = aspectShare(deck)
  const cards = totalCards(deck)

  return (
    <article
      id={id}
      className={`group deck-card relative flex flex-col has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-brand-500 ${
        highlighted ? 'border-brand-500 ring-2 ring-brand-500/30 shadow-lg' : ''
      }`}
    >
      <span className={`h-1 w-full ${aspect ? getClassColor(aspect) : 'bg-ink-300'}`} aria-hidden="true" />

      <div className="flex-1 px-4 pt-3.5 pb-4">
        <div className="flex items-center justify-between gap-3">
          {aspect ? (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${getClassPillClasses(aspect)}`}>
              <span className={`w-1.5 h-1.5 rotate-45 ${getClassColor(aspect)}`} aria-hidden="true" />
              {aspect}
            </span>
          ) : (
            <span />
          )}

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
                className={`relative z-10 -my-1 -mr-1.5 inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold tabular-nums transition-colors ${
                  favorite.active ? 'text-brand-600 hover:bg-brand-50' : 'text-ink-400 hover:text-brand-600 hover:bg-brand-50'
                }`}
              >
                <HeartIcon className="w-[18px] h-[18px]" weight={favorite.active ? 'fill' : 'regular'} aria-hidden="true" />
                {favorite.count}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink-400 tabular-nums" title="Favoritos">
                <HeartIcon className="w-4 h-4 text-brand-500" weight="fill" aria-hidden="true" />
                {favorite.count}
              </span>
            ))}
        </div>

        <Heading className="mt-3 font-display text-lg font-extrabold leading-snug text-ink-900 line-clamp-2 group-hover:text-brand-700 transition-colors">
          {linkable ? (
            <Link
              to={`/decks/${deck.id}`}
              onClick={onNavigate}
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            >
              {deck.name}
            </Link>
          ) : (
            deck.name
          )}
        </Heading>

        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-600">
          <UserIcon className="w-4 h-4 text-ink-400" weight="duotone" aria-hidden="true" />
          <span className="font-semibold text-ink-800 truncate">{deck.hero_name || 'Héroe desconocido'}</span>
        </p>

        {share.length > 0 && (
          <div className="mt-4 flex h-1.5 w-full overflow-hidden rounded-full bg-ink-100" aria-hidden="true">
            {share.map(({ clase, pct }) => (
              <div key={clase} className={`h-full ${getClassColor(clase)}`} style={{ width: `${pct}%` }} />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-ink-100 px-4 py-2.5 text-xs text-ink-500">
        <span className="min-w-0 truncate">
          por <span className="font-semibold text-ink-700">{deck.creator_name || 'Anónimo'}</span>
        </span>
        <span className="flex-shrink-0 tabular-nums">
          <span className="font-semibold text-ink-700">{cards}</span> cartas
          {deck.created_at && (
            <>
              {' · '}
              <time dateTime={deck.created_at}>
                {new Date(deck.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
              </time>
            </>
          )}
        </span>
      </div>

      {actions && <div className="relative z-10 border-t border-ink-100 p-3">{actions}</div>}
    </article>
  )
}

export default DeckCard
