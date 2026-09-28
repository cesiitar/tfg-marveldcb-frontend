// Revelados al entrar en pantalla (IntersectionObserver vía Motion, una sola vez).
// Solo animan transform y opacity con la cadena `transform` completa para que
// Motion pueda acelerarlo por hardware. Con "reducir movimiento" solo hay fundido.
import { m, useReducedMotion, type HTMLMotionProps, type Variants } from 'motion/react'

import { cn } from '@/lib/utils'

export const easeOut = [0.23, 1, 0.32, 1] as const

const viewport = { once: true, margin: '0px 0px -12% 0px' } as const

export interface RevealProps extends HTMLMotionProps<'div'> {
  /** Retraso en segundos. */
  delay?: number
  /** Desplazamiento vertical inicial en px. */
  y?: number
}

export function Reveal({ delay = 0, y = 28, className, ...props }: RevealProps) {
  const reduce = useReducedMotion()
  return (
    <m.div
      data-slot="reveal"
      initial={{ opacity: 0, transform: `translateY(${reduce ? 0 : y}px)` }}
      whileInView={{ opacity: 1, transform: 'translateY(0px)' }}
      viewport={viewport}
      transition={reduce ? { duration: 0.25 } : { duration: 0.8, ease: easeOut, delay }}
      className={cn(className)}
      {...props}
    />
  )
}

export interface RevealGroupProps extends HTMLMotionProps<'div'> {
  /** Separación entre hijos en segundos (30-80 ms recomendado). */
  stagger?: number
  delay?: number
}

/** Contenedor que escalona la entrada de sus <RevealItem>. */
export function RevealGroup({ stagger = 0.07, delay = 0, className, ...props }: RevealGroupProps) {
  const variants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
  }
  return (
    <m.div
      data-slot="reveal-group"
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      className={cn(className)}
      {...props}
    />
  )
}

export type RevealItemProps = HTMLMotionProps<'div'>

export function RevealItem({ className, ...props }: RevealItemProps) {
  const reduce = useReducedMotion()
  const variants: Variants = {
    hidden: { opacity: 0, transform: reduce ? 'translateY(0px) scale(1)' : 'translateY(32px) scale(0.97)' },
    visible: {
      opacity: 1,
      transform: 'translateY(0px) scale(1)',
      transition: { duration: 0.8, ease: easeOut },
    },
  }
  return <m.div data-slot="reveal-item" variants={variants} className={cn(className)} {...props} />
}
