// Carta con aspecto de carta física de Marvel Champions: marco del color del
// aspecto, burbuja de coste, icono según el tipo, cinta de tipo y nombre.
// Se usa en la página de un set y en la búsqueda de cartas.
import * as React from 'react'
import {
  ArrowFatLinesUpIcon,
  CardsIcon,
  CrownIcon,
  DiamondIcon,
  FlagBannerIcon,
  GhostIcon,
  HandshakeIcon,
  IdentificationCardIcon,
  LightningIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  MaskHappyIcon,
  MountainsIcon,
  PaperclipIcon,
  SkullIcon,
  TargetIcon,
  UsersIcon,
  WarningDiamondIcon,
  type Icon,
} from '@phosphor-icons/react'

import { cn } from '@/lib/utils'
import { getClassColor } from '@/utils/classColors'
import { translateCardType } from '@/utils/typeTranslations'
import { TiltCard } from '@/components/motion/tilt-card'

const typeIcons: Record<string, Icon> = {
  hero: MaskHappyIcon,
  alter_ego: IdentificationCardIcon,
  ally: UsersIcon,
  event: LightningIcon,
  upgrade: ArrowFatLinesUpIcon,
  support: HandshakeIcon,
  resource: DiamondIcon,
  attachment: PaperclipIcon,
  environment: MountainsIcon,
  minion: GhostIcon,
  villain: SkullIcon,
  leader: CrownIcon,
  obligation: LinkIcon,
  treachery: WarningDiamondIcon,
  'main scheme': FlagBannerIcon,
  main_scheme: FlagBannerIcon,
  'side scheme': TargetIcon,
  side_scheme: TargetIcon,
  player_side_scheme: TargetIcon,
}

// Tipos que en el juego no tienen coste (el backend les pone 0 por defecto)
const noCostTypes = new Set([
  'hero', 'alter_ego', 'villain', 'leader', 'minion', 'main scheme', 'main_scheme',
  'side scheme', 'side_scheme', 'treachery', 'attachment', 'environment', 'obligation',
])

function iconForType(type?: string | null): Icon {
  const t = (type || '').toLowerCase().trim()
  if (t.startsWith('evidence')) return MagnifyingGlassIcon
  return typeIcons[t] || CardsIcon
}

export interface GameCardProps extends Omit<React.ComponentPropsWithoutRef<'article'>, 'children'> {
  name: string
  /** Aspecto o clase de la carta (aggression, justice, hero, encounter...). */
  aspect?: string | null
  type?: string | null
  cost?: number | string | null
  /** Nombre del set, opcional (se muestra al pie). */
  setName?: string | null
}

export function GameCard({ name, aspect, type, cost, setName, className, ...props }: GameCardProps) {
  const TypeIcon = iconForType(type)
  const frame = getClassColor(aspect || undefined)
  const typeLabel = translateCardType(type)
  const normalizedType = (type || '').toLowerCase().trim()
  const hasCost =
    cost !== null && cost !== undefined && cost !== '' && !noCostTypes.has(normalizedType) && !normalizedType.startsWith('evidence')

  return (
    <article
      data-slot="game-card"
      aria-label={`${name}. ${typeLabel}${hasCost ? `, coste ${cost}` : ''}${aspect ? `, aspecto ${aspect}` : ''}`}
      className={cn('group h-full', className)}
      {...props}
    >
      <TiltCard
        maxTilt={9}
        spotlight="light"
        spotlightLayer="above"
        className={cn(
          'h-full aspect-[5/7] rounded-2xl p-[7px] shadow-md hover:shadow-2xl transition-shadow duration-300',
          frame
        )}
      >
        <div className="absolute inset-0 halftone opacity-70 pointer-events-none" aria-hidden="true" />
        <div className="relative z-[1] h-full rounded-[11px] bg-paper overflow-hidden flex flex-col ring-1 ring-black/10">
          {/* Ilustración: icono del tipo sobre el color del aspecto */}
          <div className={cn('relative h-[48%] flex items-center justify-center overflow-hidden', frame)}>
            <div className="absolute inset-0 halftone" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/25" aria-hidden="true" />
            <TypeIcon
              className="relative w-[34%] h-auto max-w-[3.5rem] text-white drop-shadow-md transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-6"
              weight="duotone"
              aria-hidden="true"
            />
            {hasCost && (
              <span className="absolute left-1.5 top-1.5 sm:left-2 sm:top-2 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-ink-900 text-white ring-2 ring-white/90 shadow-md flex items-center justify-center font-display text-base sm:text-lg font-extrabold leading-none tabular-nums">
                {cost}
              </span>
            )}
          </div>

          {/* Cinta de tipo */}
          <div className="relative -mt-3 mx-3 z-[1]">
            <span className="inline-block max-w-full truncate rounded-md bg-ink-900 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white shadow">
              {typeLabel}
            </span>
          </div>

          <div className="relative flex-1 flex flex-col px-3 pt-2 pb-3 overflow-hidden">
            <TypeIcon
              className="absolute -right-3 -bottom-3 w-20 h-20 text-ink-900/[0.05]"
              weight="fill"
              aria-hidden="true"
            />
            <h3 className="relative text-base sm:text-lg leading-tight text-ink-900 line-clamp-3" style={{ fontStretch: '85%' }}>
              {name}
            </h3>
            {(aspect || setName) && (
              <div className="relative mt-auto pt-2 space-y-1">
                {setName && (
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400 truncate">{setName}</p>
                )}
                {aspect && (
                  <div className="flex items-center gap-1.5">
                    <span className={cn('w-2 h-2 rotate-45', frame)} aria-hidden="true" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-500 truncate">{aspect}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </TiltCard>
    </article>
  )
}

export default GameCard
