// Abanico de cartas (una por aspecto) que se despliega al cargar la home.
// Muelle con rebote suave; al pasar el ratón la carta se eleva.
import { m, useReducedMotion } from 'motion/react'
import { CrownIcon, ScalesIcon, ShieldIcon, SwordIcon, type Icon } from '@phosphor-icons/react'

import { cn } from '@/lib/utils'

interface FanCard {
  aspect: string
  Icon: Icon
  tone: string
  rotate: number
  x: number
}

const cards: FanCard[] = [
  { aspect: 'Aggression', Icon: SwordIcon, tone: 'bg-red-600', rotate: -15, x: -132 },
  { aspect: 'Justice', Icon: ScalesIcon, tone: 'bg-amber-600', rotate: -5, x: -44 },
  { aspect: 'Leadership', Icon: CrownIcon, tone: 'bg-sky-600', rotate: 5, x: 44 },
  { aspect: 'Protection', Icon: ShieldIcon, tone: 'bg-green-600', rotate: 15, x: 132 },
]

const place = (c: FanCard, lift = 0) =>
  `translateX(${c.x}px) translateY(${Math.abs(c.rotate) * 1.6 - lift}px) rotate(${c.rotate}deg)`

export function CardFan({ className }: { className?: string }) {
  const reduce = useReducedMotion()

  return (
    <div
      data-slot="card-fan"
      aria-hidden="true"
      className={cn('relative h-[300px] w-full select-none', className)}
    >
      {cards.map((card, i) => (
        <m.div
          key={card.aspect}
          className="absolute left-1/2 top-4 -ml-[76px] origin-bottom cursor-default"
          style={{ zIndex: i }}
          initial={
            reduce
              ? { opacity: 0, transform: place(card) }
              : { opacity: 0, transform: 'translateX(0px) translateY(80px) rotate(0deg)' }
          }
          animate={{ opacity: 1, transform: place(card) }}
          whileHover={{ transform: place(card, 22), transition: { type: 'spring', duration: 0.4, bounce: 0.3 } }}
          transition={
            reduce
              ? { duration: 0.25 }
              : { type: 'spring', duration: 1.1, bounce: 0.28, delay: 0.45 + i * 0.09 }
          }
        >
          <div
            className={cn(
              'relative w-[152px] h-[212px] rounded-2xl p-4 flex flex-col justify-between text-white overflow-hidden',
              'ring-1 ring-inset ring-white/25 shadow-[0_24px_48px_-16px_rgb(0_0_0/0.55)]',
              card.tone
            )}
          >
            <div className="absolute inset-0 halftone opacity-80" />
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent" />
            <div className="relative flex items-start justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/85">{card.aspect}</span>
              <span className="font-display text-xl font-extrabold leading-none">{i + 1}</span>
            </div>
            <card.Icon className="relative w-16 h-16 self-center drop-shadow" weight="duotone" />
            <div className="relative flex items-center justify-between">
              <span className="h-1.5 w-10 rounded-full bg-white/50" />
              <span className="font-mono text-[10px] text-white/70">AIF</span>
            </div>
          </div>
        </m.div>
      ))}
    </div>
  )
}
